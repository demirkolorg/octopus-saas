import { Module } from '@nestjs/common';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProxyModule } from '../proxy/proxy.module';
import { CrawlerModule } from '../crawler/crawler.module';

@Module({
  imports: [PrismaModule, ProxyModule, CrawlerModule],
  controllers: [SourcesController],
  providers: [SourcesService],
  exports: [SourcesService],
})
export class SourcesModule {}
