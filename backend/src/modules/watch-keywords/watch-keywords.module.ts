import { Module } from '@nestjs/common';
import { WatchKeywordsController } from './watch-keywords.controller';
import { WatchGroupsController } from './watch-groups.controller';
import { WatchKeywordsService } from './watch-keywords.service';
import { WatchAnalyzerService } from './watch-analyzer.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WatchKeywordsController, WatchGroupsController],
  providers: [WatchKeywordsService, WatchAnalyzerService],
  exports: [WatchKeywordsService, WatchAnalyzerService],
})
export class WatchKeywordsModule {}
