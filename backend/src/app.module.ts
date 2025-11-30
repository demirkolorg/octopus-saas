import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { ProxyModule } from './modules/proxy';
import { SourcesModule } from './modules/sources';
import { CrawlerModule } from './modules/crawler';
import { ArticlesModule } from './modules/articles';

@Module({
  imports: [
    // Schedule Module for Cron Jobs
    ScheduleModule.forRoot(),
    // Redis/BullMQ Configuration
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    PrismaModule,
    ProxyModule,
    SourcesModule,
    CrawlerModule,
    ArticlesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
