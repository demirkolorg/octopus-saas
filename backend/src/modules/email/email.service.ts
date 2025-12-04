import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface ArticleSummary {
  id: string;
  title: string;
  summary?: string;
  url: string;
  sourceName: string;
  siteName?: string;
  imageUrl?: string;
  publishedAt?: Date;
}

interface DigestData {
  userName: string;
  date: string;
  totalArticles: number;
  articles: ArticleSummary[];
  topSources: { name: string; count: number }[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private readonly fromEmail = 'Octopus <noreply@octopus.app>';

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email service initialized');
    } else {
      this.logger.warn('RESEND_API_KEY not set, email service disabled');
    }
  }

  /**
   * Send daily digest email to a user
   */
  async sendDailyDigest(userId: string): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn('Email service not available');
      return false;
    }

    try {
      // Get user with settings
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { settings: true },
      });

      if (!user || !user.settings?.emailDigestEnabled) {
        return false;
      }

      // Get articles from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const articles = await this.prisma.article.findMany({
        where: {
          source: {
            OR: [
              { userId },
              { isSystem: true },
            ],
          },
          createdAt: { gte: yesterday },
        },
        include: {
          source: {
            include: {
              site: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20, // Top 20 articles
      });

      if (articles.length === 0) {
        this.logger.log(`No articles for user ${userId}, skipping digest`);
        return false;
      }

      // Calculate top sources
      const sourceCounts = new Map<string, number>();
      articles.forEach(article => {
        const name = article.source.site?.name || article.source.name;
        sourceCounts.set(name, (sourceCounts.get(name) || 0) + 1);
      });
      const topSources = Array.from(sourceCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const digestData: DigestData = {
        userName: user.email.split('@')[0],
        date: new Date().toLocaleDateString('tr-TR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        totalArticles: articles.length,
        articles: articles.map(a => ({
          id: a.id,
          title: a.title,
          summary: a.summary || undefined,
          url: a.url,
          sourceName: a.source.name,
          siteName: a.source.site?.name,
          imageUrl: a.imageUrl || undefined,
          publishedAt: a.publishedAt || undefined,
        })),
        topSources,
      };

      const html = this.generateDigestHtml(digestData);

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: user.email,
        subject: `Günlük Haber Özeti - ${digestData.date}`,
        html,
      });

      // Update last digest sent time
      await this.prisma.userSettings.update({
        where: { userId },
        data: { lastDigestSentAt: new Date() },
      });

      this.logger.log(`Daily digest sent to ${user.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send digest to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Send error notification email
   */
  async sendErrorNotification(
    userId: string,
    sourceName: string,
    errorMessage: string,
  ): Promise<boolean> {
    if (!this.resend) return false;

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { settings: true },
      });

      if (!user || !user.settings?.notifyOnErrors) {
        return false;
      }

      const html = this.generateErrorHtml(sourceName, errorMessage);

      await this.resend.emails.send({
        from: this.fromEmail,
        to: user.email,
        subject: `Kaynak Hatası: ${sourceName}`,
        html,
      });

      this.logger.log(`Error notification sent to ${user.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send error notification:`, error);
      return false;
    }
  }

  /**
   * Scheduled job: Send daily digests
   * Runs every hour and checks which users should receive their digest
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendScheduledDigests() {
    if (!this.resend) return;

    this.logger.log('Starting scheduled digest check...');

    try {
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');

      // Find users who should receive digest at this hour
      const usersToNotify = await this.prisma.userSettings.findMany({
        where: {
          emailDigestEnabled: true,
          emailDigestTime: { startsWith: currentHour },
          OR: [
            { lastDigestSentAt: null },
            {
              lastDigestSentAt: {
                lt: new Date(now.getTime() - 23 * 60 * 60 * 1000), // 23 hours ago
              },
            },
          ],
        },
      });

      this.logger.log(`Found ${usersToNotify.length} users for digest`);

      for (const settings of usersToNotify) {
        await this.sendDailyDigest(settings.userId);
      }
    } catch (error) {
      this.logger.error('Scheduled digest failed:', error);
    }
  }

  /**
   * Generate HTML for daily digest email
   */
  private generateDigestHtml(data: DigestData): string {
    const articleRows = data.articles
      .slice(0, 10)
      .map(
        article => `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
            <a href="${article.url}" style="color: #1f2937; text-decoration: none;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${article.title}</h3>
            </a>
            ${article.summary ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${article.summary.substring(0, 150)}...</p>` : ''}
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              ${article.siteName || article.sourceName}
              ${article.publishedAt ? ` • ${new Date(article.publishedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </p>
          </td>
        </tr>
      `,
      )
      .join('');

    const sourceList = data.topSources
      .map(s => `<span style="display: inline-block; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; margin: 2px; font-size: 12px;">${s.name} (${s.count})</span>`)
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Günlük Haber Özeti</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${data.date}</p>
          </div>

          <!-- Content -->
          <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p style="margin: 0 0 16px 0; color: #374151;">Merhaba ${data.userName},</p>
            <p style="margin: 0 0 24px 0; color: #6b7280;">Son 24 saatte <strong>${data.totalArticles} yeni haber</strong> bulundu. İşte öne çıkan haberler:</p>

            <!-- Top Sources -->
            <div style="margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">En Aktif Kaynaklar</p>
              <div>${sourceList}</div>
            </div>

            <!-- Articles -->
            <table style="width: 100%; border-collapse: collapse;">
              ${articleRows}
            </table>

            ${data.totalArticles > 10 ? `<p style="text-align: center; margin: 24px 0 0 0;"><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Tüm Haberleri Gör (${data.totalArticles - 10} daha)</a></p>` : ''}
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0 0 8px 0;">Bu e-posta Octopus tarafından gönderilmiştir.</p>
            <p style="margin: 0;"><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings" style="color: #6366f1;">Bildirim ayarlarını değiştir</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for error notification email
   */
  private generateErrorHtml(sourceName: string, errorMessage: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 48px; height: 48px; background: #fef2f2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <span style="color: #ef4444; font-size: 24px;">⚠</span>
              </div>
            </div>

            <h2 style="margin: 0 0 16px 0; color: #1f2937; text-align: center;">Kaynak Hatası</h2>

            <p style="margin: 0 0 16px 0; color: #6b7280;">
              <strong>${sourceName}</strong> kaynağında bir hata oluştu:
            </p>

            <div style="background: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444;">
              <p style="margin: 0; color: #991b1b; font-family: monospace; font-size: 14px;">${errorMessage}</p>
            </div>

            <p style="margin: 24px 0 0 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/sources" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Kaynağı Kontrol Et</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
