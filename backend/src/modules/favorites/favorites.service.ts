import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all favorites for a user
   */
  async findAll(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
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
    });
  }

  /**
   * Add article to favorites
   */
  async add(userId: string, articleId: string) {
    // Verify article exists
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Makale bulunamadı');
    }

    // Check if already favorited
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_articleId: { userId, articleId },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.favorite.create({
      data: { userId, articleId },
      include: {
        article: true,
      },
    });
  }

  /**
   * Remove article from favorites
   */
  async remove(userId: string, articleId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_articleId: { userId, articleId },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favori bulunamadı');
    }

    await this.prisma.favorite.delete({
      where: { id: favorite.id },
    });

    return { success: true };
  }

  /**
   * Check if article is favorited by user
   */
  async isFavorite(userId: string, articleId: string): Promise<boolean> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_articleId: { userId, articleId },
      },
    });

    return !!favorite;
  }

  /**
   * Get favorite IDs for multiple articles (for batch checking)
   */
  async getFavoriteArticleIds(userId: string, articleIds: string[]): Promise<string[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId,
        articleId: { in: articleIds },
      },
      select: { articleId: true },
    });

    return favorites.map(f => f.articleId);
  }
}
