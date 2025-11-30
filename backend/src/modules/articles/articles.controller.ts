import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticleQueryDto } from './dto';

// TODO: Add authentication guard and get userId from JWT
const TEMP_USER_ID = 'temp-user-id';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  /**
   * Get all articles with pagination and filters
   * GET /articles?page=1&limit=20&sourceId=xxx&isRead=true&search=keyword
   */
  @Get()
  async findAll(@Query() query: ArticleQueryDto) {
    return this.articlesService.findAll(TEMP_USER_ID, query);
  }

  /**
   * Get article statistics
   * GET /articles/stats
   */
  @Get('stats')
  async getStats() {
    return this.articlesService.getStats(TEMP_USER_ID);
  }

  /**
   * Get a single article
   * GET /articles/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id, TEMP_USER_ID);
  }

  /**
   * Mark article as read
   * PATCH /articles/:id/read
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string) {
    return this.articlesService.markAsRead(id, TEMP_USER_ID);
  }

  /**
   * Mark article as unread
   * PATCH /articles/:id/unread
   */
  @Patch(':id/unread')
  @HttpCode(HttpStatus.OK)
  async markAsUnread(@Param('id') id: string) {
    return this.articlesService.markAsUnread(id, TEMP_USER_ID);
  }

  /**
   * Mark all articles as read
   * PATCH /articles/mark-all-read?sourceId=xxx
   */
  @Patch('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Query('sourceId') sourceId?: string) {
    return this.articlesService.markAllAsRead(TEMP_USER_ID, sourceId);
  }
}
