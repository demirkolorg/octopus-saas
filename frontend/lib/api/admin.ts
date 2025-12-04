import { api } from './client';

// Types
export interface AdminUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  _count: {
    sources: number;
    sites: number;
    categories: number;
  };
}

export interface SystemStatus {
  users: {
    total: number;
  };
  sources: {
    total: number;
    system: number;
    active: number;
  };
  articles: {
    total: number;
    today: number;
  };
  sites: {
    total: number;
  };
  categories: {
    total: number;
  };
  crawlJobs: {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    recent: CrawlJob[];
  };
}

export interface CrawlJob {
  id: string;
  sourceId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  itemsFound: number;
  itemsInserted: number;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
  source: {
    id: string;
    name: string;
  };
}

export interface SystemSource {
  id: string;
  name: string;
  url: string;
  sourceType: 'SELECTOR' | 'RSS';
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  lastCrawlAt: string | null;
  createdAt: string;
  site: {
    id: string;
    name: string;
    domain: string;
  } | null;
  category: {
    id: string;
    name: string;
  } | null;
  _count: {
    articles: number;
  };
}

// Admin API functions
export const adminApi = {
  // Users
  getUsers: async (): Promise<AdminUser[]> => {
    return api.get<AdminUser[]>('/admin/users');
  },

  getUser: async (id: string): Promise<AdminUser> => {
    return api.get<AdminUser>(`/admin/users/${id}`);
  },

  updateUserRole: async (id: string, role: 'USER' | 'ADMIN'): Promise<AdminUser> => {
    return api.patch<AdminUser>(`/admin/users/${id}/role`, { role });
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    return api.delete<{ message: string }>(`/admin/users/${id}`);
  },

  // System
  getSystemStatus: async (): Promise<SystemStatus> => {
    return api.get<SystemStatus>('/admin/system/status');
  },

  getSystemSources: async (): Promise<SystemSource[]> => {
    return api.get<SystemSource[]>('/admin/system/sources');
  },
};
