import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticleQueryDto } from './dto';
import { DeduplicationService } from '../deduplication/deduplication.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly deduplicationService: DeduplicationService,
  ) {}

  /**
   * Get all articles with pagination and filters
   * GET /articles?page=1&limit=20&sourceId=xxx&isRead=true&search=keyword
   */
  @Get()
  async findAll(@Query() query: ArticleQueryDto, @CurrentUser('id') userId: string) {
    return this.articlesService.findAll(userId, query);
  }

  /**
   * Get article statistics
   * GET /articles/stats
   */
  @Get('stats')
  async getStats(@CurrentUser('id') userId: string) {
    return this.articlesService.getStats(userId);
  }

  /**
   * Get a single article
   * GET /articles/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.articlesService.findOne(id, userId);
  }

  /**
   * Mark article as read
   * PATCH /articles/:id/read
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.articlesService.markAsRead(id, userId);
  }

  /**
   * Mark article as unread
   * PATCH /articles/:id/unread
   */
  @Patch(':id/unread')
  @HttpCode(HttpStatus.OK)
  async markAsUnread(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.articlesService.markAsUnread(id, userId);
  }

  /**
   * Mark all articles as read
   * PATCH /articles/mark-all-read?sourceId=xxx
   */
  @Patch('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser('id') userId: string, @Query('sourceId') sourceId?: string) {
    return this.articlesService.markAllAsRead(userId, sourceId);
  }

  /**
   * Get article groups (deduplicated news)
   * GET /articles/groups?page=1&limit=20
   */
  @Get('groups')
  async getGroups(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.deduplicationService.getGroups(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * Get single article group with all sources
   * GET /articles/groups/:id
   */
  @Get('groups/:id')
  async getGroupById(@Param('id') id: string) {
    return this.deduplicationService.getGroupById(id);
  }

  /**
   * Run deduplication on all existing articles
   * POST /articles/deduplicate-all
   */
  @Post('deduplicate-all')
  @HttpCode(HttpStatus.OK)
  async deduplicateAll() {
    if (!this.deduplicationService.isAvailable()) {
      return {
        success: false,
        error: 'Deduplication service not available. Check DEEPSEEK_API_KEY.',
      };
    }

    try {
      const result = await this.deduplicationService.deduplicateExistingArticles();
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
