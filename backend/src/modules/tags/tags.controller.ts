import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * Get all tags
   * GET /tags
   */
  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.tagsService.findAll(userId);
  }

  /**
   * Create a new tag
   * POST /tags
   */
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() body: { name: string; color?: string },
  ) {
    return this.tagsService.create(userId, body.name, body.color);
  }

  /**
   * Update a tag
   * PUT /tags/:id
   */
  @Put(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') tagId: string,
    @Body() body: { name?: string; color?: string },
  ) {
    return this.tagsService.update(userId, tagId, body);
  }

  /**
   * Delete a tag
   * DELETE /tags/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') tagId: string,
  ) {
    return this.tagsService.delete(userId, tagId);
  }

  /**
   * Get articles by tag
   * GET /tags/:id/articles
   */
  @Get(':id/articles')
  async getArticlesByTag(
    @CurrentUser('id') userId: string,
    @Param('id') tagId: string,
  ) {
    return this.tagsService.getArticlesByTag(userId, tagId);
  }

  /**
   * Add tag to article
   * POST /tags/:id/articles/:articleId
   */
  @Post(':id/articles/:articleId')
  async addToArticle(
    @CurrentUser('id') userId: string,
    @Param('id') tagId: string,
    @Param('articleId') articleId: string,
  ) {
    return this.tagsService.addToArticle(userId, tagId, articleId);
  }

  /**
   * Remove tag from article
   * DELETE /tags/:id/articles/:articleId
   */
  @Delete(':id/articles/:articleId')
  @HttpCode(HttpStatus.OK)
  async removeFromArticle(
    @CurrentUser('id') userId: string,
    @Param('id') tagId: string,
    @Param('articleId') articleId: string,
  ) {
    return this.tagsService.removeFromArticle(userId, tagId, articleId);
  }

  /**
   * Get tags for an article
   * GET /tags/article/:articleId
   */
  @Get('article/:articleId')
  async getArticleTags(@Param('articleId') articleId: string) {
    return this.tagsService.getArticleTags(articleId);
  }

  /**
   * Batch get tags for articles
   * POST /tags/articles/batch
   */
  @Post('articles/batch')
  async getArticleTagsBatch(@Body('articleIds') articleIds: string[]) {
    return this.tagsService.getArticleTagIds(articleIds);
  }
}
