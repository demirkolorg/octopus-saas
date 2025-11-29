import { Controller, Post, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CrawlerService } from './crawler.service';

@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  /**
   * Manually trigger a crawl for a specific source
   * POST /crawler/sources/:id/crawl
   */
  @Post('sources/:id/crawl')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerCrawl(@Param('id') sourceId: string) {
    return this.crawlerService.addCrawlJob(sourceId, 'manual');
  }

  /**
   * Trigger crawl for all active sources
   * POST /crawler/crawl-all
   */
  @Post('crawl-all')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerCrawlAll() {
    return this.crawlerService.addAllActiveCrawlJobs();
  }

  /**
   * Get queue status
   * GET /crawler/status
   */
  @Get('status')
  async getQueueStatus() {
    return this.crawlerService.getQueueStatus();
  }

  /**
   * Get recent crawl jobs for a source
   * GET /crawler/sources/:id/jobs
   */
  @Get('sources/:id/jobs')
  async getSourceJobs(@Param('id') sourceId: string) {
    return this.crawlerService.getSourceJobs(sourceId);
  }
}
