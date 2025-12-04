import { Module } from '@nestjs/common';
import { AIExtractorService } from './ai-extractor.service';

@Module({
  providers: [AIExtractorService],
  exports: [AIExtractorService],
})
export class AIExtractorModule {}
