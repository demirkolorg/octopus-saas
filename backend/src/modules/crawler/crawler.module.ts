import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { CrawlerProcessor } from './crawler.processor';
import { PrismaModule } from '../../prisma';
import { CRAWL_QUEUE } from './crawler.constants';

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
  ],
  controllers: [CrawlerController],
  providers: [CrawlerService, CrawlerProcessor],
  exports: [CrawlerService],
})
export class CrawlerModule {}
