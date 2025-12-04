import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { DeduplicationModule } from '../deduplication/deduplication.module';

@Module({
  imports: [PrismaModule, DeduplicationModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
