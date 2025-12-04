import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import OpenAI from 'openai';
import {
  SimilarityResult,
  ArticleData,
  DeduplicationConfig,
} from './dto/similarity-result.dto';
import { Article, ArticleGroup } from '@prisma/client';

@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name);
  private client: OpenAI | null = null;
  private modelName: string = 'llama-3.3-70b';
  private isEnabled = false;

  private readonly config: DeduplicationConfig = {
    similarityThreshold: 0.8,
    titleSimilarityPrefilter: 0.15, // Lowered for Turkish morphology
    maxDaysBack: 7,
    batchSize: 10,
  };

  // Common Turkish suffixes to strip for better matching
  private readonly turkishSuffixes = [
    'ler', 'lar', 'leri', 'ları', 'de', 'da', 'den', 'dan', 'te', 'ta',
    'ten', 'tan', 'e', 'a', 'ye', 'ya', 'i', 'ı', 'u', 'ü', 'si', 'sı',
    'su', 'sü', 'nin', 'nın', 'nun', 'nün', 'in', 'ın', 'un', 'ün',
    'yi', 'yı', 'yu', 'yü', 'deki', 'daki', 'teki', 'taki',
    'mek', 'mak', 'miş', 'mış', 'muş', 'müş', 'ecek', 'acak',
    'yor', 'iyor', 'ıyor', 'uyor', 'üyor', 'di', 'dı', 'du', 'dü',
    'ti', 'tı', 'tu', 'tü', 'se', 'sa', 'ise', 'ısa',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {
    // Try Cerebras API first, then fall back to Gemini
    const cerebrasKey = process.env.CEREBRAS_API_KEY;
    if (cerebrasKey) {
      this.client = new OpenAI({
        baseURL: 'https://api.cerebras.ai/v1',
        apiKey: cerebrasKey,
      });
      this.modelName = process.env.CEREBRAS_MODEL || 'llama-3.3-70b';
      this.isEnabled = true;
      this.logger.log(`DeduplicationService initialized with Cerebras AI (${this.modelName})`);
    } else {
      this.logger.warn('CEREBRAS_API_KEY not set, deduplication disabled');
    }
  }

  /**
   * Check if deduplication is available
   */
  isAvailable(): boolean {
    return this.isEnabled && this.client !== null;
  }

  /**
   * Find similar articles for a new article
   */
  async findSimilarArticles(
    newArticle: ArticleData,
    excludeSourceId?: string,
  ): Promise<SimilarityResult[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      // Get recent articles (last N days)
      const since = new Date();
      since.setDate(since.getDate() - this.config.maxDaysBack);

      const recentArticles = await this.prisma.article.findMany({
        where: {
          createdAt: { gte: since },
          ...(excludeSourceId && { sourceId: { not: excludeSourceId } }),
        },
        select: {
          id: true,
          title: true,
          content: true,
          summary: true,
          url: true,
          groupId: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 500, // Limit for performance
      });

      this.logger.debug(`Checking against ${recentArticles.length} recent articles`);

      // Check similarity with batch processing
      const similarities = await this.checkSimilarityBatch(newArticle, recentArticles);

      // Filter by threshold
      return similarities.filter((s) => s.similarity >= this.config.similarityThreshold);
    } catch (error) {
      this.logger.error('Error finding similar articles:', error);
      return [];
    }
  }

  /**
   * Check similarity using Cerebras AI (OpenAI-compatible) with retry logic
   */
  async checkSimilarity(
    article1: ArticleData,
    article2: ArticleData,
  ): Promise<Omit<SimilarityResult, 'articleId'>> {
    if (!this.client) {
      return { isSameNews: false, similarity: 0, reason: 'AI not available' };
    }

    // Check cache first
    const cacheKey = `dedup:${this.hashContent(article1.title)}:${this.hashContent(article2.title)}`;
    const cached = await this.getCachedSimilarity(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = `İki haber metnini karşılaştır ve aynı olayı/konuyu anlatıp anlatmadıklarını belirle.

Haber 1:
Başlık: ${article1.title}
İçerik: ${(article1.content || article1.summary || '').substring(0, 500)}

Haber 2:
Başlık: ${article2.title}
İçerik: ${(article2.content || article2.summary || '').substring(0, 500)}

SADECE JSON formatında yanıt ver, başka hiçbir şey yazma:
{"isSameNews": true veya false, "similarity": 0.0-1.0 arası sayı, "reason": "Kısa açıklama"}

Kurallar:
- Aynı olay farklı kelimelerle anlatılmış olabilir
- Başlıklar farklı olsa da içerik aynı haberi işliyorsa isSameNews = true
- similarity: 1.0 = kesinlikle aynı haber, 0.8+ = muhtemelen aynı, 0.5-0.8 = benzer konu, <0.5 = farklı`;

    // Retry logic for rate limiting
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // OpenAI-compatible API for Cerebras
        const response = await this.client.chat.completions.create({
          model: this.modelName,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 200,
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
          return { isSameNews: false, similarity: 0, reason: 'Empty response' };
        }

        // Parse JSON from response (handle potential markdown code blocks)
        let jsonStr = content.trim();
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(jsonStr);
        const finalResult = {
          isSameNews: parsed.isSameNews || false,
          similarity: parsed.similarity || 0,
          reason: parsed.reason || '',
        };

        // Cache the result
        await this.cacheSimilarity(cacheKey, finalResult);

        return finalResult;
      } catch (error: any) {
        const isRateLimit = error?.status === 429 ||
          error?.message?.includes('rate_limit') ||
          error?.message?.includes('quota');

        if (isRateLimit && attempt < maxRetries) {
          const delay = attempt * 2000; // 2s, 4s, 6s (Cerebras has higher limits)
          this.logger.warn(`Rate limited, waiting ${delay / 1000}s before retry ${attempt + 1}/${maxRetries}`);
          await this.sleep(delay);
          continue;
        }

        this.logger.error(`AI similarity check failed (attempt ${attempt}):`, error?.message || error);
        return { isSameNews: false, similarity: 0, reason: 'Error occurred' };
      }
    }

    return { isSameNews: false, similarity: 0, reason: 'Max retries exceeded' };
  }

  /**
   * Sleep helper for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Batch check similarity with pre-filtering
   */
  async checkSimilarityBatch(
    newArticle: ArticleData,
    candidates: Array<{
      id: string;
      title: string;
      content: string;
      summary: string | null;
      url: string;
      groupId: string | null;
    }>,
  ): Promise<SimilarityResult[]> {
    // Pre-filter by title similarity (Jaccard)
    const potentialMatches = candidates.filter(
      (c) =>
        this.quickTitleSimilarity(newArticle.title, c.title) >=
        this.config.titleSimilarityPrefilter,
    );

    this.logger.debug(
      `Pre-filter: ${candidates.length} -> ${potentialMatches.length} potential matches`,
    );

    if (potentialMatches.length === 0) {
      return [];
    }

    // Check AI similarity for filtered candidates
    const results: SimilarityResult[] = [];

    for (let i = 0; i < potentialMatches.length; i++) {
      const candidate = potentialMatches[i];

      // Add delay between API calls (Cerebras: 14,400/day = 10/min, so 500ms is safe)
      if (i > 0) {
        await this.sleep(500);
      }

      const similarity = await this.checkSimilarity(newArticle, {
        title: candidate.title,
        content: candidate.content,
        summary: candidate.summary || undefined,
        url: candidate.url,
      });

      results.push({
        articleId: candidate.id,
        ...similarity,
      });

      // Stop if we found a high match
      if (similarity.similarity >= 0.9) {
        break;
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Quick title similarity using Jaccard index with Turkish stemming
   */
  quickTitleSimilarity(title1: string, title2: string): number {
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFFğüşıöçĞÜŞİÖÇ]/g, '')
        .trim();

    const t1 = normalize(title1);
    const t2 = normalize(title2);

    // Simple Turkish stemming - strip common suffixes
    const stem = (word: string): string => {
      if (word.length < 4) return word;
      for (const suffix of this.turkishSuffixes) {
        if (word.endsWith(suffix) && word.length - suffix.length >= 2) {
          return word.slice(0, -suffix.length);
        }
      }
      return word;
    };

    const words1 = new Set(
      t1.split(/\s+/).filter((w) => w.length > 2).map(stem),
    );
    const words2 = new Set(
      t2.split(/\s+/).filter((w) => w.length > 2).map(stem),
    );

    if (words1.size === 0 || words2.size === 0) {
      return 0;
    }

    const intersection = [...words1].filter((w) => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return intersection / union;
  }

  /**
   * Create or get existing article group
   */
  async getOrCreateGroup(
    primaryArticle: Article,
    matchedArticle: Article,
    similarityScore: number,
  ): Promise<ArticleGroup> {
    // If matched article already has a group, use that
    if (matchedArticle.groupId) {
      const existingGroup = await this.prisma.articleGroup.findUnique({
        where: { id: matchedArticle.groupId },
      });
      if (existingGroup) {
        return existingGroup;
      }
    }

    // Create new group with the best content
    const bestContent =
      primaryArticle.content.length > matchedArticle.content.length
        ? primaryArticle
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

    // Link both articles to the group
    await this.prisma.article.update({
      where: { id: matchedArticle.id },
      data: { groupId: group.id, similarityScore: 1.0 },
    });

    this.logger.log(
      `Created new article group: ${group.id} with articles ${matchedArticle.id}`,
    );

    return group;
  }

  /**
   * Add article to existing group
   */
  async addToGroup(
    articleId: string,
    groupId: string,
    similarityScore: number,
  ): Promise<void> {
    await this.prisma.article.update({
      where: { id: articleId },
      data: { groupId, similarityScore },
    });

    this.logger.log(`Added article ${articleId} to group ${groupId}`);
  }

  /**
   * Normalize title for comparison (remove punctuation, lowercase, trim)
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFFğüşıöçĞÜŞİÖÇ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Deduplicate all existing articles (migration job)
   * First phase: Group exact title matches (no AI needed)
   * Second phase: Use AI for fuzzy matching (if API quota available)
   */
  async deduplicateExistingArticles(
    onProgress?: (current: number, total: number, grouped: number) => void,
  ): Promise<{ processed: number; grouped: number; groups: number }> {
    const allArticles = await this.prisma.article.findMany({
      where: { groupId: null },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        url: true,
        sourceId: true,
        createdAt: true,
        imageUrl: true,
        publishedAt: true,
      },
    });

    this.logger.log(`Processing ${allArticles.length} ungrouped articles...`);

    let grouped = 0;
    const processedIds = new Set<string>();

    // PHASE 1: Group exact title matches (no AI needed)
    this.logger.log('Phase 1: Grouping exact title matches...');

    // Build title -> articles map
    const titleMap = new Map<string, typeof allArticles>();
    for (const article of allArticles) {
      const normalizedTitle = this.normalizeTitle(article.title);
      if (!titleMap.has(normalizedTitle)) {
        titleMap.set(normalizedTitle, []);
      }
      titleMap.get(normalizedTitle)!.push(article);
    }

    // Group articles with exact same title
    for (const [normalizedTitle, articles] of titleMap) {
      if (articles.length < 2) continue;

      // All articles with same title should be grouped
      const primaryArticle = articles.reduce((best, current) =>
        current.content.length > best.content.length ? current : best
      );

      const group = await this.prisma.articleGroup.create({
        data: {
          title: primaryArticle.title,
          content: primaryArticle.content,
          summary: primaryArticle.summary,
          imageUrl: primaryArticle.imageUrl,
          publishedAt: primaryArticle.publishedAt,
        },
      });

      // Add all articles to the group
      for (const article of articles) {
        await this.prisma.article.update({
          where: { id: article.id },
          data: { groupId: group.id, similarityScore: 1.0 },
        });
        processedIds.add(article.id);
        grouped++;
      }

      this.logger.log(
        `[Exact Match] Created group ${group.id} with ${articles.length} articles: "${primaryArticle.title.substring(0, 50)}..."`,
      );
    }

    this.logger.log(`Phase 1 complete: ${grouped} articles grouped by exact title match`);

    // PHASE 2: AI-based fuzzy matching (if available and quota not exhausted)
    if (!this.isAvailable()) {
      this.logger.warn('AI not available, skipping fuzzy matching phase');
      const groupCount = await this.prisma.articleGroup.count();
      return { processed: allArticles.length, grouped, groups: groupCount };
    }

    this.logger.log('Phase 2: AI-based fuzzy matching...');

    // Get remaining ungrouped articles
    const remainingArticles = allArticles.filter(a => !processedIds.has(a.id));
    let processed = 0;
    let aiErrors = 0;
    const maxAiErrors = 5; // Stop AI phase after too many errors

    for (const article of remainingArticles) {
      if (processedIds.has(article.id)) {
        continue;
      }

      processed++;

      // Find similar articles from the remaining unprocessed ones
      const candidates = remainingArticles.filter(
        (a) =>
          a.id !== article.id &&
          !processedIds.has(a.id),
      );

      if (candidates.length === 0) {
        continue;
      }

      try {
        const similarities = await this.checkSimilarityBatch(
          {
            title: article.title,
            content: article.content,
            summary: article.summary || undefined,
            url: article.url,
          },
          candidates.map((c) => ({
            id: c.id,
            title: c.title,
            content: c.content,
            summary: c.summary,
            url: c.url,
            groupId: null,
          })),
        );

        const matches = similarities.filter(
          (s) => s.similarity >= this.config.similarityThreshold,
        );

        if (matches.length > 0) {
          // Create group and add all matching articles
          const group = await this.prisma.articleGroup.create({
            data: {
              title: article.title,
              content: article.content,
              summary: article.summary,
              imageUrl: article.imageUrl,
              publishedAt: article.publishedAt,
            },
          });

          // Add original article
          await this.prisma.article.update({
            where: { id: article.id },
            data: { groupId: group.id, similarityScore: 1.0 },
          });
          processedIds.add(article.id);
          grouped++;

          // Add matching articles
          for (const match of matches) {
            await this.prisma.article.update({
              where: { id: match.articleId },
              data: { groupId: group.id, similarityScore: match.similarity },
            });
            processedIds.add(match.articleId);
            grouped++;
          }

          this.logger.log(
            `[AI Match] Created group ${group.id} with ${matches.length + 1} articles`,
          );
        }
      } catch (error: any) {
        aiErrors++;
        if (aiErrors >= maxAiErrors) {
          this.logger.warn(`Too many AI errors (${aiErrors}), stopping fuzzy matching phase`);
          break;
        }
      }

      if (onProgress) {
        onProgress(processed, remainingArticles.length, grouped);
      }

      // Log progress every 50 articles
      if (processed % 50 === 0) {
        this.logger.log(`Progress: ${processed}/${remainingArticles.length} (${grouped} grouped)`);
      }
    }

    const groupCount = await this.prisma.articleGroup.count();

    this.logger.log(
      `Deduplication complete: ${allArticles.length} processed, ${grouped} grouped into ${groupCount} groups`,
    );

    return { processed: allArticles.length, grouped, groups: groupCount };
  }

  /**
   * Get article groups with their articles
   */
  async getGroups(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    groups: Array<ArticleGroup & { articles: Article[]; articleCount: number }>;
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [groups, total] = await Promise.all([
      this.prisma.articleGroup.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          articles: {
            include: {
              source: {
                select: { name: true, url: true },
              },
            },
          },
        },
      }),
      this.prisma.articleGroup.count(),
    ]);

    return {
      groups: groups.map((g) => ({
        ...g,
        articleCount: g.articles.length,
      })),
      total,
    };
  }

  /**
   * Get single group with all sources
   */
  async getGroupById(
    groupId: string,
  ): Promise<(ArticleGroup & { articles: Article[] }) | null> {
    return this.prisma.articleGroup.findUnique({
      where: { id: groupId },
      include: {
        articles: {
          include: {
            source: {
              select: { id: true, name: true, url: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Simple hash for cache keys
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < Math.min(content.length, 100); i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Cache similarity result
   */
  private async cacheSimilarity(
    key: string,
    result: Omit<SimilarityResult, 'articleId'>,
  ): Promise<void> {
    if (!this.cacheService.isAvailable()) return;
    try {
      // Use metadata cache method with 24h TTL
      await this.cacheService.cacheMetadata(key, result);
    } catch (error) {
      // Ignore cache errors
    }
  }

  /**
   * Get cached similarity result
   */
  private async getCachedSimilarity(
    key: string,
  ): Promise<Omit<SimilarityResult, 'articleId'> | null> {
    if (!this.cacheService.isAvailable()) return null;
    try {
      const cached = await this.cacheService.getMetadata(key);
      if (cached && 'similarity' in cached) {
        return cached as Omit<SimilarityResult, 'articleId'>;
      }
    } catch (error) {
      // Ignore cache errors
    }
    return null;
  }
}
