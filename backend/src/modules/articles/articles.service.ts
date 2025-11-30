import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticleQueryDto, PaginatedArticlesResponse } from './dto';
import { Article } from '@prisma/client';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get paginated articles with filters
   */
  async findAll(
    userId: string,
    query: ArticleQueryDto,
  ): Promise<PaginatedArticlesResponse<Article>> {
    const { page = 1, limit = 20, sourceId, isRead, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      source: {
        userId,
      },
    };

    if (sourceId) {
      where.sourceId = sourceId;
    }

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count and articles in parallel
    const [total, articles] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        include: {
          source: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return {
      data: articles,
      meta: {
        total,
        page,
        limit,
        lastPage,
      },
    };
  }

  /**
   * Get a single article by ID
   */
  async findOne(id: string, userId: string): Promise<Article> {
    const article = await this.prisma.article.findFirst({
      where: {
        id,
        source: {
          userId,
        },
      },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    return article;
  }

  /**
   * Mark article as read
   */
  async markAsRead(id: string, userId: string): Promise<Article> {
    // Verify article belongs to user
    await this.findOne(id, userId);

    return this.prisma.article.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark article as unread
   */
  async markAsUnread(id: string, userId: string): Promise<Article> {
    // Verify article belongs to user
    await this.findOne(id, userId);

    return this.prisma.article.update({
      where: { id },
      data: { isRead: false },
    });
  }

  /**
   * Mark all articles as read for a source
   */
  async markAllAsRead(userId: string, sourceId?: string): Promise<{ count: number }> {
    const where: any = {
      isRead: false,
      source: {
        userId,
      },
    };

    if (sourceId) {
      where.sourceId = sourceId;
    }

    const result = await this.prisma.article.updateMany({
      where,
      data: { isRead: true },
    });

    return { count: result.count };
  }

  /**
   * Get article statistics for user
   */
  async getStats(userId: string) {
    const [total, unread, todayCount] = await Promise.all([
      this.prisma.article.count({
        where: { source: { userId } },
      }),
      this.prisma.article.count({
        where: { source: { userId }, isRead: false },
      }),
      this.prisma.article.count({
        where: {
          source: { userId },
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      total,
      unread,
      todayCount,
    };
  }
}
