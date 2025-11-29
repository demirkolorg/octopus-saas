import { Controller, Get, Query, Header } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { ProxyQueryDto } from './dto/proxy-query.dto';

@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('X-Frame-Options', 'SAMEORIGIN')
  @Header('Content-Security-Policy', "frame-ancestors 'self'")
  async getProxiedHtml(@Query() query: ProxyQueryDto): Promise<string> {
    return this.proxyService.fetchAndRewriteHtml(query.url);
  }
}
