'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sourcesApi } from '@/lib/api/sources';

export const sourceKeys = {
  all: ['sources'] as const,
  lists: () => [...sourceKeys.all, 'list'] as const,
  list: () => [...sourceKeys.lists()] as const,
  detail: (id: string) => [...sourceKeys.all, 'detail', id] as const,
  jobs: (id: string) => [...sourceKeys.all, 'jobs', id] as const,
};

export function useSources() {
  return useQuery({
    queryKey: sourceKeys.list(),
    queryFn: () => sourcesApi.getAll(),
  });
}

export function useSource(id: string) {
  return useQuery({
    queryKey: sourceKeys.detail(id),
    queryFn: () => sourcesApi.getOne(id),
    enabled: !!id,
  });
}

export function useSourceJobs(id: string) {
  return useQuery({
    queryKey: sourceKeys.jobs(id),
    queryFn: () => sourcesApi.getJobs(id),
    enabled: !!id,
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sourcesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sourceKeys.lists() });
    },
  });
}

export function usePauseSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sourcesApi.pause(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: sourceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sourceKeys.detail(id) });
    },
  });
}

export function useActivateSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sourcesApi.activate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: sourceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sourceKeys.detail(id) });
    },
  });
}

export function useCrawlSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sourcesApi.crawl(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: sourceKeys.jobs(id) });
    },
  });
}
