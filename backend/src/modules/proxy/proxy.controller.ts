import { Controller, Get, Query, Header } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { ProxyQueryDto } from './dto/proxy-query.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  @Public() // Proxy endpoint doesn't require authentication
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('X-Frame-Options', 'SAMEORIGIN')
  @Header('Content-Security-Policy', "frame-ancestors 'self'")
  async getProxiedHtml(@Query() query: ProxyQueryDto): Promise<string> {
    return this.proxyService.fetchAndRewriteHtml(query.url);
  }
}
