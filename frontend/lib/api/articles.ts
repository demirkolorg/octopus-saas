import { api } from './client';

export interface ArticleSource {
  id: string;
  name: string;
  url?: string;
  articleUrl?: string; // URL of the article from this source
  site?: {
    id: string;
    name: string;
    domain: string;
    logoUrl?: string;
  };
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
}

export interface ArticleWatchMatchBadge {
  id: string;
  watchKeyword: {
    id: string;
    keyword: string;
    color: string;
  };
}

export interface Article {
  id: string;
  sourceId: string;
  title: string;
  url: string;
  content: string;
  imageUrl: string | null;
  publishedAt: string;
  isRead: boolean;
  hash: string;
  createdAt: string;
  updatedAt: string;
  source: ArticleSource;
  // Deduplication fields
  groupId: string | null;
  group: {
    id: string;
    title: string;
  } | null;
  sourceCount: number; // Number of sources reporting this news
  relatedSources: ArticleSource[]; // All sources in the group
  // Watch matches
  watchMatches?: ArticleWatchMatchBadge[];
}

export interface ArticleQueryParams {
  page?: number;
  limit?: number;
  sourceId?: string;
  isRead?: boolean;
  search?: string;
  watchOnly?: boolean;
  todayOnly?: boolean;
}

export interface PaginatedArticles {
  data: Article[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export interface ArticleStats {
  total: number;
  unread: number;
  todayCount: number;
  watchCount: number;
}

export const articlesApi = {
  getAll: async (params?: ArticleQueryParams): Promise<PaginatedArticles> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.sourceId) searchParams.set('sourceId', params.sourceId);
    if (params?.isRead !== undefined) searchParams.set('isRead', params.isRead.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.watchOnly) searchParams.set('watchOnly', 'true');
    if (params?.todayOnly) searchParams.set('todayOnly', 'true');

    const query = searchParams.toString();
    const url = query ? `/articles?${query}` : '/articles';
    return api.get<PaginatedArticles>(url);
  },

  getOne: async (id: string): Promise<Article> => {
    return api.get<Article>(`/articles/${id}`);
  },

  getStats: async (): Promise<ArticleStats> => {
    return api.get<ArticleStats>('/articles/stats');
  },

  markAsRead: async (id: string): Promise<Article> => {
    return api.patch<Article>(`/articles/${id}/read`);
  },

  markAsUnread: async (id: string): Promise<Article> => {
    return api.patch<Article>(`/articles/${id}/unread`);
  },

  markAllAsRead: async (sourceId?: string): Promise<{ count: number }> => {
    const url = sourceId
      ? `/articles/mark-all-read?sourceId=${sourceId}`
      : '/articles/mark-all-read';
    return api.patch<{ count: number }>(url);
  },
};
