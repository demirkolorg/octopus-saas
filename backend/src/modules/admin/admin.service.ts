import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all users with stats
   */
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sources: true,
            sites: true,
            categories: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sources: true,
            sites: true,
            categories: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  /**
   * Update user role
   */
  async updateUserRole(id: string, role: Role, currentUserId: string) {
    // Prevent self role change
    if (id === currentUserId) {
      throw new BadRequestException('Cannot change your own role');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete user
   */
  async deleteUser(id: string, currentUserId: string) {
    // Prevent self deletion
    if (id === currentUserId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  /**
   * Get system status and statistics
   */
  async getSystemStatus() {
    const [
      totalUsers,
      totalSources,
      systemSources,
      totalArticles,
      todayArticles,
      totalSites,
      totalCategories,
      recentCrawlJobs,
    ] = await Promise.all([
      // Users count
      this.prisma.user.count(),
      // Total sources
      this.prisma.source.count(),
      // System sources
      this.prisma.source.count({ where: { isSystem: true } }),
      // Total articles
      this.prisma.article.count(),
      // Today's articles
      this.prisma.article.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // Total sites
      this.prisma.site.count(),
      // Total categories
      this.prisma.category.count(),
      // Recent crawl jobs (last 10)
      this.prisma.crawlJob.findMany({
        take: 10,
        orderBy: { startedAt: 'desc' },
        include: {
          source: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    // Get crawl job stats
    const [pendingJobs, runningJobs, completedJobs, failedJobs] = await Promise.all([
      this.prisma.crawlJob.count({ where: { status: 'PENDING' } }),
      this.prisma.crawlJob.count({ where: { status: 'RUNNING' } }),
      this.prisma.crawlJob.count({ where: { status: 'COMPLETED' } }),
      this.prisma.crawlJob.count({ where: { status: 'FAILED' } }),
    ]);

    // Get active sources (crawled in last 24 hours)
    const activeSources = await this.prisma.source.count({
      where: {
        lastCrawlAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      users: {
        total: totalUsers,
      },
      sources: {
        total: totalSources,
        system: systemSources,
        active: activeSources,
      },
      articles: {
        total: totalArticles,
        today: todayArticles,
      },
      sites: {
        total: totalSites,
      },
      categories: {
        total: totalCategories,
      },
      crawlJobs: {
        pending: pendingJobs,
        running: runningJobs,
        completed: completedJobs,
        failed: failedJobs,
        recent: recentCrawlJobs,
      },
    };
  }

  /**
   * Get system sources
   */
  async getSystemSources() {
    return this.prisma.source.findMany({
      where: { isSystem: true },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
