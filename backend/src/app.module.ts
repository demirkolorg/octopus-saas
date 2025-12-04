import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { ProxyModule } from './modules/proxy';
import { SitesModule } from './modules/sites';
import { CategoriesModule } from './modules/categories';
import { SourcesModule } from './modules/sources';
import { CrawlerModule } from './modules/crawler';
import { ArticlesModule } from './modules/articles';
import { CacheModule } from './modules/cache/cache.module';
import { AIExtractorModule } from './modules/ai-extractor/ai-extractor.module';
import { AdminModule } from './modules/admin/admin.module';
import { EmailModule } from './modules/email/email.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { TagsModule } from './modules/tags/tags.module';
import { UserSettingsModule } from './modules/user-settings/user-settings.module';
import { WatchKeywordsModule } from './modules/watch-keywords/watch-keywords.module';
import { DailySummaryModule } from './modules/daily-summary/daily-summary.module';

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
    AuthModule, // Authentication module
    CacheModule, // Global cache module
    AIExtractorModule, // AI extraction module
    ProxyModule,
    SitesModule, // Site management
    CategoriesModule, // Category management
    SourcesModule,
    CrawlerModule,
    ArticlesModule,
    AdminModule, // Admin panel module
    EmailModule, // Email notifications
    FavoritesModule, // Article favorites
    TagsModule, // Article tagging
    UserSettingsModule, // User preferences
    WatchKeywordsModule, // Watchlist keywords
    DailySummaryModule, // Daily news summaries
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global JWT Auth Guard - tüm route'lar için geçerli
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
