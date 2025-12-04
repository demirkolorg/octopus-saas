import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all tags for a user
   */
  async findAll(userId: string) {
    return this.prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: { articles: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create a new tag
   */
  async create(userId: string, name: string, color?: string) {
    // Check if tag already exists
    const existing = await this.prisma.tag.findUnique({
      where: {
        userId_name: { userId, name },
      },
    });

    if (existing) {
      throw new ConflictException('Bu isimde bir etiket zaten var');
    }

    return this.prisma.tag.create({
      data: {
        userId,
        name,
        color: color || '#6366f1',
      },
    });
  }

  /**
   * Update a tag
   */
  async update(userId: string, tagId: string, data: { name?: string; color?: string }) {
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, userId },
    });

    if (!tag) {
      throw new NotFoundException('Etiket bulunamadı');
    }

    // Check for duplicate name
    if (data.name && data.name !== tag.name) {
      const existing = await this.prisma.tag.findUnique({
        where: {
          userId_name: { userId, name: data.name },
        },
      });

      if (existing) {
        throw new ConflictException('Bu isimde bir etiket zaten var');
      }
    }

    return this.prisma.tag.update({
      where: { id: tagId },
      data,
    });
  }

  /**
   * Delete a tag
   */
  async delete(userId: string, tagId: string) {
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, userId },
    });

    if (!tag) {
      throw new NotFoundException('Etiket bulunamadı');
    }

    await this.prisma.tag.delete({
      where: { id: tagId },
    });

    return { success: true };
  }

  /**
   * Add tag to article
   */
  async addToArticle(userId: string, tagId: string, articleId: string) {
    // Verify tag belongs to user
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, userId },
    });

    if (!tag) {
      throw new NotFoundException('Etiket bulunamadı');
    }

    // Check if already tagged
    const existing = await this.prisma.articleTag.findUnique({
      where: {
        articleId_tagId: { articleId, tagId },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.articleTag.create({
      data: { articleId, tagId },
      include: {
        tag: true,
      },
    });
  }

  /**
   * Remove tag from article
   */
  async removeFromArticle(userId: string, tagId: string, articleId: string) {
    // Verify tag belongs to user
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, userId },
    });

    if (!tag) {
      throw new NotFoundException('Etiket bulunamadı');
    }

    const articleTag = await this.prisma.articleTag.findUnique({
      where: {
        articleId_tagId: { articleId, tagId },
      },
    });

    if (!articleTag) {
      throw new NotFoundException('Etiket ilişkisi bulunamadı');
    }

    await this.prisma.articleTag.delete({
      where: { id: articleTag.id },
    });

    return { success: true };
  }

  /**
   * Get tags for an article
   */
  async getArticleTags(articleId: string) {
    const articleTags = await this.prisma.articleTag.findMany({
      where: { articleId },
      include: { tag: true },
    });

    return articleTags.map(at => at.tag);
  }

  /**
   * Get articles by tag
   */
  async getArticlesByTag(userId: string, tagId: string) {
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, userId },
      include: {
        articles: {
          include: {
            article: {
              include: {
                source: {
                  include: {
                    site: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException('Etiket bulunamadı');
    }

    return {
      tag,
      articles: tag.articles.map(at => at.article),
    };
  }

  /**
   * Get tag IDs for multiple articles (for batch checking)
   */
  async getArticleTagIds(articleIds: string[]): Promise<Record<string, string[]>> {
    const articleTags = await this.prisma.articleTag.findMany({
      where: {
        articleId: { in: articleIds },
      },
      select: { articleId: true, tagId: true },
    });

    const result: Record<string, string[]> = {};
    articleTags.forEach(at => {
      if (!result[at.articleId]) {
        result[at.articleId] = [];
      }
      result[at.articleId].push(at.tagId);
    });

    return result;
  }
}
