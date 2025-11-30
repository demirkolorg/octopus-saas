import { api } from './client';

export interface Source {
  id: string;
  userId: string;
  name: string;
  url: string;
  selectors: {
    listItem: string;
    title: string;
    link: string;
    date?: string;
    summary?: string;
  };
  crawlInterval: number;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  lastCrawlAt: string | null;
  nextCrawlAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export const sourcesApi = {
  getAll: async (): Promise<Source[]> => {
    return api.get<Source[]>('/sources');
  },

  getOne: async (id: string): Promise<Source> => {
    return api.get<Source>(`/sources/${id}`);
  },

  create: async (data: {
    name: string;
    url: string;
    selectors: Source['selectors'];
    crawlInterval?: number;
  }): Promise<Source> => {
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
};
