import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';

// RSS feed item interface
export interface RssFeedItem {
  title: string;
  link: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
  description?: string;
  creator?: string;
  author?: string;
  imageUrl?: string;
  guid?: string;
  categories?: string[];
}

// RSS feed metadata interface
export interface RssFeedMetadata {
  title?: string;
  description?: string;
  link?: string;
  language?: string;
  lastBuildDate?: string;
  imageUrl?: string;
  feedUrl?: string;
}

// RSS fetch result interface
export interface RssFetchResult {
  items: RssFeedItem[];
  metadata: RssFeedMetadata;
  etag?: string;
  lastModified?: string;
  notModified: boolean;
}

// RSS preview result interface
export interface RssPreviewResult {
  valid: boolean;
  feedUrl: string;
  metadata: RssFeedMetadata;
  sampleItems: RssFeedItem[];
  itemCount: number;
  error?: string;
}

// Custom feed type for rss-parser with media extensions
type CustomFeed = {
  title?: string;
  description?: string;
  link?: string;
  language?: string;
  lastBuildDate?: string;
  image?: { url?: string };
  feedUrl?: string;
};

type CustomItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
  description?: string;
  creator?: string;
  author?: string;
  guid?: string;
  categories?: string[];
  // Media extensions
  'media:content'?: { $?: { url?: string } };
  'media:thumbnail'?: { $?: { url?: string } };
  enclosure?: { url?: string; type?: string };
  'content:encoded'?: string;
  itunes?: { image?: string };
};

@Injectable()
export class RssParserService {
  private readonly logger = new Logger(RssParserService.name);
  private readonly parser: Parser<CustomFeed, CustomItem>;

  constructor() {
    // Initialize parser with custom fields for media content
    this.parser = new Parser({
      customFields: {
        feed: ['language', 'lastBuildDate', 'image'],
        item: [
          ['media:content', 'media:content'],
          ['media:thumbnail', 'media:thumbnail'],
          ['content:encoded', 'content:encoded'],
          'enclosure',
          'author',
          'creator',
        ],
      },
      timeout: 30000,
    });
  }

  /**
   * Fetch and parse RSS feed with conditional request support
   */
  async fetchFeed(
    feedUrl: string,
    options?: {
      etag?: string;
      lastModified?: string;
    },
  ): Promise<RssFetchResult> {
    this.logger.log(`Fetching RSS feed: ${feedUrl}`);

    try {
      // Build request headers for conditional request
      const headers: Record<string, string> = {
        'User-Agent': 'OctopusSaaS/1.0 RSS Reader',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      };

      if (options?.etag) {
        headers['If-None-Match'] = options.etag;
      }
      if (options?.lastModified) {
        headers['If-Modified-Since'] = options.lastModified;
      }

      // Fetch with conditional request
      const response = await fetch(feedUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(30000),
      });

      // Handle 304 Not Modified
      if (response.status === 304) {
        this.logger.log('Feed not modified (304)');
        return {
          items: [],
          metadata: {},
          notModified: true,
          etag: options?.etag,
          lastModified: options?.lastModified,
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get ETag and Last-Modified from response
      const newEtag = response.headers.get('etag') || undefined;
      const newLastModified = response.headers.get('last-modified') || undefined;

      // Parse the feed
      const xml = await response.text();
      const feed = await this.parser.parseString(xml);

      // Extract metadata
      const metadata: RssFeedMetadata = {
        title: feed.title,
        description: feed.description,
        link: feed.link,
        language: feed.language,
        lastBuildDate: feed.lastBuildDate,
        imageUrl: feed.image?.url,
        feedUrl: feed.feedUrl || feedUrl,
      };

      // Transform items
      const items = (feed.items || []).map((item) => this.transformItem(item, feedUrl));

      this.logger.log(`Parsed ${items.length} items from RSS feed`);

      return {
        items,
        metadata,
        etag: newEtag,
        lastModified: newLastModified,
        notModified: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch RSS feed: ${message}`);
      throw new Error(`RSS fetch failed: ${message}`);
    }
  }

  /**
   * Preview RSS feed - validate and return sample items
   */
  async previewFeed(feedUrl: string): Promise<RssPreviewResult> {
    this.logger.log(`Previewing RSS feed: ${feedUrl}`);

    try {
      const result = await this.fetchFeed(feedUrl);

      return {
        valid: true,
        feedUrl,
        metadata: result.metadata,
        sampleItems: result.items.slice(0, 5), // Return first 5 items as preview
        itemCount: result.items.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`RSS preview failed: ${message}`);

      return {
        valid: false,
        feedUrl,
        metadata: {},
        sampleItems: [],
        itemCount: 0,
        error: message,
      };
    }
  }

  /**
   * Validate if URL is a valid RSS feed
   */
  async validateFeed(feedUrl: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const preview = await this.previewFeed(feedUrl);
      return {
        valid: preview.valid && preview.itemCount > 0,
        error: preview.error,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Transform RSS item to normalized format
   */
  private transformItem(item: CustomItem, feedUrl: string): RssFeedItem {
    return {
      title: this.sanitizeText(item.title || ''),
      link: this.toAbsoluteUrl(item.link || '', feedUrl),
      pubDate: item.pubDate,
      content: this.extractContent(item),
      contentSnippet: this.sanitizeText(item.contentSnippet || ''),
      summary: this.sanitizeText(item.summary || item.description || ''),
      description: item.description,
      creator: item.creator || item.author,
      author: item.author || item.creator,
      imageUrl: this.extractImage(item),
      guid: item.guid,
      categories: item.categories,
    };
  }

  /**
   * Extract best available content from RSS item
   */
  private extractContent(item: CustomItem): string {
    // Priority: content:encoded > content > description
    const content =
      item['content:encoded'] ||
      item.content ||
      item.description ||
      item.summary ||
      '';

    return this.sanitizeHtml(content);
  }

  /**
   * Extract image URL from various RSS fields
   */
  private extractImage(item: CustomItem): string | undefined {
    // Try different image sources in priority order:
    // 1. media:content
    if (item['media:content']?.$?.url) {
      return item['media:content'].$.url;
    }

    // 2. media:thumbnail
    if (item['media:thumbnail']?.$?.url) {
      return item['media:thumbnail'].$.url;
    }

    // 3. enclosure (if image type)
    if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
      return item.enclosure.url;
    }

    // 4. iTunes image
    if (item.itunes?.image) {
      return item.itunes.image;
    }

    // 5. Try to extract from content/description
    const content = item['content:encoded'] || item.content || item.description || '';
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1]) {
      return imgMatch[1];
    }

    return undefined;
  }

  /**
   * Sanitize HTML content - remove tags but keep text
   */
  private sanitizeHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Sanitize plain text
   */
  private sanitizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
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
}
