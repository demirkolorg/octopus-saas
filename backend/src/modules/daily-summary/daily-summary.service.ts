import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import OpenAI from 'openai';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BulletPoint,
  CategoryStat,
  SourceStat,
  DailySummaryResponse,
} from './dto/daily-summary.dto';

@Injectable()
export class DailySummaryService {
  private readonly logger = new Logger(DailySummaryService.name);
  private openai: OpenAI | null = null;
  private isEnabled = false;

  constructor(private readonly prisma: PrismaService) {
    // Initialize DeepSeek client
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      });
      this.isEnabled = true;
      this.logger.log('DailySummary AI service initialized');
    } else {
      this.logger.warn('DEEPSEEK_API_KEY not set, daily summary AI disabled');
    }
  }

  /**
   * Get Turkey timezone date helpers
   */
  private getTurkeyDate(date?: Date): Date {
    const d = date || new Date();
    // Turkey is UTC+3
    const turkeyOffset = 3 * 60;
    const utcTime = d.getTime() + d.getTimezoneOffset() * 60000;
    return new Date(utcTime + turkeyOffset * 60000);
  }

  private getTurkeyStartOfDay(date?: Date): Date {
    const turkeyDate = this.getTurkeyDate(date);
    turkeyDate.setHours(0, 0, 0, 0);
    // Convert back to UTC for database query
    const turkeyOffset = 3 * 60;
    return new Date(turkeyDate.getTime() - turkeyOffset * 60000);
  }

  private getTurkeyEndOfDay(date?: Date): Date {
    const turkeyDate = this.getTurkeyDate(date);
    turkeyDate.setHours(23, 59, 59, 999);
    // Convert back to UTC for database query
    const turkeyOffset = 3 * 60;
    return new Date(turkeyDate.getTime() - turkeyOffset * 60000);
  }

  /**
   * Get summary for a specific date
   */
  async getSummary(
    userId: string,
    date?: string,
    isPartial?: boolean,
  ): Promise<DailySummaryResponse | null> {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = this.getTurkeyStartOfDay(targetDate);

    const summary = await this.prisma.dailySummary.findFirst({
      where: {
        userId,
        date: startOfDay,
        isPartial: isPartial || false,
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    if (!summary) {
      return null;
    }

    return {
      id: summary.id,
      date: summary.date,
      summary: summary.summary,
      bulletPoints: summary.bulletPoints as BulletPoint[] | null,
      articleCount: summary.articleCount,
      topCategories: summary.topCategories as CategoryStat[] | null,
      topSources: summary.topSources as SourceStat[] | null,
      isPartial: summary.isPartial,
      generatedAt: summary.generatedAt,
      createdAt: summary.createdAt,
    };
  }

  /**
   * Get all summaries for a user (for calendar view)
   */
  async getSummaries(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<DailySummaryResponse[]> {
    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = this.getTurkeyStartOfDay(new Date(startDate));
      }
      if (endDate) {
        where.date.lte = this.getTurkeyEndOfDay(new Date(endDate));
      }
    }

    const summaries = await this.prisma.dailySummary.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 30, // Last 30 summaries
    });

    return summaries.map((s) => ({
      id: s.id,
      date: s.date,
      summary: s.summary,
      bulletPoints: s.bulletPoints as BulletPoint[] | null,
      articleCount: s.articleCount,
      topCategories: s.topCategories as CategoryStat[] | null,
      topSources: s.topSources as SourceStat[] | null,
      isPartial: s.isPartial,
      generatedAt: s.generatedAt,
      createdAt: s.createdAt,
    }));
  }

  /**
   * Generate daily summary (manual trigger or scheduled)
   */
  async generateSummary(
    userId: string,
    date?: string,
    isPartial = false,
  ): Promise<DailySummaryResponse> {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = this.getTurkeyStartOfDay(targetDate);
    const endTime = isPartial ? new Date() : this.getTurkeyEndOfDay(targetDate);

    this.logger.log(
      `Generating ${isPartial ? 'partial' : 'full'} summary for ${startOfDay.toISOString()} - ${endTime.toISOString()}`,
    );

    // Fetch articles for the day
    const articles = await this.prisma.article.findMany({
      where: {
        source: {
          OR: [{ userId }, { isSystem: true }],
        },
        createdAt: {
          gte: startOfDay,
          lte: endTime,
        },
      },
      include: {
        source: {
          select: {
            name: true,
            site: {
              select: {
                name: true,
                domain: true,
              },
            },
            category: {
              select: {
                name: true,
                icon: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200, // Limit for AI processing
    });

    if (articles.length === 0) {
      throw new NotFoundException('Bu tarih için haber bulunamadı');
    }

    // Calculate statistics
    const categoryStats = this.calculateCategoryStats(articles);
    const sourceStats = this.calculateSourceStats(articles);

    // Generate AI summary
    const aiSummary = await this.generateAISummary(
      articles,
      categoryStats,
      isPartial,
    );

    // Save to database
    const summary = await this.prisma.dailySummary.upsert({
      where: {
        userId_date_isPartial: {
          userId,
          date: startOfDay,
          isPartial,
        },
      },
      create: {
        userId,
        date: startOfDay,
        summary: aiSummary.summary,
        bulletPoints: aiSummary.bulletPoints as unknown as Prisma.InputJsonValue,
        articleCount: articles.length,
        topCategories: categoryStats as unknown as Prisma.InputJsonValue,
        topSources: sourceStats as unknown as Prisma.InputJsonValue,
        isPartial,
        generatedAt: new Date(),
      },
      update: {
        summary: aiSummary.summary,
        bulletPoints: aiSummary.bulletPoints as unknown as Prisma.InputJsonValue,
        articleCount: articles.length,
        topCategories: categoryStats as unknown as Prisma.InputJsonValue,
        topSources: sourceStats as unknown as Prisma.InputJsonValue,
        generatedAt: new Date(),
      },
    });

    this.logger.log(
      `Summary generated: ${articles.length} articles, ${categoryStats.length} categories`,
    );

    return {
      id: summary.id,
      date: summary.date,
      summary: summary.summary,
      bulletPoints: summary.bulletPoints as BulletPoint[] | null,
      articleCount: summary.articleCount,
      topCategories: summary.topCategories as CategoryStat[] | null,
      topSources: summary.topSources as SourceStat[] | null,
      isPartial: summary.isPartial,
      generatedAt: summary.generatedAt,
      createdAt: summary.createdAt,
    };
  }

  /**
   * Calculate category statistics
   */
  private calculateCategoryStats(articles: any[]): CategoryStat[] {
    const categoryMap = new Map<string, CategoryStat>();

    for (const article of articles) {
      const category = article.source?.category;
      const name = category?.name || 'Kategorisiz';

      if (categoryMap.has(name)) {
        categoryMap.get(name)!.count++;
      } else {
        categoryMap.set(name, {
          name,
          count: 1,
          icon: category?.icon,
          color: category?.color,
        });
      }
    }

    return Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Calculate source statistics
   */
  private calculateSourceStats(articles: any[]): SourceStat[] {
    const sourceMap = new Map<string, SourceStat>();

    for (const article of articles) {
      const site = article.source?.site;
      const name = site?.name || article.source?.name || 'Bilinmeyen';
      const domain = site?.domain;

      if (sourceMap.has(name)) {
        sourceMap.get(name)!.count++;
      } else {
        sourceMap.set(name, {
          name,
          count: 1,
          domain,
        });
      }
    }

    return Array.from(sourceMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Generate AI summary using DeepSeek
   */
  private async generateAISummary(
    articles: any[],
    categoryStats: CategoryStat[],
    isPartial: boolean,
  ): Promise<{ summary: string; bulletPoints: BulletPoint[] }> {
    if (!this.isEnabled || !this.openai) {
      return this.generateFallbackSummary(articles, categoryStats, isPartial);
    }

    try {
      // Prepare article summaries for AI
      const articleSummaries = articles.slice(0, 50).map((a) => ({
        title: a.title,
        category: a.source?.category?.name || 'Genel',
        source: a.source?.site?.name || a.source?.name,
        summary: a.summary?.substring(0, 200) || a.content?.substring(0, 200),
      }));

      const timeRange = isPartial
        ? 'bugün şu ana kadar'
        : 'bugün boyunca (tüm gün)';

      const prompt = `Aşağıdaki ${articles.length} haberi analiz et ve Türkçe günlük özet oluştur.

Zaman Aralığı: ${timeRange}

Kategori Dağılımı:
${categoryStats.map((c) => `- ${c.name}: ${c.count} haber`).join('\n')}

Haberler:
${JSON.stringify(articleSummaries, null, 2)}

Aşağıdaki formatta JSON döndür:
{
  "summary": "Günün genel özeti (3-4 paragraf, akıcı Türkçe)",
  "bulletPoints": [
    { "category": "Ekonomi", "text": "Önemli ekonomi haberi özeti" },
    { "category": "Gündem", "text": "Önemli gündem haberi özeti" }
  ]
}

Kurallar:
- Özet profesyonel ve tarafsız olmalı
- Her kategoriden en önemli 1-2 haber seç
- Bullet point'ler kısa ve öz olmalı (max 100 karakter)
- En fazla 8 bullet point olsun
- Tekrar eden haberler için tek özet yaz`;

      const response = await this.openai.chat.completions.create({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              'Sen profesyonel bir haber editörüsün. Günlük haber özetleri hazırlarsın. Her zaman JSON formatında Türkçe yanıt ver.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return this.generateFallbackSummary(articles, categoryStats, isPartial);
      }

      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary || 'Özet oluşturulamadı.',
        bulletPoints: parsed.bulletPoints || [],
      };
    } catch (error) {
      this.logger.error('AI summary generation failed:', error);
      return this.generateFallbackSummary(articles, categoryStats, isPartial);
    }
  }

  /**
   * Fallback summary when AI is not available
   */
  private generateFallbackSummary(
    articles: any[],
    categoryStats: CategoryStat[],
    isPartial: boolean,
  ): { summary: string; bulletPoints: BulletPoint[] } {
    const timeDesc = isPartial ? 'şu ana kadar' : 'boyunca';
    const topCategories = categoryStats.slice(0, 3).map((c) => c.name);

    const summary = `Bugün ${timeDesc} toplam ${articles.length} haber takip edildi. En çok haber ${topCategories.join(', ')} kategorilerinden geldi. ${categoryStats[0]?.name || 'Çeşitli'} kategorisinde ${categoryStats[0]?.count || 0} haber yer aldı.`;

    const bulletPoints: BulletPoint[] = articles.slice(0, 5).map((a) => ({
      category: a.source?.category?.name || 'Genel',
      text: a.title.substring(0, 100),
    }));

    return { summary, bulletPoints };
  }

  /**
   * Scheduled job: Generate daily summaries at end of day (23:55 Turkey time)
   */
  @Cron('55 23 * * *', {
    timeZone: 'Europe/Istanbul',
  })
  async scheduledDailySummary() {
    this.logger.log('Starting scheduled daily summary generation...');

    try {
      // Get all users with active sources
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { sources: { some: { status: 'ACTIVE' } } },
            { settings: { emailDigestEnabled: true } },
          ],
        },
        select: { id: true, email: true },
      });

      this.logger.log(`Generating summaries for ${users.length} users`);

      for (const user of users) {
        try {
          await this.generateSummary(user.id, undefined, false);
          this.logger.log(`Summary generated for user ${user.email}`);
        } catch (error) {
          this.logger.error(
            `Failed to generate summary for user ${user.email}:`,
            error,
          );
        }
      }

      this.logger.log('Daily summary generation completed');
    } catch (error) {
      this.logger.error('Scheduled summary generation failed:', error);
    }
  }
}
