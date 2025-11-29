import { Module } from '@nestjs/common';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProxyModule } from '../proxy/proxy.module';

@Module({
  imports: [PrismaModule, ProxyModule],
  controllers: [SourcesController],
  providers: [SourcesService],
  exports: [SourcesService],
})
export class SourcesModule {}
