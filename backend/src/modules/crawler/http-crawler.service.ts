import { Injectable, Logger } from '@nestjs/common';
import { load } from 'cheerio';
import { SelectorConfig, ArticleData } from './dto/crawl-job.dto';

// Import got-scraping dynamically since it's ESM
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let gotScraping: any;

@Injectable()
export class HttpCrawlerService {
  private readonly logger = new Logger(HttpCrawlerService.name);
  private isGotLoaded = false;

  async onModuleInit() {
    try {
      // Dynamically import got-scraping (ESM module)
      const module = await import('got-scraping');
      gotScraping = module.gotScraping;
      this.isGotLoaded = true;
      this.logger.log('got-scraping loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load got-scraping:', error);
    }
  }

  /**
   * Try to fetch page via HTTP first (faster, cheaper)
   * Returns null if JS rendering is needed
   */
  async tryHttpFetch(url: string): Promise<{ html: string; needsJs: boolean } | null> {
    if (!this.isGotLoaded || !gotScraping) {
      this.logger.warn('got-scraping not loaded, falling back to Playwright');
      return null;
    }

    try {
      const response = await gotScraping({
        url,
        timeout: { request: 15000 },
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        // Use browser-like headers to avoid detection
        headerGeneratorOptions: {
          browsers: ['chrome'],
          operatingSystems: ['windows'],
          devices: ['desktop'],
        },
      });

      const html = response.body;

      // Check if page requires JavaScript
      const needsJs = this.checkIfNeedsJavaScript(html);

      if (needsJs) {
        this.logger.log(`Page ${url} requires JavaScript, will use Playwright`);
        return { html, needsJs: true };
      }

      this.logger.log(`HTTP fetch successful for ${url}`);
      return { html, needsJs: false };
    } catch (error) {
      this.logger.warn(`HTTP fetch failed for ${url}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Check if page content suggests JavaScript rendering is needed
   */
  private checkIfNeedsJavaScript(html: string): boolean {
    const $ = load(html);
    const body = $('body').text().trim();

    // Check for common SPA indicators
    const spaIndicators = [
      // Empty body or minimal content
      body.length < 500,
      // React/Vue/Angular root elements with no content
      $('#root').length > 0 && $('#root').text().trim().length < 100,
      $('#app').length > 0 && $('#app').text().trim().length < 100,
      $('[ng-app]').length > 0,
      $('[data-reactroot]').length > 0,
      // Noscript tags suggesting JS dependency
      $('noscript').text().includes('JavaScript'),
      // Common loading indicators
      body.includes('Loading...') && body.length < 1000,
    ];

    return spaIndicators.some(indicator => indicator === true);
  }

  /**
   * Extract articles from HTML using Cheerio (fast, no browser)
   */
  async extractFromHtml(
    html: string,
    selectors: SelectorConfig,
    baseUrl: string,
  ): Promise<{ links: string[]; count: number }> {
    const $ = load(html);
    const links: string[] = [];

    try {
      const listItems = $(selectors.listItem);
      this.logger.log(`Found ${listItems.length} list items via HTTP`);

      listItems.each((_, element) => {
        const $item = $(element);
        const link = this.findLinkInElement($item, $, baseUrl);
        if (link && !links.includes(link)) {
          links.push(link);
        }
      });

      return { links, count: listItems.length };
    } catch (error) {
      this.logger.error('Failed to extract from HTML:', error);
      return { links: [], count: 0 };
    }
  }

  /**
   * Extract article data from detail page HTML
   */
  async extractDetailFromHtml(
    html: string,
    url: string,
    selectors: SelectorConfig,
  ): Promise<ArticleData> {
    const $ = load(html);
    const article: ArticleData = {
      title: '',
      url,
    };

    try {
      // Extract title
      if (selectors.title) {
        const titleElement = $(selectors.title).first();
        if (titleElement.length) {
          article.title = this.sanitizeText(titleElement.text());
        }
      }

      // Extract date
      if (selectors.date) {
        const dateElement = $(selectors.date).first();
        if (dateElement.length) {
          article.date = this.sanitizeText(dateElement.text());
        }
      }

      // Extract content
      if (selectors.content) {
        const contentElement = $(selectors.content).first();
        if (contentElement.length) {
          article.content = this.sanitizeText(contentElement.text()).substring(0, 5000);
        }
      }

      // Extract summary
      if (selectors.summary) {
        const summaryElement = $(selectors.summary).first();
        if (summaryElement.length) {
          article.summary = this.sanitizeText(summaryElement.text()).substring(0, 500);
        }
      }

      // Extract image
      if (selectors.image) {
        const imageElement = $(selectors.image).first();
        if (imageElement.length) {
          let imgSrc = '';
          if (imageElement.is('img')) {
            imgSrc = imageElement.attr('src') ||
                     imageElement.attr('data-src') ||
                     imageElement.attr('data-lazy-src') || '';
          } else {
            const img = imageElement.find('img').first();
            if (img.length) {
              imgSrc = img.attr('src') || img.attr('data-src') || '';
            }
          }
          if (imgSrc) {
            article.imageUrl = this.toAbsoluteUrl(imgSrc, url);
          }
        }
      }

      // Check if partial
      if (!article.content && !article.summary) {
        article.isPartial = true;
      }
    } catch (error) {
      this.logger.error('Failed to extract detail from HTML:', error);
    }

    return article;
  }

  /**
   * Find link in element
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private findLinkInElement($item: any, $: any, baseUrl: string): string | null {
    // Check if element itself is an anchor
    if ($item.is('a')) {
      const href = $item.attr('href');
      if (href) return this.toAbsoluteUrl(href, baseUrl);
    }

    // Find first anchor inside
    const anchor = $item.find('a[href]').first();
    if (anchor.length) {
      const href = anchor.attr('href');
      if (href) return this.toAbsoluteUrl(href, baseUrl);
    }

    // Check parent
    const parent = $item.closest('a[href]');
    if (parent.length) {
      const href = parent.attr('href');
      if (href) return this.toAbsoluteUrl(href, baseUrl);
    }

    return null;
  }

  /**
   * Convert relative URL to absolute
   */
  private toAbsoluteUrl(url: string, baseUrl: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  /**
   * Sanitize text content
   */
  private sanitizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\r\n]+/g, ' ')
      .trim();
  }

  /**
   * Extract content from HTML using a CSS selector
   * Used for RSS content enrichment
   */
  extractContentBySelector(html: string, selector: string): string | null {
    try {
      const $ = load(html);
      const element = $(selector).first();

      if (!element.length) {
        return null;
      }

      // Get text content and sanitize
      const text = this.sanitizeText(element.text());

      return text.length > 0 ? text.substring(0, 5000) : null;
    } catch (error) {
      this.logger.warn('Failed to extract content by selector:', error);
      return null;
    }
  }
}
