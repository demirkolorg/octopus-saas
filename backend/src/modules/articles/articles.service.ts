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
    const { page = 1, limit = 20, sourceId, isRead, search, watchOnly, todayOnly } = query;
    const skip = (page - 1) * limit;

    // Build where clause - include user's sources AND system sources
    const where: any = {
      source: {
        OR: [
          { userId },
          { isSystem: true },
        ],
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
        { summary: { contains: search, mode: 'insensitive' } },
        { source: { name: { contains: search, mode: 'insensitive' } } },
        { source: { site: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    // Filter only articles that match user's watch keywords
    if (watchOnly) {
      where.watchMatches = {
        some: {
          watchKeyword: {
            userId: userId,
          },
        },
      };
    }

    // Filter only today's articles
    if (todayOnly) {
      const turkeyStartOfDay = this.getTurkeyStartOfDay();
      where.createdAt = {
        gte: turkeyStartOfDay,
      };
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
              site: {
                select: {
                  id: true,
                  name: true,
                  domain: true,
                  logoUrl: true,
                },
              },
              category: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
                  color: true,
                },
              },
            },
          },
          group: {
            select: {
              id: true,
              title: true,
              _count: {
                select: { articles: true },
              },
            },
          },
          watchMatches: {
            where: {
              watchKeyword: {
                userId: userId,
              },
            },
            include: {
              watchKeyword: {
                select: {
                  id: true,
                  keyword: true,
                  color: true,
                },
              },
            },
          },
        },
        orderBy: [
          { isRead: 'asc' },  // Unread (false) first
          { createdAt: 'desc' },  // Then by crawl date (newest first)
        ],
        skip,
        take: limit,
      }),
    ]);

    // Get all group IDs that have multiple sources
    const groupIds = articles
      .filter((a) => a.group && a.group._count.articles > 1)
      .map((a) => a.group!.id);

    // Fetch related sources for each group (with article URLs)
    const relatedSourcesMap = new Map<string, any[]>();
    if (groupIds.length > 0) {
      const groupedArticles = await this.prisma.article.findMany({
        where: {
          groupId: { in: groupIds },
        },
        select: {
          groupId: true,
          url: true,
          source: {
            select: {
              id: true,
              name: true,
              site: {
                select: {
                  id: true,
                  name: true,
                  domain: true,
                  logoUrl: true,
                },
              },
              category: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
                  color: true,
                },
              },
            },
          },
        },
      });

      // Group by groupId and deduplicate by source.id
      for (const ga of groupedArticles) {
        if (!ga.groupId) continue;
        if (!relatedSourcesMap.has(ga.groupId)) {
          relatedSourcesMap.set(ga.groupId, []);
        }
        const sources = relatedSourcesMap.get(ga.groupId)!;
        // Avoid duplicates - include articleUrl for each source
        if (!sources.find((s) => s.id === ga.source.id)) {
          sources.push({
            ...ga.source,
            articleUrl: ga.url,
          });
        }
      }
    }

    // Transform articles to include sourceCount and relatedSources from group
    const transformedArticles = articles.map((article) => ({
      ...article,
      sourceCount: article.group ? article.group._count.articles : 1,
      group: article.group
        ? { id: article.group.id, title: article.group.title }
        : null,
      relatedSources: article.groupId
        ? relatedSourcesMap.get(article.groupId) || []
        : [],
    }));

    const lastPage = Math.ceil(total / limit);

    return {
      data: transformedArticles,
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
          OR: [
            { userId },
            { isSystem: true },
          ],
        },
      },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            url: true,
            site: {
              select: {
                id: true,
                name: true,
                domain: true,
                logoUrl: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
                color: true,
              },
            },
          },
        },
        watchMatches: {
          where: {
            watchKeyword: {
              userId: userId,
            },
          },
          include: {
            watchKeyword: {
              select: {
                id: true,
                keyword: true,
                color: true,
              },
            },
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
        OR: [
          { userId },
          { isSystem: true },
        ],
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
   * Get start of day in Turkey timezone (UTC+3)
   */
  private getTurkeyStartOfDay(): Date {
    const now = new Date();
    // Turkey is UTC+3 (no daylight saving since 2016)
    const turkeyOffsetMinutes = 3 * 60;

    // Get current time in Turkey
    const turkeyTime = new Date(now.getTime() + (turkeyOffsetMinutes + now.getTimezoneOffset()) * 60000);

    // Set to start of day in Turkey
    turkeyTime.setHours(0, 0, 0, 0);

    // Convert back to UTC for database query
    return new Date(turkeyTime.getTime() - turkeyOffsetMinutes * 60000);
  }

  /**
   * Get article statistics for user
   */
  async getStats(userId: string) {
    const sourceFilter = {
      OR: [
        { userId },
        { isSystem: true },
      ],
    };

    const turkeyStartOfDay = this.getTurkeyStartOfDay();

    const [total, unread, todayCount, watchCount] = await Promise.all([
      this.prisma.article.count({
        where: { source: sourceFilter },
      }),
      this.prisma.article.count({
        where: { source: sourceFilter, isRead: false },
      }),
      this.prisma.article.count({
        where: {
          source: sourceFilter,
          createdAt: {
            gte: turkeyStartOfDay,
          },
        },
      }),
      this.prisma.article.count({
        where: {
          source: sourceFilter,
          watchMatches: {
            some: {
              watchKeyword: {
                userId: userId,
              },
            },
          },
        },
      }),
    ]);

    return {
      total,
      unread,
      todayCount,
      watchCount,
    };
  }
}
