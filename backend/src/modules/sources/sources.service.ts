import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProxyService } from '../proxy/proxy.service';
import * as cheerio from 'cheerio';
import {
  PreviewSourceDto,
  PreviewResultDto,
  PreviewResultItem,
  CreateSourceDto,
  SelectorsDto,
} from './dto';

@Injectable()
export class SourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly proxyService: ProxyService,
  ) {}

  /**
   * Preview scraping results before saving
   */
  async preview(dto: PreviewSourceDto): Promise<PreviewResultDto> {
    try {
      // Fetch HTML using proxy service
      const html = await this.proxyService.fetchAndRewriteHtml(dto.url);

      // Parse with Cheerio
      const $ = cheerio.load(html);
      const items: PreviewResultItem[] = [];

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

      // Extract data from each list item (limit to first 5 for preview)
      listItems.slice(0, 5).each((_, element) => {
        const $item = $(element);
        const item = this.extractItemData($item, dto.selectors, $);

        if (item.title && item.link) {
          items.push(item);
        }
      });

      if (items.length === 0) {
        return {
          success: false,
          items: [],
          totalFound: listItems.length,
          error: 'Başlık veya link bulunamadı. Lütfen seçicilerinizi kontrol edin.',
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
   * Extract data from a single list item
   */
  private extractItemData(
    $item: any,
    selectors: SelectorsDto,
    $: any,
  ): PreviewResultItem {
    const result: PreviewResultItem = {
      title: '',
      link: '',
    };

    // Extract title
    const $title = $item.find(selectors.title);
    if ($title.length > 0) {
      result.title = $title.first().text().trim();
    }

    // Extract link
    const $link = $item.find(selectors.link);
    if ($link.length > 0) {
      const linkElement = $link.first();
      // Check if it's an anchor tag or has a link inside
      if (linkElement.is('a')) {
        result.link = linkElement.attr('href') || '';
      } else {
        const innerLink = linkElement.find('a').first();
        result.link = innerLink.attr('href') || '';
      }
    }

    // Extract date (optional)
    if (selectors.date) {
      const $date = $item.find(selectors.date);
      if ($date.length > 0) {
        result.date = $date.first().text().trim();
      }
    }

    // Extract summary (optional)
    if (selectors.summary) {
      const $summary = $item.find(selectors.summary);
      if ($summary.length > 0) {
        result.summary = $summary.first().text().trim().substring(0, 200);
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
      },
    });

    return source;
  }

  /**
   * Get all sources for a user
   */
  async findAll(userId: string) {
    return this.prisma.source.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
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
    const source = await this.prisma.source.findFirst({
      where: { id, userId },
      include: {
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

    return source;
  }

  /**
   * Delete a source
   */
  async delete(id: string, userId: string) {
    const source = await this.prisma.source.findFirst({
      where: { id, userId },
    });

    if (!source) {
      throw new NotFoundException('Kaynak bulunamadı');
    }

    await this.prisma.source.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Update source status
   */
  async updateStatus(id: string, userId: string, status: 'ACTIVE' | 'PAUSED' | 'ERROR') {
    const source = await this.prisma.source.findFirst({
      where: { id, userId },
    });

    if (!source) {
      throw new NotFoundException('Kaynak bulunamadı');
    }

    return this.prisma.source.update({
      where: { id },
      data: { status },
    });
  }
}
