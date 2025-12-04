export type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';

export class SourceHealthDto {
  sourceId: string;
  sourceName: string;

  // Sağlık durumu
  healthStatus: HealthStatus;
  successRate: number;  // Başarı oranı (%)

  // Tarama istatistikleri
  totalCrawls: number;
  successfulCrawls: number;
  failedCrawls: number;
  consecutiveFailures: number;

  // Hata bilgileri
  lastErrorMessage?: string;
  lastErrorAt?: Date;

  // Makale istatistikleri
  totalArticlesFound: number;
  totalArticlesInserted: number;

  // Performans metrikleri
  avgCrawlDuration?: number;  // ms
  lastCrawlDuration?: number; // ms
  lastCrawlAt?: Date;
}

export class SourceHealthSummaryDto {
  totalSources: number;
  healthySources: number;
  warningSources: number;
  criticalSources: number;

  // Toplam istatistikler
  totalCrawls: number;
  totalSuccessfulCrawls: number;
  totalFailedCrawls: number;
  overallSuccessRate: number;

  // Son 24 saat
  crawlsLast24h: number;
  articlesLast24h: number;
}

// Sağlık durumu hesaplama fonksiyonu
export function calculateHealthStatus(
  totalCrawlCount: number,
  successfulCrawlCount: number,
  consecutiveFailures: number,
): HealthStatus {
  const successRate = totalCrawlCount > 0
    ? (successfulCrawlCount / totalCrawlCount) * 100
    : 100;

  if (consecutiveFailures >= 5 || successRate < 50) {
    return 'CRITICAL';
  }
  if (consecutiveFailures >= 2 || successRate < 80) {
    return 'WARNING';
  }
  return 'HEALTHY';
}

// Başarı oranı hesaplama
export function calculateSuccessRate(
  totalCrawlCount: number,
  successfulCrawlCount: number,
): number {
  if (totalCrawlCount === 0) return 100;
  return Math.round((successfulCrawlCount / totalCrawlCount) * 100);
}
