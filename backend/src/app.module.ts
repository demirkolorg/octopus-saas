import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProxyModule } from './modules/proxy';

@Module({
  imports: [ProxyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
