import { api } from './client';
import { Site } from './sites';
import { Category } from './categories';

export type SourceType = 'SELECTOR' | 'RSS';

export interface Source {
  id: string;
  userId: string;
  name: string;
  url: string;
  sourceType: SourceType;
  selectors?: {
    listItem: string;
    title: string;
    link?: string;
    date?: string;
    summary?: string;
    content?: string;
    image?: string;
  };
  feedUrl?: string;
  refreshInterval: number;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  lastCrawlAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Site and Category relations
  siteId?: string;
  categoryId?: string;
  site?: Site;
  category?: Category;
  _count?: {
    articles: number;
  };
  // Health metrics
  consecutiveFailures?: number;
  lastErrorMessage?: string | null;
  lastErrorAt?: string | null;
  totalCrawlCount?: number;
  successfulCrawlCount?: number;
  failedCrawlCount?: number;
  totalArticlesFound?: number;
  totalArticlesInserted?: number;
  avgCrawlDuration?: number | null;
  lastCrawlDuration?: number | null;
}

export type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';

export interface SourceHealth {
  sourceId: string;
  sourceName: string;
  healthStatus: HealthStatus;
  successRate: number;
  totalCrawls: number;
  successfulCrawls: number;
  failedCrawls: number;
  consecutiveFailures: number;
  lastErrorMessage?: string;
  lastErrorAt?: string;
  totalArticlesFound: number;
  totalArticlesInserted: number;
  avgCrawlDuration?: number;
  lastCrawlDuration?: number;
  lastCrawlAt?: string;
}

export interface SourceHealthSummary {
  totalSources: number;
  healthySources: number;
  warningSources: number;
  criticalSources: number;
  totalCrawls: number;
  totalSuccessfulCrawls: number;
  totalFailedCrawls: number;
  overallSuccessRate: number;
  crawlsLast24h: number;
  articlesLast24h: number;
}

export interface CrawlJob {
  id: string;
  sourceId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  finishedAt: string | null;
  itemsFound: number;
  itemsInserted: number;
  errorMessage: string | null;
  createdAt: string;
}

export interface CreateSourceInput {
  name: string;
  url: string;
  selectors: Source['selectors'];
  refreshInterval?: number;
  siteId?: string;
  categoryId?: string;
}

export interface SourceFilters {
  siteId?: string;
  categoryId?: string;
}

export const sourcesApi = {
  getAll: async (filters?: SourceFilters): Promise<Source[]> => {
    const params = new URLSearchParams();
    if (filters?.siteId) params.append('siteId', filters.siteId);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    const query = params.toString();
    return api.get<Source[]>(`/sources${query ? `?${query}` : ''}`);
  },

  getOne: async (id: string): Promise<Source> => {
    return api.get<Source>(`/sources/${id}`);
  },

  create: async (data: CreateSourceInput): Promise<Source> => {
    return api.post<Source>('/sources', data);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/sources/${id}`);
  },

  pause: async (id: string): Promise<Source> => {
    return api.patch<Source>(`/sources/${id}/pause`);
  },

  activate: async (id: string): Promise<Source> => {
    return api.patch<Source>(`/sources/${id}/activate`);
  },

  crawl: async (id: string): Promise<{ jobId: string; sourceId: string; status: string }> => {
    return api.post(`/sources/${id}/crawl`);
  },

  getJobs: async (id: string): Promise<CrawlJob[]> => {
    return api.get<CrawlJob[]>(`/sources/${id}/jobs`);
  },

  // Health monitoring
  getHealth: async (id: string): Promise<SourceHealth> => {
    return api.get<SourceHealth>(`/sources/${id}/health`);
  },

  getHealthSummary: async (): Promise<SourceHealthSummary> => {
    return api.get<SourceHealthSummary>('/sources/health/summary');
  },

  resetHealth: async (id: string): Promise<Source> => {
    return api.post<Source>(`/sources/${id}/health/reset`);
  },
};
