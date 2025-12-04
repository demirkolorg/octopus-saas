import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import OpenAI from 'openai';
import { PrismaService } from '../../prisma/prisma.service';
import { WatchKeywordsService } from './watch-keywords.service';

interface RelevanceResult {
  isRelevant: boolean;
  confidence: number;
  reason: string;
}

interface BatchAnalysisResult {
  articleId: string;
  matches: Array<{
    keywordId: string;
    confidence: number;
    reason: string;
  }>;
}

@Injectable()
export class WatchAnalyzerService {
  private readonly logger = new Logger(WatchAnalyzerService.name);
  private client: OpenAI | null = null;
  private modelName: string = 'llama-3.3-70b';
  private isEnabled = false;

  // Minimum confidence threshold for a match
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly watchKeywordsService: WatchKeywordsService,
  ) {
    // Use Cerebras API for fast inference
    const cerebrasKey = process.env.CEREBRAS_API_KEY;
    if (cerebrasKey) {
      this.client = new OpenAI({
        baseURL: 'https://api.cerebras.ai/v1',
        apiKey: cerebrasKey,
      });
      this.modelName = process.env.CEREBRAS_MODEL || 'llama-3.3-70b';
      this.isEnabled = true;
      this.logger.log(`WatchAnalyzerService initialized with Cerebras AI (${this.modelName})`);
    } else {
      this.logger.warn('CEREBRAS_API_KEY not set, watch analysis disabled');
    }
  }

  /**
   * Check if watch analysis is available
   */
  isAvailable(): boolean {
    return this.isEnabled && this.client !== null;
  }

  /**
   * Analyze a single article against a single keyword
   */
  async checkRelevance(
    article: { title: string; content: string; summary?: string | null },
    keyword: { keyword: string; description?: string | null },
  ): Promise<RelevanceResult> {
    if (!this.isAvailable()) {
      return { isRelevant: false, confidence: 0, reason: 'AI not available' };
    }

    try {
      // Truncate content for token efficiency
      const contentPreview = article.content?.substring(0, 500) || '';
      const summaryText = article.summary || '';

      const prompt = `Aşağıdaki haberin "${keyword.keyword}" ile gerçekten ilgili olup olmadığını analiz et.

Takip Kelimesi: ${keyword.keyword}
${keyword.description ? `Açıklama: ${keyword.description}` : ''}

Haber Başlığı: ${article.title}
${summaryText ? `Haber Özeti: ${summaryText}` : ''}
İçerik (ilk 500 karakter): ${contentPreview}

ÇOK ÖNEMLİ KURALLAR:
1. Sadece kelimenin BAĞLAMSAL olarak geçip geçmediğine bak
2. Alt dizi eşleşmelerini KESINLIKLE REDDET:
   - "Van" kelimesi aranıyorsa: "hayvan", "divan", "dava" gibi kelimelerdeki "van" = HAYIR
   - "Van" kelimesi aranıyorsa: "Van ili", "Van'da", "Van Valisi" = EVET
3. Kelime ayrı bir kavram olarak veya coğrafi/özel isim olarak geçmeli
4. Sadece başlık veya içerikte gerçekten o konuyla ilgili olduğunda EVET de
5. Eş anlamlılar ve doğrudan ilişkili kavramlar da sayılır

JSON formatında yanıt ver:
{
  "isRelevant": true veya false,
  "confidence": 0.0-1.0 arası güven skoru,
  "reason": "Kısa açıklama (maksimum 50 karakter)"
}`;

      const response = await this.client!.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: 'Sen bir haber analiz uzmanısın. Haberlerin belirli anahtar kelimelerle ilgili olup olmadığını semantik olarak analiz edersin. Her zaman JSON formatında yanıt ver.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Low temperature for consistent results
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { isRelevant: false, confidence: 0, reason: 'Empty AI response' };
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn(`Invalid JSON response: ${content}`);
        return { isRelevant: false, confidence: 0, reason: 'Invalid response format' };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        isRelevant: parsed.isRelevant === true,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        reason: parsed.reason || '',
      };
    } catch (error) {
      this.logger.error('Watch analysis failed:', error);
      return { isRelevant: false, confidence: 0, reason: 'Analysis error' };
    }
  }

  /**
   * Analyze a single article against all active keywords
   * For system sources, analyze against ALL users' keywords
   * For user sources, analyze only against that user's keywords
   */
  async analyzeArticle(articleId: string): Promise<void> {
    if (!this.isAvailable()) return;

    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: {
        source: {
          select: { userId: true, isSystem: true },
        },
      },
    });

    if (!article) return;

    let keywords: Array<{ id: string; keyword: string; description: string | null; userId: string }> = [];

    if (article.source.isSystem) {
      // For system sources, get ALL active keywords from ALL users
      keywords = await this.prisma.watchKeyword.findMany({
        where: { isActive: true },
        select: { id: true, keyword: true, description: true, userId: true },
      });
    } else if (article.source.userId) {
      // For user sources, get only that user's keywords
      keywords = await this.watchKeywordsService.getActiveKeywords(article.source.userId);
    }

    if (keywords.length === 0) {
      // Mark as analyzed even if no keywords
      await this.prisma.article.update({
        where: { id: articleId },
        data: { isWatchAnalyzed: true, watchAnalyzedAt: new Date() },
      });
      return;
    }

    // Analyze against each keyword
    for (const keyword of keywords) {
      const result = await this.checkRelevance(
        { title: article.title, content: article.content, summary: article.summary },
        { keyword: keyword.keyword, description: keyword.description },
      );

      if (result.isRelevant && result.confidence >= this.CONFIDENCE_THRESHOLD) {
        // Create match record
        await this.prisma.articleWatchMatch.upsert({
          where: {
            articleId_watchKeywordId: {
              articleId: article.id,
              watchKeywordId: keyword.id,
            },
          },
          update: {
            confidence: result.confidence,
            reason: result.reason,
          },
          create: {
            articleId: article.id,
            watchKeywordId: keyword.id,
            confidence: result.confidence,
            reason: result.reason,
          },
        });

        this.logger.log(
          `Match found: Article "${article.title.substring(0, 50)}..." matches keyword "${keyword.keyword}" (confidence: ${result.confidence})`,
        );
      }
    }

    // Mark article as analyzed
    await this.prisma.article.update({
      where: { id: articleId },
      data: {
        isWatchAnalyzed: true,
        watchAnalyzedAt: new Date(),
      },
    });
  }

  /**
   * Batch analyze unanalyzed articles (called by cron job)
   */
  async analyzeUnanalyzedArticles(limit: number = 50): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    // Get unanalyzed articles from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const articles = await this.prisma.article.findMany({
      where: {
        isWatchAnalyzed: false,
        createdAt: { gte: oneHourAgo },
      },
      include: {
        source: {
          select: { userId: true, isSystem: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    this.logger.log(`Found ${articles.length} unanalyzed articles`);

    let analyzedCount = 0;

    for (const article of articles) {
      let keywords: Array<{ id: string; keyword: string; description: string | null; userId: string }> = [];

      if (article.source.isSystem) {
        // For system sources, get ALL active keywords from ALL users
        keywords = await this.prisma.watchKeyword.findMany({
          where: { isActive: true },
          select: { id: true, keyword: true, description: true, userId: true },
        });
      } else if (article.source.userId) {
        // For user sources, get only that user's keywords
        keywords = await this.watchKeywordsService.getActiveKeywords(article.source.userId);
      }

      if (keywords.length === 0) {
        // Mark as analyzed even if no keywords (no need to check again)
        await this.prisma.article.update({
          where: { id: article.id },
          data: {
            isWatchAnalyzed: true,
            watchAnalyzedAt: new Date(),
          },
        });
        continue;
      }

      // Analyze against each keyword
      for (const keyword of keywords) {
        const result = await this.checkRelevance(
          { title: article.title, content: article.content, summary: article.summary },
          { keyword: keyword.keyword, description: keyword.description },
        );

        if (result.isRelevant && result.confidence >= this.CONFIDENCE_THRESHOLD) {
          await this.prisma.articleWatchMatch.upsert({
            where: {
              articleId_watchKeywordId: {
                articleId: article.id,
                watchKeywordId: keyword.id,
              },
            },
            update: {
              confidence: result.confidence,
              reason: result.reason,
            },
            create: {
              articleId: article.id,
              watchKeywordId: keyword.id,
              confidence: result.confidence,
              reason: result.reason,
            },
          });
        }
      }

      // Mark as analyzed
      await this.prisma.article.update({
        where: { id: article.id },
        data: {
          isWatchAnalyzed: true,
          watchAnalyzedAt: new Date(),
        },
      });

      analyzedCount++;
    }

    if (analyzedCount > 0) {
      this.logger.log(`Analyzed ${analyzedCount} articles for watch keywords`);
    }

    return analyzedCount;
  }

  /**
   * Queue articles for analysis (called after crawler saves articles)
   */
  async queueForAnalysis(articleIds: string[]): Promise<void> {
    if (!this.isAvailable() || articleIds.length === 0) return;

    this.logger.log(`Queued ${articleIds.length} articles for watch analysis`);

    // Analyze immediately for real-time experience
    for (const articleId of articleIds) {
      try {
        await this.analyzeArticle(articleId);
      } catch (error) {
        this.logger.error(`Failed to analyze article ${articleId}:`, error);
      }
    }
  }

  /**
   * Cron job: Process unanalyzed articles every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.analyzeUnanalyzedArticles(50);
    } catch (error) {
      this.logger.error('Watch analysis cron job failed:', error);
    }
  }

  /**
   * Re-analyze all articles for a specific keyword (when keyword is added/updated)
   */
  async reanalyzeForKeyword(keywordId: string, limit: number = 100): Promise<number> {
    if (!this.isAvailable()) return 0;

    const keyword = await this.prisma.watchKeyword.findUnique({
      where: { id: keywordId },
    });

    if (!keyword || !keyword.isActive) return 0;

    // Get recent articles for this user
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const articles = await this.prisma.article.findMany({
      where: {
        source: { userId: keyword.userId },
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    let matchCount = 0;

    for (const article of articles) {
      const result = await this.checkRelevance(
        { title: article.title, content: article.content, summary: article.summary },
        { keyword: keyword.keyword, description: keyword.description },
      );

      if (result.isRelevant && result.confidence >= this.CONFIDENCE_THRESHOLD) {
        await this.prisma.articleWatchMatch.upsert({
          where: {
            articleId_watchKeywordId: {
              articleId: article.id,
              watchKeywordId: keyword.id,
            },
          },
          update: {
            confidence: result.confidence,
            reason: result.reason,
          },
          create: {
            articleId: article.id,
            watchKeywordId: keyword.id,
            confidence: result.confidence,
            reason: result.reason,
          },
        });
        matchCount++;
      }
    }

    this.logger.log(`Re-analyzed ${articles.length} articles for keyword "${keyword.keyword}", found ${matchCount} matches`);

    return matchCount;
  }
}
