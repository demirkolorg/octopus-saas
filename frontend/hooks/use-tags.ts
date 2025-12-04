'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi, Tag } from '@/lib/api/tags';

export function useTags() {
  return useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll(),
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) =>
      tagsApi.create(name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string } }) =>
      tagsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tagsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useArticlesByTag(tagId: string) {
  return useQuery({
    queryKey: ['tag-articles', tagId],
    queryFn: () => tagsApi.getArticlesByTag(tagId),
    enabled: !!tagId,
  });
}

export function useAddTagToArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tagId, articleId }: { tagId: string; articleId: string }) =>
      tagsApi.addToArticle(tagId, articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-tags'] });
    },
  });
}

export function useRemoveTagFromArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tagId, articleId }: { tagId: string; articleId: string }) =>
      tagsApi.removeFromArticle(tagId, articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-tags'] });
    },
  });
}

export function useArticleTags(articleId: string) {
  return useQuery<Tag[]>({
    queryKey: ['article-tags', articleId],
    queryFn: () => tagsApi.getArticleTags(articleId),
    enabled: !!articleId,
  });
}
