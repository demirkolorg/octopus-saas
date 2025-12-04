import { api } from './client';

export interface CrawlActivitySource {
  id: string;
  name: string;
  url: string;
  sourceType: 'SELECTOR' | 'RSS';
  isSystem?: boolean;
  site?: {
    name: string;
  };
}

export interface CrawlActivity {
  id: string;
  sourceId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  finishedAt: string | null;
  itemsFound: number;
  itemsInserted: number;
  errorMessage: string | null;
  duration?: number;
  duplicateCount?: number;
  createdAt: string;
  source: CrawlActivitySource;
}

export interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export const crawlerApi = {
  getActivity: async (limit = 50): Promise<CrawlActivity[]> => {
    return api.get<CrawlActivity[]>(`/crawler/activity?limit=${limit}`);
  },

  getQueueStatus: async (): Promise<QueueStatus> => {
    return api.get<QueueStatus>('/crawler/status');
  },

  triggerCrawl: async (sourceId: string): Promise<{ jobId: string; sourceId: string; status: string }> => {
    return api.post(`/crawler/sources/${sourceId}/crawl`);
  },

  triggerCrawlAll: async (): Promise<{ totalSources: number; jobsAdded: number }> => {
    return api.post('/crawler/crawl-all');
  },
};
