'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crawlerApi, CrawlActivity, QueueStatus } from '@/lib/api/crawler';

export function useCrawlActivity(limit = 50) {
  return useQuery<CrawlActivity[]>({
    queryKey: ['crawl-activity', limit],
    queryFn: () => crawlerApi.getActivity(limit),
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });
}

export function useQueueStatus() {
  return useQuery<QueueStatus>({
    queryKey: ['queue-status'],
    queryFn: () => crawlerApi.getQueueStatus(),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });
}

export function useTriggerCrawl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceId: string) => crawlerApi.triggerCrawl(sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawl-activity'] });
      queryClient.invalidateQueries({ queryKey: ['queue-status'] });
    },
  });
}

export function useTriggerCrawlAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => crawlerApi.triggerCrawlAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawl-activity'] });
      queryClient.invalidateQueries({ queryKey: ['queue-status'] });
    },
  });
}
