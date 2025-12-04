'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesApi, Favorite } from '@/lib/api/favorites';

export function useFavorites() {
  return useQuery<Favorite[]>({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.getAll(),
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: string) => favoritesApi.add(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: string) => favoritesApi.remove(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ articleId, isFavorite }: { articleId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        return favoritesApi.remove(articleId);
      }
      return favoritesApi.add(articleId);
    },
    onSuccess: (_, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-check', articleId] });
    },
  });
}

export function useFavoriteCheck(articleId: string) {
  return useQuery({
    queryKey: ['favorite-check', articleId],
    queryFn: () => favoritesApi.check(articleId),
    enabled: !!articleId,
  });
}

export function useFavoriteBatchCheck(articleIds: string[]) {
  return useQuery({
    queryKey: ['favorite-batch-check', articleIds],
    queryFn: () => favoritesApi.checkBatch(articleIds),
    enabled: articleIds.length > 0,
  });
}
