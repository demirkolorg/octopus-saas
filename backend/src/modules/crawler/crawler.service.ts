import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CRAWL_QUEUE, CRAWL_JOB_OPTIONS } from './crawler.constants';
import { CrawlJobData } from './dto/crawl-job.dto';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private isSchedulerRunning = false;

  constructor(
    @InjectQueue(CRAWL_QUEUE) private readonly crawlQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Add a crawl job to the queue
   */
  async addCrawlJob(sourceId: string, triggeredBy: 'manual' | 'scheduled' = 'manual') {
    // Get source from database
    const source = await this.prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      throw new NotFoundException(`Source with id ${sourceId} not found`);
    }

    if (source.status !== 'ACTIVE') {
      throw new Error(`Source ${sourceId} is not active (status: ${source.status})`);
    }

    const jobData: CrawlJobData = {
      sourceId: source.id,
      url: source.url,
      selectors: source.selectors as CrawlJobData['selectors'],
      triggeredBy,
    };

    const job = await this.crawlQueue.add(
      `crawl-${sourceId}`,
      jobData,
      {
        ...CRAWL_JOB_OPTIONS,
        jobId: `${sourceId}-${Date.now()}`, // Unique job ID
      },
    );

    this.logger.log(`Added crawl job for source ${sourceId}, job id: ${job.id}`);

    return {
      jobId: job.id,
      sourceId,
      status: 'queued',
    };
  }

  /**
   * Add crawl jobs for all active sources
   */
  async addAllActiveCrawlJobs() {
    const activeSources = await this.prisma.source.findMany({
      where: { status: 'ACTIVE' },
    });

    const results: Array<{ jobId: string | undefined; sourceId: string; status: string }> = [];

    for (const source of activeSources) {
      try {
        const result = await this.addCrawlJob(source.id, 'scheduled');
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to add crawl job for source ${source.id}:`, error);
      }
    }

    return {
      totalSources: activeSources.length,
      jobsAdded: results.length,
      jobs: results,
    };
  }

  /**
   * Get queue status
   */
  async getQueueStatus() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.crawlQueue.getWaitingCount(),
      this.crawlQueue.getActiveCount(),
      this.crawlQueue.getCompletedCount(),
      this.crawlQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }

  /**
   * Get recent jobs for a source
   */
  async getSourceJobs(sourceId: string, limit = 10) {
    return this.prisma.crawlJob.findMany({
      where: { sourceId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Scheduled crawl - runs every 15 minutes
   * Adds all active sources to the crawl queue
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledCrawl() {
    // Prevent concurrent scheduler runs
    if (this.isSchedulerRunning) {
      this.logger.warn('Scheduled crawl already running, skipping...');
      return;
    }

    this.isSchedulerRunning = true;
    this.logger.log('Starting scheduled crawl...');

    try {
      const result = await this.addAllActiveCrawlJobs();
      this.logger.log(
        `Scheduled crawl completed: ${result.jobsAdded}/${result.totalSources} jobs added`,
      );
    } catch (error) {
      this.logger.error('Scheduled crawl failed:', error);
    } finally {
      this.isSchedulerRunning = false;
    }
  }

  /**
   * Cleanup old articles - runs every day at 3:00 AM
   * Deletes articles older than 30 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldArticles() {
    this.logger.log('Starting article cleanup...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const result = await this.prisma.article.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.log(`Article cleanup completed: ${result.count} old articles deleted`);
    } catch (error) {
      this.logger.error('Article cleanup failed:', error);
    }
  }

  /**
   * Cleanup old crawl jobs - runs every day at 4:00 AM
   * Deletes crawl job records older than 7 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async cleanupOldCrawlJobs() {
    this.logger.log('Starting crawl job cleanup...');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      const result = await this.prisma.crawlJob.deleteMany({
        where: {
          startedAt: {
            lt: sevenDaysAgo,
          },
        },
      });

      this.logger.log(`Crawl job cleanup completed: ${result.count} old records deleted`);
    } catch (error) {
      this.logger.error('Crawl job cleanup failed:', error);
    }
  }
}
