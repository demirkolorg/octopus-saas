'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi, ArticleQueryParams } from '@/lib/api/articles';

export const articleKeys = {
  all: ['articles'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  list: (params?: ArticleQueryParams) => [...articleKeys.lists(), params] as const,
  stats: () => [...articleKeys.all, 'stats'] as const,
  detail: (id: string) => [...articleKeys.all, 'detail', id] as const,
};

export function useArticles(params?: ArticleQueryParams) {
  return useQuery({
    queryKey: articleKeys.list(params),
    queryFn: () => articlesApi.getAll(params),
  });
}

export function useArticleStats() {
  return useQuery({
    queryKey: articleKeys.stats(),
    queryFn: () => articlesApi.getStats(),
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: articleKeys.detail(id),
    queryFn: () => articlesApi.getOne(id),
    enabled: !!id,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleKeys.stats() });
    },
  });
}

export function useMarkAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesApi.markAsUnread(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleKeys.stats() });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceId?: string) => articlesApi.markAllAsRead(sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleKeys.stats() });
    },
  });
}
