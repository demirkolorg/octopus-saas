'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi, ArticleQueryParams, Article } from '@/lib/api/articles';

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

/**
 * Helper to update article's isRead status in cache without reordering
 */
function updateArticleInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  articleId: string,
  isRead: boolean
) {
  // Update all list caches optimistically without reordering
  queryClient.setQueriesData<{ data: Article[]; meta: unknown }>(
    { queryKey: articleKeys.lists() },
    (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        data: oldData.data.map((article) =>
          article.id === articleId ? { ...article, isRead } : article
        ),
      };
    }
  );
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesApi.markAsRead(id),
    // Optimistic update - update isRead without reordering list
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: articleKeys.lists() });
      // Update the article in place
      updateArticleInCache(queryClient, id, true);
    },
    onSuccess: () => {
      // Only update stats, don't refetch lists (preserves order)
      queryClient.invalidateQueries({ queryKey: articleKeys.stats() });
    },
    onError: (_, id) => {
      // Rollback on error
      updateArticleInCache(queryClient, id, false);
    },
  });
}

export function useMarkAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesApi.markAsUnread(id),
    // Optimistic update
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: articleKeys.lists() });
      updateArticleInCache(queryClient, id, false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.stats() });
    },
    onError: (_, id) => {
      updateArticleInCache(queryClient, id, true);
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
