import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { PrismaService } from '../../prisma/prisma.service';
import { CRAWL_QUEUE } from './crawler.constants';
import { CrawlJobData, CrawlJobResult, ArticleData, SelectorConfig } from './dto/crawl-job.dto';
import { HttpCrawlerService } from './http-crawler.service';
import { RssParserService, RssFeedItem } from './rss-parser.service';
import { AIExtractorService } from '../ai-extractor/ai-extractor.service';
import { CacheService } from '../cache/cache.service';
import { DeduplicationService } from '../deduplication/deduplication.service';
import { WatchAnalyzerService } from '../watch-keywords/watch-analyzer.service';
import * as crypto from 'crypto';

@Processor(CRAWL_QUEUE, {
  concurrency: 2, // Process 2 jobs at a time
})
export class CrawlerProcessor extends WorkerHost {
  private readonly logger = new Logger(CrawlerProcessor.name);
  private browser: Browser | null = null;
  private readonly useHttpFirst = process.env.CRAWLER_HTTP_FIRST !== 'false';
  private readonly useAIFallback = process.env.CRAWLER_AI_FALLBACK === 'true';

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpCrawler: HttpCrawlerService,
    private readonly rssParser: RssParserService,
    private readonly aiExtractor: AIExtractorService,
    private readonly cacheService: CacheService,
    private readonly deduplicationService: DeduplicationService,
    private readonly watchAnalyzer: WatchAnalyzerService,
  ) {
    super();
  }

  async onModuleInit() {
    // Launch browser on module init
    // Use the browser from playwright docker image
    try {
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
    } catch (error) {
      this.logger.error('Failed to launch browser:', error);
      this.logger.warn('Crawler will not be available until browser is installed');
    }
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
    const { sourceId, url, sourceType, triggeredBy } = job.data;

    this.logger.log(`Processing crawl job for source ${sourceId} (type: ${sourceType})`);
    this.logger.log(`URL: ${url}`);

    // Route to appropriate processor based on source type
    if (sourceType === 'RSS') {
      return this.processRssSource(job, startTime);
    }

    // Default: SELECTOR type
    return this.processSelectorSource(job, startTime);
  }

  /**
   * Process RSS source
   */
  private async processRssSource(
    job: Job<CrawlJobData>,
    startTime: number,
  ): Promise<CrawlJobResult> {
    const { sourceId, feedUrl, lastEtag, lastFeedModified, enrichContent, contentSelector } = job.data;

    // Create CrawlJob record
    const crawlJob = await this.prisma.crawlJob.create({
      data: {
        sourceId,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    try {
      // Fetch RSS feed with conditional request
      const feedResult = await this.rssParser.fetchFeed(feedUrl!, {
        etag: lastEtag,
        lastModified: lastFeedModified,
      });

      // Handle 304 Not Modified
      if (feedResult.notModified) {
        this.logger.log('RSS feed not modified (304), skipping');

        await this.prisma.crawlJob.update({
          where: { id: crawlJob.id },
          data: {
            status: 'COMPLETED',
            finishedAt: new Date(),
            itemsFound: 0,
            itemsInserted: 0,
          },
        });

        await this.prisma.source.update({
          where: { id: sourceId },
          data: { lastCrawlAt: new Date() },
        });

        return {
          sourceId,
          itemsFound: 0,
          itemsInserted: 0,
          errors: [],
          duration: Date.now() - startTime,
        };
      }

      // Convert RSS items to articles
      let articles = this.convertRssItemsToArticles(feedResult.items);
      this.logger.log(`Found ${articles.length} items in RSS feed`);

      // Optional: Enrich content by fetching detail pages
      if (enrichContent && contentSelector) {
        articles = await this.enrichRssArticles(articles, contentSelector);
      }

      // Save articles with deduplication
      const { inserted, duplicates, merged, insertedIds } = await this.saveArticles(sourceId, articles);

      const duration = Date.now() - startTime;

      // Trigger watch keyword analysis for new articles
      if (insertedIds.length > 0) {
        this.watchAnalyzer.queueForAnalysis(insertedIds).catch((error) => {
          this.logger.warn('Watch analysis failed:', error);
        });
      }

      // Update source with new ETag/Last-Modified and health metrics
      await this.prisma.source.update({
        where: { id: sourceId },
        data: {
          lastEtag: feedResult.etag || null,
          lastFeedModified: feedResult.lastModified || null,
          feedMetadata: feedResult.metadata as any,
        },
      });

      // Update health metrics on success
      await this.updateHealthMetricsOnSuccess(sourceId, articles.length, inserted, duplicates, duration);

      // Update job as completed
      await this.prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: {
          status: 'COMPLETED',
          finishedAt: new Date(),
          itemsFound: articles.length,
          itemsInserted: inserted,
          duration,
          duplicateCount: duplicates,
        },
      });

      if (merged > 0) {
        this.logger.log(`AI Deduplication: ${merged} articles merged into existing groups`);
      }

      this.logger.log(
        `RSS crawl completed: ${articles.length} found, ${inserted} inserted, ${duplicates} duplicates (${duration}ms)`,
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
      const duration = Date.now() - startTime;

      await this.prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          errorMessage,
          duration,
        },
      });

      // Update health metrics on failure
      await this.updateHealthMetricsOnFailure(sourceId, errorMessage, duration);

      this.logger.error(`RSS crawl job failed for source ${sourceId}:`, errorMessage);
      throw error;
    }
  }

  /**
   * Convert RSS feed items to ArticleData format
   */
  private convertRssItemsToArticles(items: RssFeedItem[]): ArticleData[] {
    return items.map((item) => ({
      title: item.title,
      url: item.link,
      date: item.pubDate,
      content: item.content || item.summary || '',
      summary: item.contentSnippet || item.summary,
      imageUrl: item.imageUrl,
      isPartial: !item.content || item.content.length < 200, // Mark as partial if content is short
    }));
  }

  /**
   * Enrich RSS articles by fetching full content from detail pages
   */
  private async enrichRssArticles(
    articles: ArticleData[],
    contentSelector: string,
  ): Promise<ArticleData[]> {
    const enrichedArticles: ArticleData[] = [];

    for (const article of articles) {
      // Only enrich partial articles
      if (!article.isPartial) {
        enrichedArticles.push(article);
        continue;
      }

      try {
        this.logger.log(`Enriching article: ${article.url}`);

        // Try HTTP first for detail page
        const httpResult = await this.httpCrawler.tryHttpFetch(article.url);

        if (httpResult && !httpResult.needsJs) {
          // Extract content using selector
          const content = await this.httpCrawler.extractContentBySelector(
            httpResult.html,
            contentSelector,
          );

          if (content && content.length > (article.content?.length || 0)) {
            article.content = content;
            article.isPartial = false;
            this.logger.log(`Enriched article with ${content.length} chars`);
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to enrich article: ${article.url}`, error);
      }

      enrichedArticles.push(article);
    }

    return enrichedArticles;
  }

  /**
   * Process SELECTOR type source (existing logic)
   */
  private async processSelectorSource(
    job: Job<CrawlJobData>,
    startTime: number,
  ): Promise<CrawlJobResult> {
    const { sourceId, url, selectors } = job.data;

    // Validate selectors for SELECTOR type
    if (!selectors) {
      throw new Error('Selectors are required for SELECTOR type sources');
    }

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
    let usedPlaywright = false;

    try {
      let articles: ArticleData[] = [];

      // Check cache first
      const cachedHtml = await this.cacheService.getHtml(url);
      if (cachedHtml) {
        this.logger.log('Using cached HTML');
        const result = await this.httpCrawler.extractFromHtml(cachedHtml, selectors, url);
        if (result.count > 0) {
          // Extract detail pages for each link
          articles = await this.extractDetailPagesHybrid(result.links, selectors, url);
        }
      }

      // If no cache, try HTTP-first approach
      if (articles.length === 0 && this.useHttpFirst) {
        this.logger.log('Trying HTTP-first approach');
        const httpResult = await this.httpCrawler.tryHttpFetch(url);

        if (httpResult && !httpResult.needsJs) {
          // HTTP worked! Cache the HTML
          await this.cacheService.cacheHtml(url, httpResult.html);

          const result = await this.httpCrawler.extractFromHtml(httpResult.html, selectors, url);
          this.logger.log(`HTTP extraction found ${result.count} items`);

          if (result.count > 0) {
            articles = await this.extractDetailPagesHybrid(result.links, selectors, url);
          }
        }
      }

      // Fallback to Playwright if HTTP didn't work
      if (articles.length === 0) {
        this.logger.log('Falling back to Playwright');
        usedPlaywright = true;

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

        // Block unnecessary resources to save bandwidth (~90% reduction)
        await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,ico,woff,woff2,ttf,eot,otf}', route => route.abort());
        await page.route('**/analytics**', route => route.abort());
        await page.route('**/tracking**', route => route.abort());
        await page.route('**/ads**', route => route.abort());
        await page.route('**/gtag**', route => route.abort());
        await page.route('**/gtm**', route => route.abort());
        await page.route('**/facebook**', route => route.abort());
        await page.route('**/twitter**', route => route.abort());
        await page.route('**/*.mp4', route => route.abort());
        await page.route('**/*.webm', route => route.abort());

        // Navigate to URL
        this.logger.log(`Navigating to ${url}`);
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        // Wait a bit for dynamic content
        await page.waitForTimeout(2000);

        // Extract articles using Playwright
        articles = await this.extractArticles(page, selectors, url);
      }

      this.logger.log(`Found ${articles.length} articles (Playwright: ${usedPlaywright})`);

      // Process and save articles
      const { inserted, duplicates, merged, insertedIds } = await this.saveArticles(sourceId, articles);

      const duration = Date.now() - startTime;

      // Trigger watch keyword analysis for new articles
      if (insertedIds.length > 0) {
        this.watchAnalyzer.queueForAnalysis(insertedIds).catch((error) => {
          this.logger.warn('Watch analysis failed:', error);
        });
      }

      // Update job as completed
      await this.prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: {
          status: 'COMPLETED',
          finishedAt: new Date(),
          itemsFound: articles.length,
          itemsInserted: inserted,
          duration,
          duplicateCount: duplicates,
        },
      });

      if (merged > 0) {
        this.logger.log(`AI Deduplication: ${merged} articles merged into existing groups`);
      }

      // Update health metrics on success
      await this.updateHealthMetricsOnSuccess(sourceId, articles.length, inserted, duplicates, duration);

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
      const duration = Date.now() - startTime;

      // Update job as failed
      await this.prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          errorMessage,
          duration,
        },
      });

      // Update health metrics on failure
      await this.updateHealthMetricsOnFailure(sourceId, errorMessage, duration);

      this.logger.error(`Crawl job failed for source ${sourceId}:`, errorMessage);
      throw error;
    } finally {
      // Clean up
      if (page) await page.close();
      if (context) await context.close();
    }
  }

  /**
   * Extract articles using two-phase approach:
   * 1. List page: Find listItem elements, auto-detect links
   * 2. Detail page: Navigate to each link, extract title/date/content/summary/image
   */
  private async extractArticles(
    page: Page,
    selectors: SelectorConfig,
    baseUrl: string,
  ): Promise<ArticleData[]> {
    const articles: ArticleData[] = [];

    try {
      // Phase 1: Get all article links from list page
      await page.waitForSelector(selectors.listItem, { timeout: 10000 });

      const listItems = await page.$$(selectors.listItem);
      this.logger.log(`Found ${listItems.length} list items`);

      // Extract links from list items (auto-detect)
      const articleLinks: string[] = [];
      for (const item of listItems) {
        try {
          const link = await this.autoDetectLink(item, baseUrl);
          if (link && !articleLinks.includes(link)) {
            articleLinks.push(link);
          }
        } catch (err) {
          // Skip items without links
        }
      }

      this.logger.log(`Found ${articleLinks.length} unique article links`);

      // Phase 2: Visit each detail page and extract content
      for (const articleUrl of articleLinks) {
        try {
          const article = await this.extractDetailPage(page, articleUrl, selectors);
          if (article.title && article.url) {
            // Mark as partial if content is missing
            if (!article.content && !article.summary) {
              article.isPartial = true;
              this.logger.warn(`Partial extraction for: ${article.title.substring(0, 50)}...`);
            }
            articles.push(article);
            this.logger.log(`Extracted: ${article.title.substring(0, 50)}...`);
          }
        } catch (err) {
          this.logger.warn(`Failed to extract detail page: ${articleUrl}`, err);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to extract articles:`, error);
    }

    return articles;
  }

  /**
   * Auto-detect link within a list item element
   */
  private async autoDetectLink(item: any, baseUrl: string): Promise<string | null> {
    // Check if element itself is an anchor
    const tagName = await item.evaluate((el: Element) => el.tagName.toLowerCase());
    if (tagName === 'a') {
      const href = await item.getAttribute('href');
      if (href) return this.toAbsoluteUrl(href, baseUrl);
    }

    // Find first anchor inside
    const anchor = await item.$('a[href]');
    if (anchor) {
      const href = await anchor.getAttribute('href');
      if (href) return this.toAbsoluteUrl(href, baseUrl);
    }

    // Check parent
    const parentAnchor = await item.evaluateHandle((el: Element) => el.closest('a[href]'));
    if (parentAnchor) {
      const href = await parentAnchor.evaluate((el: Element) => el.getAttribute('href'));
      if (href) return this.toAbsoluteUrl(href, baseUrl);
    }

    return null;
  }

  /**
   * Navigate to detail page and extract article data
   */
  private async extractDetailPage(
    page: Page,
    url: string,
    selectors: SelectorConfig,
  ): Promise<ArticleData> {
    const article: ArticleData = {
      title: '',
      url: url,
    };

    // Navigate to detail page
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(1000);

    // Extract title
    if (selectors.title) {
      try {
        const titleElement = await page.$(selectors.title);
        if (titleElement) {
          const titleText = await titleElement.textContent();
          article.title = this.sanitizeText(titleText || '');
        }
      } catch {}
    }

    // Extract date
    if (selectors.date) {
      try {
        const dateElement = await page.$(selectors.date);
        if (dateElement) {
          const dateText = await dateElement.textContent();
          article.date = this.sanitizeText(dateText || '');
        }
      } catch {}
    }

    // Extract content
    if (selectors.content) {
      try {
        const contentElement = await page.$(selectors.content);
        if (contentElement) {
          const contentText = await contentElement.textContent();
          article.content = this.sanitizeText(contentText || '').substring(0, 5000);
        }
      } catch {}
    }

    // Extract summary
    if (selectors.summary) {
      try {
        const summaryElement = await page.$(selectors.summary);
        if (summaryElement) {
          const summaryText = await summaryElement.textContent();
          article.summary = this.sanitizeText(summaryText || '').substring(0, 500);
        }
      } catch {}
    }

    // Extract image
    if (selectors.image) {
      try {
        const imageElement = await page.$(selectors.image);
        if (imageElement) {
          const tagName = await imageElement.evaluate((el: Element) => el.tagName.toLowerCase());
          let imgSrc = '';

          if (tagName === 'img') {
            imgSrc = await imageElement.getAttribute('src') ||
                     await imageElement.getAttribute('data-src') ||
                     await imageElement.getAttribute('data-lazy-src') || '';
          } else {
            const img = await imageElement.$('img');
            if (img) {
              imgSrc = await img.getAttribute('src') ||
                       await img.getAttribute('data-src') || '';
            }
          }

          if (imgSrc) {
            article.imageUrl = this.toAbsoluteUrl(imgSrc, url);
          }
        }
      } catch {}
    }

    return article;
  }

  /**
   * Save articles to database with deduplication and AI similarity check
   */
  private async saveArticles(
    sourceId: string,
    articles: ArticleData[],
  ): Promise<{ inserted: number; duplicates: number; merged: number; insertedIds: string[] }> {
    let inserted = 0;
    let duplicates = 0;
    let merged = 0;
    const insertedIds: string[] = [];

    for (const article of articles) {
      const hash = this.generateArticleHash(sourceId, article.url);
      const urlHash = this.generateUrlHash(article.url);

      // Check if article already exists (same source, same URL)
      const existing = await this.prisma.article.findUnique({
        where: { hash },
      });

      if (existing) {
        duplicates++;
        continue;
      }

      // Check for cross-source duplicates using AI
      let groupId: string | null = null;
      let similarityScore: number | null = null;

      if (this.deduplicationService.isAvailable()) {
        try {
          const similarArticles = await this.deduplicationService.findSimilarArticles(
            {
              title: article.title,
              content: article.content,
              summary: article.summary,
              url: article.url,
            },
            sourceId, // Exclude current source from search
          );

          if (similarArticles.length > 0) {
            const bestMatch = similarArticles[0];

            if (bestMatch.similarity >= 0.8) {
              // Get the matched article
              const matchedArticle = await this.prisma.article.findUnique({
                where: { id: bestMatch.articleId },
              });

              if (matchedArticle) {
                if (matchedArticle.groupId) {
                  // Add to existing group
                  groupId = matchedArticle.groupId;
                } else {
                  // Create new group
                  const newArticle = {
                    title: article.title,
                    content: article.content || article.summary || '',
                    summary: article.summary || null,
                    imageUrl: article.imageUrl || null,
                    publishedAt: article.date ? this.parseDate(article.date) : new Date(),
                  };

                  const bestContent =
                    (newArticle.content?.length || 0) > matchedArticle.content.length
                      ? newArticle
                      : matchedArticle;

                  const group = await this.prisma.articleGroup.create({
                    data: {
                      title: bestContent.title,
                      content: bestContent.content,
                      summary: bestContent.summary,
                      imageUrl: bestContent.imageUrl,
                      publishedAt: bestContent.publishedAt,
                    },
                  });

                  groupId = group.id;

                  // Link matched article to the new group
                  await this.prisma.article.update({
                    where: { id: matchedArticle.id },
                    data: { groupId: group.id, similarityScore: 1.0 },
                  });

                  this.logger.log(
                    `Created new group ${group.id} for similar articles`,
                  );
                }

                similarityScore = bestMatch.similarity;
                merged++;
                this.logger.log(
                  `Merged article "${article.title.substring(0, 40)}..." with group (similarity: ${bestMatch.similarity.toFixed(2)})`,
                );
              }
            }
          }
        } catch (error) {
          this.logger.warn('AI deduplication check failed:', error);
        }
      }

      // Create new article
      try {
        // Format content with AI if available
        let formattedContent = article.content || article.summary || '';
        if (formattedContent && formattedContent.length > 200) {
          formattedContent = await this.aiExtractor.formatContent(formattedContent);
        }

        const createdArticle = await this.prisma.article.create({
          data: {
            sourceId,
            title: article.title,
            url: article.url,
            content: formattedContent,
            summary: article.summary,
            hash,
            urlHash,
            groupId,
            similarityScore,
            imageUrl: article.imageUrl,
            isPartial: article.isPartial || false,
            publishedAt: article.date ? this.parseDate(article.date) : new Date(),
          },
        });
        inserted++;
        insertedIds.push(createdArticle.id);
      } catch (error) {
        // Likely a duplicate that was inserted between check and create
        this.logger.warn(`Failed to insert article: ${article.url}`, error);
        duplicates++;
      }
    }

    return { inserted, duplicates, merged, insertedIds };
  }

  /**
   * Generate URL hash (source-independent)
   */
  private generateUrlHash(url: string): string {
    // Normalize URL before hashing
    try {
      const parsed = new URL(url);
      const normalized = `${parsed.hostname}${parsed.pathname}`;
      return crypto.createHash('sha256').update(normalized).digest('hex');
    } catch {
      return crypto.createHash('sha256').update(url).digest('hex');
    }
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
   * Update source health metrics after successful crawl
   */
  private async updateHealthMetricsOnSuccess(
    sourceId: string,
    itemsFound: number,
    itemsInserted: number,
    duplicates: number,
    duration: number,
  ): Promise<void> {
    const source = await this.prisma.source.findUnique({
      where: { id: sourceId },
      select: {
        totalCrawlCount: true,
        successfulCrawlCount: true,
        avgCrawlDuration: true,
      },
    });

    if (!source) return;

    // Calculate new average duration
    const newTotalCount = source.totalCrawlCount + 1;
    const newSuccessCount = source.successfulCrawlCount + 1;
    const newAvgDuration = source.avgCrawlDuration
      ? Math.round((source.avgCrawlDuration * source.successfulCrawlCount + duration) / newSuccessCount)
      : duration;

    await this.prisma.source.update({
      where: { id: sourceId },
      data: {
        lastCrawlAt: new Date(),
        consecutiveFailures: 0, // Reset on success
        totalCrawlCount: newTotalCount,
        successfulCrawlCount: newSuccessCount,
        totalArticlesFound: { increment: itemsFound },
        totalArticlesInserted: { increment: itemsInserted },
        avgCrawlDuration: newAvgDuration,
        lastCrawlDuration: duration,
        status: 'ACTIVE', // Ensure status is active on success
      },
    });
  }

  /**
   * Update source health metrics after failed crawl
   */
  private async updateHealthMetricsOnFailure(
    sourceId: string,
    errorMessage: string,
    duration: number,
  ): Promise<void> {
    const source = await this.prisma.source.findUnique({
      where: { id: sourceId },
      select: { consecutiveFailures: true, totalCrawlCount: true },
    });

    if (!source) return;

    const newConsecutiveFailures = source.consecutiveFailures + 1;
    const newStatus = newConsecutiveFailures >= 5 ? 'ERROR' : 'ACTIVE';

    await this.prisma.source.update({
      where: { id: sourceId },
      data: {
        consecutiveFailures: newConsecutiveFailures,
        lastErrorMessage: errorMessage.substring(0, 500), // Limit error message length
        lastErrorAt: new Date(),
        totalCrawlCount: { increment: 1 },
        failedCrawlCount: { increment: 1 },
        lastCrawlDuration: duration,
        status: newStatus,
      },
    });

    if (newConsecutiveFailures >= 5) {
      this.logger.warn(`Source ${sourceId} marked as ERROR after ${newConsecutiveFailures} consecutive failures`);
    }
  }

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

  /**
   * Extract detail pages using hybrid approach (HTTP first, Playwright fallback)
   */
  private async extractDetailPagesHybrid(
    links: string[],
    selectors: SelectorConfig,
    baseUrl: string,
  ): Promise<ArticleData[]> {
    const articles: ArticleData[] = [];

    for (const articleUrl of links) {
      try {
        // Try HTTP first for detail page
        const httpResult = await this.httpCrawler.tryHttpFetch(articleUrl);

        if (httpResult && !httpResult.needsJs) {
          // HTTP worked for detail page
          const article = await this.httpCrawler.extractDetailFromHtml(
            httpResult.html,
            articleUrl,
            selectors,
          );

          // If extraction is partial and AI fallback is enabled, try AI
          if (article.isPartial && this.useAIFallback && this.aiExtractor.isAvailable()) {
            this.logger.log(`Trying AI extraction for partial article: ${articleUrl}`);
            const aiResult = await this.aiExtractor.extractArticle({
              html: httpResult.html,
              url: articleUrl,
              hints: { siteType: 'news' },
            });

            if (aiResult && aiResult.confidence > 0.5) {
              article.title = aiResult.title || article.title;
              article.content = aiResult.content || article.content;
              article.summary = aiResult.summary || article.summary;
              article.date = aiResult.date || article.date;
              article.imageUrl = aiResult.imageUrl || article.imageUrl;
              article.isPartial = false;
              this.logger.log(`AI extraction successful for: ${article.title?.substring(0, 50)}...`);
            }
          }

          if (article.title && article.url) {
            articles.push(article);
            this.logger.log(`HTTP extracted: ${article.title.substring(0, 50)}...`);
          }
        } else {
          // Need to use Playwright for this detail page
          // For now, mark as needing browser and skip
          // Full Playwright extraction will be done in the main flow
          this.logger.debug(`Skipping ${articleUrl} - needs JavaScript`);
        }
      } catch (error) {
        this.logger.warn(`Failed to extract detail page: ${articleUrl}`, error);
      }
    }

    return articles;
  }
}
