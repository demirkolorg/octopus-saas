import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SourcesService } from './sources.service';
import { CrawlerService } from '../crawler/crawler.service';
import { PreviewSourceDto, CreateSourceDto, PreviewRssFeedDto, CreateRssSourceDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('sources')
export class SourcesController {
  constructor(
    private readonly sourcesService: SourcesService,
    private readonly crawlerService: CrawlerService,
  ) {}

  /**
   * Preview scraping results before saving
   * POST /sources/preview
   */
  @Post('preview')
  @Public() // Preview doesn't require auth - it just fetches external content
  @HttpCode(HttpStatus.OK)
  async preview(@Body() dto: PreviewSourceDto) {
    return this.sourcesService.preview(dto);
  }

  /**
   * Create a new source
   * POST /sources
   */
  @Post()
  async create(@Body() dto: CreateSourceDto, @CurrentUser('id') userId: string) {
    return this.sourcesService.create(dto, userId);
  }

  /**
   * Get all sources for the current user
   * GET /sources
   * Query params: siteId, categoryId (optional filters)
   */
  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('siteId') siteId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.sourcesService.findAll(userId, siteId, categoryId);
  }

  /**
   * Get a single source by ID
   * GET /sources/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.sourcesService.findOne(id, userId);
  }

  /**
   * Delete a source
   * DELETE /sources/:id
   */
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.sourcesService.delete(id, userId);
  }

  /**
   * Pause a source
   * PATCH /sources/:id/pause
   */
  @Patch(':id/pause')
  async pause(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.sourcesService.updateStatus(id, userId, 'PAUSED');
  }

  /**
   * Activate a source
   * PATCH /sources/:id/activate
   */
  @Patch(':id/activate')
  async activate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.sourcesService.updateStatus(id, userId, 'ACTIVE');
  }

  /**
   * Trigger crawl for a source
   * POST /sources/:id/crawl
   */
  @Post(':id/crawl')
  @HttpCode(HttpStatus.ACCEPTED)
  async crawl(@Param('id') id: string, @CurrentUser('id') userId: string) {
    // First verify source exists and belongs to user
    await this.sourcesService.findOne(id, userId);
    return this.crawlerService.addCrawlJob(id, 'manual');
  }

  /**
   * Get crawl jobs for a source
   * GET /sources/:id/jobs
   */
  @Get(':id/jobs')
  async getJobs(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.sourcesService.findOne(id, userId);
    return this.crawlerService.getSourceJobs(id);
  }

  // ==================== RSS Source Endpoints ====================

  /**
   * Preview RSS feed before saving
   * POST /sources/preview-rss
   */
  @Post('preview-rss')
  @Public() // RSS preview doesn't require auth - it just fetches external feed
  @HttpCode(HttpStatus.OK)
  async previewRssFeed(@Body() dto: PreviewRssFeedDto) {
    return this.sourcesService.previewRssFeed(dto);
  }

  /**
   * Create a new RSS source
   * POST /sources/rss
   */
  @Post('rss')
  async createRssSource(@Body() dto: CreateRssSourceDto, @CurrentUser('id') userId: string) {
    return this.sourcesService.createRssSource(dto, userId);
  }

  // ==================== Health Monitoring Endpoints ====================

  /**
   * Get health summary for all sources
   * GET /sources/health/summary
   */
  @Get('health/summary')
  async getHealthSummary(@CurrentUser('id') userId: string) {
    return this.sourcesService.getSourcesHealthSummary(userId);
  }

  /**
   * Get health metrics for a specific source
   * GET /sources/:id/health
   */
  @Get(':id/health')
  async getSourceHealth(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.sourcesService.getSourceHealth(id, userId);
  }

  /**
   * Reset health metrics for a source
   * POST /sources/:id/health/reset
   */
  @Post(':id/health/reset')
  @HttpCode(HttpStatus.OK)
  async resetSourceHealth(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.sourcesService.resetSourceHealth(id, userId);
  }
}
