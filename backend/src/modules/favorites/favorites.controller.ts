import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  /**
   * Get all favorites
   * GET /favorites
   */
  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.favoritesService.findAll(userId);
  }

  /**
   * Add to favorites
   * POST /favorites
   */
  @Post()
  async add(
    @CurrentUser('id') userId: string,
    @Body('articleId') articleId: string,
  ) {
    return this.favoritesService.add(userId, articleId);
  }

  /**
   * Remove from favorites
   * DELETE /favorites/:articleId
   */
  @Delete(':articleId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser('id') userId: string,
    @Param('articleId') articleId: string,
  ) {
    return this.favoritesService.remove(userId, articleId);
  }

  /**
   * Check if article is favorited
   * GET /favorites/check/:articleId
   */
  @Get('check/:articleId')
  async check(
    @CurrentUser('id') userId: string,
    @Param('articleId') articleId: string,
  ) {
    const isFavorite = await this.favoritesService.isFavorite(userId, articleId);
    return { isFavorite };
  }

  /**
   * Batch check favorites
   * POST /favorites/check-batch
   */
  @Post('check-batch')
  async checkBatch(
    @CurrentUser('id') userId: string,
    @Body('articleIds') articleIds: string[],
  ) {
    const favoriteIds = await this.favoritesService.getFavoriteArticleIds(userId, articleIds);
    return { favoriteIds };
  }
}
