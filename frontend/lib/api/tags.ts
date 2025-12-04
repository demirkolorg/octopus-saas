import { api } from './client';
import { Article } from './articles';

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  _count?: {
    articles: number;
  };
}

export interface ArticleTag {
  id: string;
  articleId: string;
  tagId: string;
  tag: Tag;
  createdAt: string;
}

export const tagsApi = {
  getAll: async (): Promise<Tag[]> => {
    return api.get<Tag[]>('/tags');
  },

  create: async (name: string, color?: string): Promise<Tag> => {
    return api.post<Tag>('/tags', { name, color });
  },

  update: async (id: string, data: { name?: string; color?: string }): Promise<Tag> => {
    return api.put<Tag>(`/tags/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/tags/${id}`);
  },

  getArticlesByTag: async (tagId: string): Promise<{ tag: Tag; articles: Article[] }> => {
    return api.get(`/tags/${tagId}/articles`);
  },

  addToArticle: async (tagId: string, articleId: string): Promise<ArticleTag> => {
    return api.post<ArticleTag>(`/tags/${tagId}/articles/${articleId}`);
  },

  removeFromArticle: async (tagId: string, articleId: string): Promise<void> => {
    return api.delete(`/tags/${tagId}/articles/${articleId}`);
  },

  getArticleTags: async (articleId: string): Promise<Tag[]> => {
    return api.get<Tag[]>(`/tags/article/${articleId}`);
  },

  getArticleTagsBatch: async (articleIds: string[]): Promise<Record<string, string[]>> => {
    return api.post<Record<string, string[]>>('/tags/articles/batch', { articleIds });
  },
};
