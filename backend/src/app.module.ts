import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { ProxyModule } from './modules/proxy';
import { SourcesModule } from './modules/sources';

@Module({
  imports: [PrismaModule, ProxyModule, SourcesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
