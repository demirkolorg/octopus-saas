import { api } from './client';
import { Article } from './articles';

export interface Favorite {
  id: string;
  userId: string;
  articleId: string;
  article: Article;
  createdAt: string;
}

export const favoritesApi = {
  getAll: async (): Promise<Favorite[]> => {
    return api.get<Favorite[]>('/favorites');
  },

  add: async (articleId: string): Promise<Favorite> => {
    return api.post<Favorite>('/favorites', { articleId });
  },

  remove: async (articleId: string): Promise<void> => {
    return api.delete(`/favorites/${articleId}`);
  },

  check: async (articleId: string): Promise<{ isFavorite: boolean }> => {
    return api.get<{ isFavorite: boolean }>(`/favorites/check/${articleId}`);
  },

  checkBatch: async (articleIds: string[]): Promise<{ favoriteIds: string[] }> => {
    return api.post<{ favoriteIds: string[] }>('/favorites/check-batch', { articleIds });
  },
};
