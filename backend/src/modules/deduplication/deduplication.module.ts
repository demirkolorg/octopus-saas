import { Module } from '@nestjs/common';
import { DeduplicationService } from './deduplication.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [PrismaModule, CacheModule],
  providers: [DeduplicationService],
  exports: [DeduplicationService],
})
export class DeduplicationModule {}
