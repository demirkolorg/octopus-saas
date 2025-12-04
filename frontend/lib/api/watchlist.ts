import { api } from './client';

// Types
export interface WatchKeyword {
  id: string;
  keyword: string;
  description?: string;
  color: string;
  isActive: boolean;
  matchCount?: number;
  lastMatchAt?: string;
  groupId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WatchGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  keywords: WatchKeyword[];
  matchCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWatchKeywordDto {
  keyword: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  groupId?: string;
}

export interface UpdateWatchKeywordDto {
  keyword?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export interface GroupKeywordDto {
  keyword: string;
  description?: string;
}

export interface BulkCreateKeywordsDto {
  keywords: GroupKeywordDto[];
}

export interface BulkCreateResult {
  added: string[];
  skipped: string[];
}

export interface CreateWatchGroupDto {
  name: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  keywords?: GroupKeywordDto[];
}

export interface UpdateWatchGroupDto {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export interface ArticleWatchMatch {
  id: string;
  confidence: number;
  reason?: string;
  createdAt: string;
  watchKeyword: WatchKeyword;
}

export interface MatchedArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  url: string;
  imageUrl?: string;
  isRead: boolean;
  publishedAt?: string;
  createdAt: string;
  source: {
    id: string;
    name: string;
    site?: {
      name: string;
      domain: string;
      logoUrl?: string;
    };
    category?: {
      name: string;
      icon?: string;
      color?: string;
    };
  };
  watchMatches: ArticleWatchMatch[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API functions
export const watchlistApi = {
  // Get all keywords for the current user
  getAll: async (): Promise<WatchKeyword[]> => {
    return api.get<WatchKeyword[]>('/watch-keywords');
  },

  // Get a single keyword
  getOne: async (id: string): Promise<WatchKeyword> => {
    return api.get<WatchKeyword>(`/watch-keywords/${id}`);
  },

  // Create a new keyword
  create: async (data: CreateWatchKeywordDto): Promise<WatchKeyword> => {
    return api.post<WatchKeyword>('/watch-keywords', data);
  },

  // Update a keyword
  update: async (id: string, data: UpdateWatchKeywordDto): Promise<WatchKeyword> => {
    return api.patch<WatchKeyword>(`/watch-keywords/${id}`, data);
  },

  // Delete a keyword
  delete: async (id: string): Promise<void> => {
    await api.delete(`/watch-keywords/${id}`);
  },

  // Get matches for a specific keyword
  getKeywordMatches: async (
    id: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<MatchedArticle>> => {
    return api.get<PaginatedResponse<MatchedArticle>>(
      `/watch-keywords/${id}/matches?page=${page}&limit=${limit}`
    );
  },

  // Get all matches across all keywords
  getAllMatches: async (
    page: number = 1,
    limit: number = 20,
    keywordId?: string
  ): Promise<PaginatedResponse<MatchedArticle>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (keywordId) params.set('keywordId', keywordId);
    return api.get<PaginatedResponse<MatchedArticle>>(`/watch-keywords/matches?${params}`);
  },

  // Trigger re-analysis for a keyword
  reanalyze: async (id: string): Promise<{ success: boolean; matchCount: number }> => {
    return api.post<{ success: boolean; matchCount: number }>(`/watch-keywords/${id}/reanalyze`);
  },
};

// Watch Groups API
export const watchGroupApi = {
  // Get all groups for the current user
  getAll: async (): Promise<WatchGroup[]> => {
    return api.get<WatchGroup[]>('/watch-groups');
  },

  // Get a single group
  getOne: async (id: string): Promise<WatchGroup> => {
    return api.get<WatchGroup>(`/watch-groups/${id}`);
  },

  // Create a new group
  create: async (data: CreateWatchGroupDto): Promise<WatchGroup> => {
    return api.post<WatchGroup>('/watch-groups', data);
  },

  // Update a group
  update: async (id: string, data: UpdateWatchGroupDto): Promise<WatchGroup> => {
    return api.patch<WatchGroup>(`/watch-groups/${id}`, data);
  },

  // Delete a group
  delete: async (id: string): Promise<void> => {
    await api.delete(`/watch-groups/${id}`);
  },

  // Add keyword to group
  addKeyword: async (groupId: string, data: CreateWatchKeywordDto): Promise<WatchKeyword> => {
    return api.post<WatchKeyword>(`/watch-groups/${groupId}/keywords`, data);
  },

  // Remove keyword from group
  removeKeyword: async (groupId: string, keywordId: string): Promise<void> => {
    await api.delete(`/watch-groups/${groupId}/keywords/${keywordId}`);
  },

  // Add bulk keywords to group
  addBulkKeywords: async (groupId: string, data: BulkCreateKeywordsDto): Promise<BulkCreateResult> => {
    return api.post<BulkCreateResult>(`/watch-groups/${groupId}/keywords/bulk`, data);
  },
};
