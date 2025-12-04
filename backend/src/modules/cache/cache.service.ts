import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;

  // Default TTL values (in seconds)
  private readonly TTL_HTML = parseInt(process.env.CACHE_TTL_HTML || '300', 10); // 5 minutes
  private readonly TTL_SELECTOR = parseInt(process.env.CACHE_TTL_SELECTOR || '3600', 10); // 1 hour
  private readonly TTL_METADATA = parseInt(process.env.CACHE_TTL_METADATA || '86400', 10); // 24 hours

  async onModuleInit() {
    try {
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed, cache disabled');
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        },
      });

      this.redis.on('connect', () => {
        this.logger.log('Redis cache connected');
      });

      this.redis.on('error', (err) => {
        this.logger.warn(`Redis error: ${err.message}`);
      });
    } catch (error) {
      this.logger.warn('Failed to initialize Redis cache, running without cache');
      this.redis = null;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  /**
   * Generate cache key for HTML content
   */
  private htmlKey(url: string): string {
    return `html:${url}`;
  }

  /**
   * Generate cache key for selector validation
   */
  private selectorKey(sourceId: string): string {
    return `selector:${sourceId}`;
  }

  /**
   * Generate cache key for source metadata
   */
  private metadataKey(sourceId: string): string {
    return `metadata:${sourceId}`;
  }

  /**
   * Cache HTML content
   */
  async cacheHtml(url: string, html: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.redis!.setex(this.htmlKey(url), this.TTL_HTML, html);
      this.logger.debug(`Cached HTML for ${url} (TTL: ${this.TTL_HTML}s)`);
    } catch (error) {
      this.logger.warn(`Failed to cache HTML: ${error}`);
    }
  }

  /**
   * Get cached HTML content
   */
  async getHtml(url: string): Promise<string | null> {
    if (!this.isAvailable()) return null;

    try {
      const html = await this.redis!.get(this.htmlKey(url));
      if (html) {
        this.logger.debug(`Cache hit for HTML: ${url}`);
      }
      return html;
    } catch (error) {
      this.logger.warn(`Failed to get cached HTML: ${error}`);
      return null;
    }
  }

  /**
   * Cache selector validation result
   */
  async cacheSelectorValidation(
    sourceId: string,
    isValid: boolean,
    foundCount: number,
  ): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const data = JSON.stringify({ isValid, foundCount, cachedAt: Date.now() });
      await this.redis!.setex(this.selectorKey(sourceId), this.TTL_SELECTOR, data);
      this.logger.debug(`Cached selector validation for source ${sourceId}`);
    } catch (error) {
      this.logger.warn(`Failed to cache selector validation: ${error}`);
    }
  }

  /**
   * Get cached selector validation
   */
  async getSelectorValidation(
    sourceId: string,
  ): Promise<{ isValid: boolean; foundCount: number } | null> {
    if (!this.isAvailable()) return null;

    try {
      const data = await this.redis!.get(this.selectorKey(sourceId));
      if (data) {
        const parsed = JSON.parse(data);
        this.logger.debug(`Cache hit for selector validation: ${sourceId}`);
        return { isValid: parsed.isValid, foundCount: parsed.foundCount };
      }
      return null;
    } catch (error) {
      this.logger.warn(`Failed to get cached selector validation: ${error}`);
      return null;
    }
  }

  /**
   * Cache source metadata
   */
  async cacheMetadata(sourceId: string, metadata: Record<string, any>): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const data = JSON.stringify({ ...metadata, cachedAt: Date.now() });
      await this.redis!.setex(this.metadataKey(sourceId), this.TTL_METADATA, data);
      this.logger.debug(`Cached metadata for source ${sourceId}`);
    } catch (error) {
      this.logger.warn(`Failed to cache metadata: ${error}`);
    }
  }

  /**
   * Get cached source metadata
   */
  async getMetadata(sourceId: string): Promise<Record<string, any> | null> {
    if (!this.isAvailable()) return null;

    try {
      const data = await this.redis!.get(this.metadataKey(sourceId));
      if (data) {
        this.logger.debug(`Cache hit for metadata: ${sourceId}`);
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      this.logger.warn(`Failed to get cached metadata: ${error}`);
      return null;
    }
  }

  /**
   * Invalidate all cache for a source
   */
  async invalidateSource(sourceId: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.redis!.del(this.selectorKey(sourceId));
      await this.redis!.del(this.metadataKey(sourceId));
      this.logger.debug(`Invalidated cache for source ${sourceId}`);
    } catch (error) {
      this.logger.warn(`Failed to invalidate source cache: ${error}`);
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async clearAll(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.redis!.flushdb();
      this.logger.log('All cache cleared');
    } catch (error) {
      this.logger.warn(`Failed to clear cache: ${error}`);
    }
  }

  /**
   * Get cache stats
   */
  async getStats(): Promise<{
    connected: boolean;
    keys: number;
    memory: string;
  }> {
    if (!this.isAvailable()) {
      return { connected: false, keys: 0, memory: '0' };
    }

    try {
      const info = await this.redis!.info('memory');
      const dbSize = await this.redis!.dbsize();

      // Parse memory usage from info
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memory = memoryMatch ? memoryMatch[1] : 'unknown';

      return {
        connected: true,
        keys: dbSize,
        memory,
      };
    } catch (error) {
      return { connected: false, keys: 0, memory: '0' };
    }
  }
}
