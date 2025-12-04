import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { CrawlerProcessor } from './crawler.processor';
import { HttpCrawlerService } from './http-crawler.service';
import { RssParserService } from './rss-parser.service';
import { PrismaModule } from '../../prisma';
import { CRAWL_QUEUE } from './crawler.constants';
import { AIExtractorModule } from '../ai-extractor/ai-extractor.module';
import { DeduplicationModule } from '../deduplication/deduplication.module';
import { CacheModule } from '../cache/cache.module';
import { WatchKeywordsModule } from '../watch-keywords/watch-keywords.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CRAWL_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    }),
    PrismaModule,
    AIExtractorModule,
    DeduplicationModule,
    CacheModule,
    WatchKeywordsModule,
  ],
  controllers: [CrawlerController],
  providers: [CrawlerService, CrawlerProcessor, HttpCrawlerService, RssParserService],
  exports: [CrawlerService, RssParserService],
})
export class CrawlerModule {}
