import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { PrismaService } from '../../prisma/prisma.service';
import { CRAWL_QUEUE } from './crawler.constants';
import { CrawlJobData, CrawlJobResult, ArticleData } from './dto/crawl-job.dto';
import * as crypto from 'crypto';

@Processor(CRAWL_QUEUE, {
  concurrency: 2, // Process 2 jobs at a time
})
export class CrawlerProcessor extends WorkerHost {
  private readonly logger = new Logger(CrawlerProcessor.name);
  private browser: Browser | null = null;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async onModuleInit() {
    // Launch browser on module init
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    this.logger.log('Browser launched successfully');
  }

  async onModuleDestroy() {
    // Close browser on module destroy
    if (this.browser) {
      await this.browser.close();
      this.logger.log('Browser closed');
    }
  }

  async process(job: Job<CrawlJobData>): Promise<CrawlJobResult> {
    const startTime = Date.now();
    const { sourceId, url, selectors, triggeredBy } = job.data;

    this.logger.log(`Processing crawl job for source ${sourceId}`);
    this.logger.log(`URL: ${url}`);

    // Create CrawlJob record
    const crawlJob = await this.prisma.crawlJob.create({
      data: {
        sourceId,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      // Ensure browser is running
      if (!this.browser || !this.browser.isConnected()) {
        this.browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
      }

      // Create new browser context
      context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
      });

      page = await context.newPage();

      // Navigate to URL
      this.logger.log(`Navigating to ${url}`);
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Wait a bit for dynamic content
      await page.waitForTimeout(2000);

      // Extract articles
      const articles = await this.extractArticles(page, selectors, url);
      this.logger.log(`Found ${articles.length} articles`);

      // Process and save articles
      const { inserted, duplicates } = await this.saveArticles(sourceId, articles);

      // Update job as completed
      await this.prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: {
          status: 'COMPLETED',
          finishedAt: new Date(),
          itemsFound: articles.length,
          itemsInserted: inserted,
        },
      });

      // Update source's last crawl time
      await this.prisma.source.update({
        where: { id: sourceId },
        data: { lastCrawlAt: new Date() },
      });

      const duration = Date.now() - startTime;
      this.logger.log(
        `Crawl completed: ${articles.length} found, ${inserted} inserted, ${duplicates} duplicates (${duration}ms)`,
      );

      return {
        sourceId,
        itemsFound: articles.length,
        itemsInserted: inserted,
        errors: [],
        duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update job as failed
      await this.prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          errorMessage,
        },
      });

      // Update source status to ERROR
      await this.prisma.source.update({
        where: { id: sourceId },
        data: { status: 'ERROR' },
      });

      this.logger.error(`Crawl job failed for source ${sourceId}:`, errorMessage);
      throw error;
    } finally {
      // Clean up
      if (page) await page.close();
      if (context) await context.close();
    }
  }

  /**
   * Extract articles from the page using selectors
   */
  private async extractArticles(
    page: Page,
    selectors: CrawlJobData['selectors'],
    baseUrl: string,
  ): Promise<ArticleData[]> {
    const articles: ArticleData[] = [];

    try {
      // Wait for list items to be present
      await page.waitForSelector(selectors.listItem, { timeout: 10000 });

      // Get all list items
      const listItems = await page.$$(selectors.listItem);
      this.logger.log(`Found ${listItems.length} list items`);

      for (const item of listItems) {
        try {
          const article: ArticleData = {
            title: '',
            url: '',
          };

          // Extract title
          const titleElement = await item.$(selectors.title);
          if (titleElement) {
            const titleText = await titleElement.textContent();
            article.title = this.sanitizeText(titleText || '');
          }

          // Extract link
          const linkElement = await item.$(selectors.link);
          if (linkElement) {
            // Check if it's an anchor or has anchor inside
            const tagName = await linkElement.evaluate(el => el.tagName.toLowerCase());
            let href = '';

            if (tagName === 'a') {
              href = await linkElement.getAttribute('href') || '';
            } else {
              const innerAnchor = await linkElement.$('a');
              if (innerAnchor) {
                href = await innerAnchor.getAttribute('href') || '';
              }
            }

            article.url = this.toAbsoluteUrl(href, baseUrl);
          }

          // Extract date (optional)
          if (selectors.date) {
            const dateElement = await item.$(selectors.date);
            if (dateElement) {
              const dateText = await dateElement.textContent();
              article.date = this.sanitizeText(dateText || '');
            }
          }

          // Extract summary (optional)
          if (selectors.summary) {
            const summaryElement = await item.$(selectors.summary);
            if (summaryElement) {
              const summaryText = await summaryElement.textContent();
              article.summary = this.sanitizeText(summaryText || '').substring(0, 500);
            }
          }

          // Try to extract image
          const imgElement = await item.$('img');
          if (imgElement) {
            const imgSrc = await imgElement.getAttribute('src') || await imgElement.getAttribute('data-src');
            if (imgSrc) {
              article.imageUrl = this.toAbsoluteUrl(imgSrc, baseUrl);
            }
          }

          // Only add if we have required fields
          if (article.title && article.url) {
            articles.push(article);
          }
        } catch (itemError) {
          this.logger.warn(`Failed to extract article from item:`, itemError);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to extract articles:`, error);
    }

    return articles;
  }

  /**
   * Save articles to database with deduplication
   */
  private async saveArticles(
    sourceId: string,
    articles: ArticleData[],
  ): Promise<{ inserted: number; duplicates: number }> {
    let inserted = 0;
    let duplicates = 0;

    for (const article of articles) {
      const hash = this.generateArticleHash(sourceId, article.url);

      // Check if article already exists
      const existing = await this.prisma.article.findUnique({
        where: { hash },
      });

      if (existing) {
        duplicates++;
        continue;
      }

      // Create new article
      try {
        await this.prisma.article.create({
          data: {
            sourceId,
            title: article.title,
            url: article.url,
            content: article.summary || '',
            hash,
            imageUrl: article.imageUrl,
            publishedAt: article.date ? this.parseDate(article.date) : new Date(),
          },
        });
        inserted++;
      } catch (error) {
        // Likely a duplicate that was inserted between check and create
        this.logger.warn(`Failed to insert article: ${article.url}`, error);
        duplicates++;
      }
    }

    return { inserted, duplicates };
  }

  /**
   * Generate unique hash for article deduplication
   */
  private generateArticleHash(sourceId: string, articleUrl: string): string {
    return crypto
      .createHash('sha256')
      .update(`${sourceId}:${articleUrl}`)
      .digest('hex');
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
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/[\r\n]+/g, ' ') // Newlines to space
      .trim();
  }

  /**
   * Parse date string to Date object
   */
  private parseDate(dateStr: string): Date {
    // Try to parse the date
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // Turkish date formats
    const turkishMonths: Record<string, number> = {
      'ocak': 0, 'şubat': 1, 'mart': 2, 'nisan': 3,
      'mayıs': 4, 'haziran': 5, 'temmuz': 6, 'ağustos': 7,
      'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11,
    };

    const lower = dateStr.toLowerCase();
    for (const [month, index] of Object.entries(turkishMonths)) {
      if (lower.includes(month)) {
        const dayMatch = lower.match(/(\d{1,2})/);
        const yearMatch = lower.match(/(\d{4})/);
        if (dayMatch) {
          const day = parseInt(dayMatch[1]);
          const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
          return new Date(year, index, day);
        }
      }
    }

    // Default to current date
    return new Date();
  }
}
