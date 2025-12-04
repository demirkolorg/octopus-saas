import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProxyService } from '../proxy/proxy.service';
import { RssParserService } from '../crawler/rss-parser.service';
import * as cheerio from 'cheerio';
import {
  PreviewSourceDto,
  PreviewResultDto,
  PreviewResultItem,
  CreateSourceDto,
  SelectorsDto,
  PreviewRssFeedDto,
  CreateRssSourceDto,
  RssPreviewResultDto,
  RssPreviewItem,
  SourceHealthDto,
  SourceHealthSummaryDto,
  calculateHealthStatus,
  calculateSuccessRate,
} from './dto';

@Injectable()
export class SourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly proxyService: ProxyService,
    private readonly rssParser: RssParserService,
  ) {}

  /**
   * Preview scraping results before saving
   * Two-phase flow:
   * 1. List page: Find listItem elements, auto-detect links
   * 2. Detail page: Fetch each link, extract all fields (title, date, content, summary, image)
   */
  async preview(dto: PreviewSourceDto): Promise<PreviewResultDto> {
    try {
      // Phase 1: Fetch list page HTML
      const listHtml = await this.proxyService.fetchAndRewriteHtml(dto.url);
      const $ = cheerio.load(listHtml);

      // Find all list items
      const listItems = $(dto.selectors.listItem);

      if (listItems.length === 0) {
        return {
          success: false,
          items: [],
          totalFound: 0,
          error: 'Liste elemanı bulunamadı. Lütfen seçicinizi kontrol edin.',
        };
      }

      // Extract links from list items (auto-detect, limit to first 5 for preview)
      const links: string[] = [];
      listItems.slice(0, 5).each((_, element) => {
        const $item = $(element);
        const link = this.autoDetectLinkInElement($item, dto.url);
        if (link) {
          links.push(link);
        }
      });

      if (links.length === 0) {
        return {
          success: false,
          items: [],
          totalFound: listItems.length,
          error: 'Liste elemanlarında link bulunamadı. Haber kartlarının link içerdiğinden emin olun.',
        };
      }

      // Phase 2: Fetch detail pages and extract all fields
      const items: PreviewResultItem[] = [];
      for (const link of links) {
        try {
          const item = await this.extractDetailPageData(link, dto.selectors);
          if (item.title) {
            items.push(item);
          }
        } catch (err) {
          // Skip failed detail pages in preview
          console.error(`Failed to fetch detail page: ${link}`, err);
        }
      }

      if (items.length === 0) {
        return {
          success: false,
          items: [],
          totalFound: listItems.length,
          error: 'Detay sayfalarından veri çekilemedi. Lütfen seçicilerinizi kontrol edin.',
        };
      }

      return {
        success: true,
        items,
        totalFound: listItems.length,
      };
    } catch (error) {
      return {
        success: false,
        items: [],
        totalFound: 0,
        error: error instanceof Error ? error.message : 'Önizleme sırasında bir hata oluştu',
      };
    }
  }

  /**
   * Auto-detect link within a list item element
   * Looks for anchor tags in the element or its children
   */
  private autoDetectLinkInElement($item: any, baseUrl: string): string | null {
    let href: string | undefined;

    // Check if element itself is an anchor
    if ($item.is('a')) {
      href = $item.attr('href');
    }

    // Find first anchor inside
    if (!href) {
      const $anchor = $item.find('a[href]').first();
      if ($anchor.length > 0) {
        href = $anchor.attr('href');
      }
    }

    // Check parent if element is wrapped in anchor
    if (!href) {
      const $parent = $item.closest('a[href]');
      if ($parent.length > 0) {
        href = $parent.attr('href');
      }
    }

    if (!href) return null;

    // Convert relative URL to absolute
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return href;
    }
  }

  /**
   * Fetch detail page and extract all fields
   */
  private async extractDetailPageData(
    url: string,
    selectors: SelectorsDto,
  ): Promise<PreviewResultItem> {
    const result: PreviewResultItem = {
      title: '',
      link: url,
      date: '',
      content: '',
      summary: '',
      image: '',
    };

    const detailHtml = await this.proxyService.fetchAndRewriteHtml(url);
    const $ = cheerio.load(detailHtml);

    // Extract title
    const $title = $(selectors.title);
    if ($title.length > 0) {
      result.title = $title.first().text().trim();
    }

    // Extract date
    const $date = $(selectors.date);
    if ($date.length > 0) {
      result.date = $date.first().text().trim();
    }

    // Extract content
    const $content = $(selectors.content);
    if ($content.length > 0) {
      result.content = $content.first().text().trim().substring(0, 500);
    }

    // Extract summary
    const $summary = $(selectors.summary);
    if ($summary.length > 0) {
      result.summary = $summary.first().text().trim().substring(0, 300);
    }

    // Extract image
    const $image = $(selectors.image);
    if ($image.length > 0) {
      const imgElement = $image.first();
      // Check various image attributes
      result.image = imgElement.attr('src') ||
                     imgElement.attr('data-src') ||
                     imgElement.attr('data-lazy-src') ||
                     imgElement.find('img').first().attr('src') ||
                     '';

      // Convert relative URL to absolute
      if (result.image && !result.image.startsWith('http')) {
        try {
          result.image = new URL(result.image, url).toString();
        } catch {}
      }
    }

    return result;
  }

  /**
   * Create a new source
   */
  async create(dto: CreateSourceDto, userId: string) {
    // TODO: Validate that selectors actually work before saving
    const previewResult = await this.preview({
      url: dto.url,
      selectors: dto.selectors,
    });

    if (!previewResult.success) {
      throw new BadRequestException(
        previewResult.error || 'Seçiciler geçersiz. Kaynak oluşturulamadı.',
      );
    }

    // Create source in database
    const source = await this.prisma.source.create({
      data: {
        name: dto.name,
        url: dto.url,
        selectors: dto.selectors as any,
        refreshInterval: dto.refreshInterval || 900,
        userId,
        status: 'ACTIVE',
        siteId: dto.siteId,
        categoryId: dto.categoryId,
      },
      include: {
        site: true,
        category: true,
      },
    });

    return source;
  }

  /**
   * Get all sources for a user (including system sources)
   */
  async findAll(userId: string, siteId?: string, categoryId?: string) {
    return this.prisma.source.findMany({
      where: {
        OR: [
          { isSystem: true },      // Sistem kaynakları (herkes görebilir)
          { userId: userId },       // Kullanıcının kendi kaynakları
        ],
        ...(siteId && { siteId }),
        ...(categoryId && { categoryId }),
      },
      orderBy: [
        { isSystem: 'desc' },     // Sistem kaynakları önce
        { createdAt: 'desc' },
      ],
      include: {
        site: true,
        category: true,
        _count: {
          select: { articles: true },
        },
      },
    });
  }

  /**
   * Get only system sources
   */
  async findSystemSources() {
    return this.prisma.source.findMany({
      where: { isSystem: true },
      orderBy: { name: 'asc' },
      include: {
        site: true,
        category: true,
        _count: {
          select: { articles: true },
        },
      },
    });
  }

  /**
   * Get a single source
   */
  async findOne(id: string, userId: string) {
    const source = await this.prisma.source.findUnique({
      where: { id },
      include: {
        site: true,
        category: true,
        articles: {
          take: 10,
          orderBy: { publishedAt: 'desc' },
        },
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!source) {
      throw new NotFoundException('Kaynak bulunamadı');
    }

    // Kullanıcı bu kaynağa erişebilir mi?
    if (!source.isSystem && source.userId !== userId) {
      throw new ForbiddenException('Bu kaynağa erişim izniniz yok');
    }

    return source;
  }

  /**
   * Delete a source (only user sources, not system sources)
   */
  async delete(id: string, userId: string) {
    const source = await this.prisma.source.findUnique({
      where: { id },
    });

    if (!source) {
      throw new NotFoundException('Kaynak bulunamadı');
    }

    // Sistem kaynakları silinemez
    if (source.isSystem) {
      throw new ForbiddenException('Sistem kaynakları silinemez');
    }

    // Sadece sahibi silebilir
    if (source.userId !== userId) {
      throw new ForbiddenException('Bu kaynağa erişim izniniz yok');
    }

    await this.prisma.source.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Update source status (only user sources)
   */
  async updateStatus(id: string, userId: string, status: 'ACTIVE' | 'PAUSED' | 'ERROR') {
    const source = await this.prisma.source.findUnique({
      where: { id },
    });

    if (!source) {
      throw new NotFoundException('Kaynak bulunamadı');
    }

    // Sistem kaynakları durumu değiştirilemez
    if (source.isSystem) {
      throw new ForbiddenException('Sistem kaynaklarının durumu değiştirilemez');
    }

    // Sadece sahibi değiştirebilir
    if (source.userId !== userId) {
      throw new ForbiddenException('Bu kaynağa erişim izniniz yok');
    }

    return this.prisma.source.update({
      where: { id },
      data: { status },
    });
  }

  // ==================== RSS Source Methods ====================

  /**
   * Preview RSS feed before saving
   */
  async previewRssFeed(dto: PreviewRssFeedDto): Promise<RssPreviewResultDto> {
    try {
      const result = await this.rssParser.previewFeed(dto.feedUrl);

      // Transform to our DTO format
      const sampleItems: RssPreviewItem[] = result.sampleItems.map((item) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        summary: item.contentSnippet || item.summary,
        imageUrl: item.imageUrl,
        hasFullContent: (item.content?.length || 0) > 200,
      }));

      return {
        valid: result.valid,
        feedUrl: result.feedUrl,
        metadata: {
          title: result.metadata.title,
          description: result.metadata.description,
          link: result.metadata.link,
          language: result.metadata.language,
          imageUrl: result.metadata.imageUrl,
        },
        sampleItems,
        itemCount: result.itemCount,
        error: result.error,
      };
    } catch (error) {
      return {
        valid: false,
        feedUrl: dto.feedUrl,
        metadata: {},
        sampleItems: [],
        itemCount: 0,
        error: error instanceof Error ? error.message : 'RSS feed önizleme hatası',
      };
    }
  }

  /**
   * Create a new RSS source
   */
  async createRssSource(dto: CreateRssSourceDto, userId: string) {
    // Validate feed before saving
    const previewResult = await this.previewRssFeed({ feedUrl: dto.feedUrl });

    if (!previewResult.valid) {
      throw new BadRequestException(
        previewResult.error || 'Geçersiz RSS feed. Kaynak oluşturulamadı.',
      );
    }

    // Create source in database
    const source = await this.prisma.source.create({
      data: {
        name: dto.name,
        url: dto.url,
        sourceType: 'RSS',
        feedUrl: dto.feedUrl,
        feedMetadata: previewResult.metadata as any,
        refreshInterval: dto.refreshInterval || 900,
        enrichContent: dto.enrichContent || false,
        contentSelector: dto.contentSelector,
        userId,
        status: 'ACTIVE',
        siteId: dto.siteId,
        categoryId: dto.categoryId,
      },
      include: {
        site: true,
        category: true,
      },
    });

    return source;
  }

  // ==================== Health Monitoring Methods ====================

  /**
   * Get health metrics for a single source
   */
  async getSourceHealth(id: string, userId: string): Promise<SourceHealthDto> {
    const source = await this.prisma.source.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        totalCrawlCount: true,
        successfulCrawlCount: true,
        failedCrawlCount: true,
        consecutiveFailures: true,
        lastErrorMessage: true,
        lastErrorAt: true,
        totalArticlesFound: true,
        totalArticlesInserted: true,
        avgCrawlDuration: true,
        lastCrawlDuration: true,
        lastCrawlAt: true,
        isSystem: true,
        userId: true,
      },
    });

    if (!source) {
      throw new NotFoundException('Kaynak bulunamadı');
    }

    // Check access
    if (!source.isSystem && source.userId !== userId) {
      throw new ForbiddenException('Bu kaynağa erişim izniniz yok');
    }

    const healthStatus = calculateHealthStatus(
      source.totalCrawlCount,
      source.successfulCrawlCount,
      source.consecutiveFailures,
    );

    const successRate = calculateSuccessRate(
      source.totalCrawlCount,
      source.successfulCrawlCount,
    );

    return {
      sourceId: source.id,
      sourceName: source.name,
      healthStatus,
      successRate,
      totalCrawls: source.totalCrawlCount,
      successfulCrawls: source.successfulCrawlCount,
      failedCrawls: source.failedCrawlCount,
      consecutiveFailures: source.consecutiveFailures,
      lastErrorMessage: source.lastErrorMessage || undefined,
      lastErrorAt: source.lastErrorAt || undefined,
      totalArticlesFound: source.totalArticlesFound,
      totalArticlesInserted: source.totalArticlesInserted,
      avgCrawlDuration: source.avgCrawlDuration || undefined,
      lastCrawlDuration: source.lastCrawlDuration || undefined,
      lastCrawlAt: source.lastCrawlAt || undefined,
    };
  }

  /**
   * Get health summary for all sources of a user
   */
  async getSourcesHealthSummary(userId: string): Promise<SourceHealthSummaryDto> {
    const sources = await this.prisma.source.findMany({
      where: {
        OR: [
          { isSystem: true },
          { userId: userId },
        ],
      },
      select: {
        totalCrawlCount: true,
        successfulCrawlCount: true,
        failedCrawlCount: true,
        consecutiveFailures: true,
        totalArticlesInserted: true,
      },
    });

    let healthySources = 0;
    let warningSources = 0;
    let criticalSources = 0;
    let totalCrawls = 0;
    let totalSuccessfulCrawls = 0;
    let totalFailedCrawls = 0;

    for (const source of sources) {
      const status = calculateHealthStatus(
        source.totalCrawlCount,
        source.successfulCrawlCount,
        source.consecutiveFailures,
      );

      if (status === 'HEALTHY') healthySources++;
      else if (status === 'WARNING') warningSources++;
      else criticalSources++;

      totalCrawls += source.totalCrawlCount;
      totalSuccessfulCrawls += source.successfulCrawlCount;
      totalFailedCrawls += source.failedCrawlCount;
    }

    const overallSuccessRate = totalCrawls > 0
      ? Math.round((totalSuccessfulCrawls / totalCrawls) * 100)
      : 100;

    // Get crawls and articles from last 24 hours
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentCrawls = await this.prisma.crawlJob.count({
      where: {
        startedAt: { gte: last24h },
        source: {
          OR: [
            { isSystem: true },
            { userId: userId },
          ],
        },
      },
    });

    const recentArticles = await this.prisma.article.count({
      where: {
        createdAt: { gte: last24h },
        source: {
          OR: [
            { isSystem: true },
            { userId: userId },
          ],
        },
      },
    });

    return {
      totalSources: sources.length,
      healthySources,
      warningSources,
      criticalSources,
      totalCrawls,
      totalSuccessfulCrawls,
      totalFailedCrawls,
      overallSuccessRate,
      crawlsLast24h: recentCrawls,
      articlesLast24h: recentArticles,
    };
  }

  /**
   * Reset health metrics for a source
   */
  async resetSourceHealth(id: string, userId: string) {
    const source = await this.prisma.source.findUnique({
      where: { id },
    });

    if (!source) {
      throw new NotFoundException('Kaynak bulunamadı');
    }

    // Sistem kaynakları resetlenemez
    if (source.isSystem) {
      throw new ForbiddenException('Sistem kaynaklarının metrikleri sıfırlanamaz');
    }

    // Sadece sahibi sıfırlayabilir
    if (source.userId !== userId) {
      throw new ForbiddenException('Bu kaynağa erişim izniniz yok');
    }

    return this.prisma.source.update({
      where: { id },
      data: {
        consecutiveFailures: 0,
        lastErrorMessage: null,
        lastErrorAt: null,
        totalCrawlCount: 0,
        successfulCrawlCount: 0,
        failedCrawlCount: 0,
        totalArticlesFound: 0,
        totalArticlesInserted: 0,
        avgCrawlDuration: null,
        lastCrawlDuration: null,
        status: 'ACTIVE',
      },
    });
  }
}
