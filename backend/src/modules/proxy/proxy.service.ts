import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class ProxyService {
  private readonly userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  async fetchAndRewriteHtml(targetUrl: string): Promise<string> {
    this.validateUrl(targetUrl);

    const html = await this.fetchHtml(targetUrl);
    const rewrittenHtml = this.rewriteLinks(html, targetUrl);

    return rewrittenHtml;
  }

  private validateUrl(url: string): void {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new BadRequestException('Only HTTP and HTTPS protocols are allowed');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid URL format');
    }
  }

  private async fetchHtml(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 10000,
        maxRedirects: 5,
        responseType: 'text',
      });

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new BadRequestException('Connection refused by target server');
        }
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
          throw new BadRequestException('Request timed out');
        }
        if (error.response?.status === 403) {
          throw new BadRequestException('Access denied by target server (403)');
        }
        if (error.response?.status === 404) {
          throw new BadRequestException('Page not found (404)');
        }
        throw new BadRequestException(`Failed to fetch URL: ${error.message}`);
      }
      throw new BadRequestException('An unexpected error occurred while fetching the URL');
    }
  }

  rewriteLinks(html: string, baseUrl: string): string {
    const $ = cheerio.load(html);
    const base = new URL(baseUrl);
    const origin = base.origin;

    // Remove potentially harmful elements
    $('script').remove();
    $('noscript').remove();

    // Rewrite src attributes (images, iframes, etc.)
    $('[src]').each((_, element) => {
      const src = $(element).attr('src');
      if (src) {
        const absoluteUrl = this.toAbsoluteUrl(src, origin, baseUrl);
        $(element).attr('src', absoluteUrl);
      }
    });

    // Rewrite href attributes (links, stylesheets)
    $('[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const absoluteUrl = this.toAbsoluteUrl(href, origin, baseUrl);
        $(element).attr('href', absoluteUrl);
      }
    });

    // Rewrite srcset attributes (responsive images)
    $('[srcset]').each((_, element) => {
      const srcset = $(element).attr('srcset');
      if (srcset) {
        const rewrittenSrcset = this.rewriteSrcset(srcset, origin, baseUrl);
        $(element).attr('srcset', rewrittenSrcset);
      }
    });

    // Rewrite style attributes with url()
    $('[style]').each((_, element) => {
      const style = $(element).attr('style');
      if (style) {
        const rewrittenStyle = this.rewriteStyleUrls(style, origin, baseUrl);
        $(element).attr('style', rewrittenStyle);
      }
    });

    // Rewrite inline style tags
    $('style').each((_, element) => {
      const styleContent = $(element).html();
      if (styleContent) {
        const rewrittenStyle = this.rewriteStyleUrls(styleContent, origin, baseUrl);
        $(element).html(rewrittenStyle);
      }
    });

    // Add base tag if not present
    if ($('base').length === 0) {
      $('head').prepend(`<base href="${origin}">`);
    } else {
      $('base').attr('href', origin);
    }

    return $.html();
  }

  private toAbsoluteUrl(url: string, origin: string, baseUrl: string): string {
    // Skip data URLs, javascript:, mailto:, tel:, and anchors
    if (
      url.startsWith('data:') ||
      url.startsWith('javascript:') ||
      url.startsWith('mailto:') ||
      url.startsWith('tel:') ||
      url.startsWith('#')
    ) {
      return url;
    }

    // Already absolute URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Protocol-relative URL
    if (url.startsWith('//')) {
      return `https:${url}`;
    }

    // Root-relative URL
    if (url.startsWith('/')) {
      return `${origin}${url}`;
    }

    // Relative URL - resolve against base URL
    try {
      const resolved = new URL(url, baseUrl);
      return resolved.href;
    } catch {
      return url;
    }
  }

  private rewriteSrcset(srcset: string, origin: string, baseUrl: string): string {
    return srcset
      .split(',')
      .map((entry) => {
        const parts = entry.trim().split(/\s+/);
        if (parts.length >= 1) {
          parts[0] = this.toAbsoluteUrl(parts[0], origin, baseUrl);
        }
        return parts.join(' ');
      })
      .join(', ');
  }

  private rewriteStyleUrls(style: string, origin: string, baseUrl: string): string {
    // Match url() in CSS
    return style.replace(/url\(['"]?([^'")\s]+)['"]?\)/gi, (match, url) => {
      const absoluteUrl = this.toAbsoluteUrl(url, origin, baseUrl);
      return `url('${absoluteUrl}')`;
    });
  }
}
