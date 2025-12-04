'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDailySummary,
  getPartialSummary,
  getDailySummaries,
  generateDailySummary,
  generatePartialSummary,
  DailySummary,
} from '@/lib/api/daily-summary';

const DAILY_SUMMARY_KEY = 'daily-summary';
const DAILY_SUMMARIES_KEY = 'daily-summaries';

/**
 * Hook to get summary for a specific date
 */
export function useDailySummary(date?: string) {
  return useQuery<DailySummary | null>({
    queryKey: [DAILY_SUMMARY_KEY, date || 'today'],
    queryFn: () => getDailySummary(date),
  });
}

/**
 * Hook to get partial summary for today
 */
export function usePartialSummary() {
  return useQuery<DailySummary | null>({
    queryKey: [DAILY_SUMMARY_KEY, 'partial'],
    queryFn: () => getPartialSummary(),
  });
}

/**
 * Hook to get list of summaries
 */
export function useDailySummaries(startDate?: string, endDate?: string) {
  return useQuery<DailySummary[]>({
    queryKey: [DAILY_SUMMARIES_KEY, startDate, endDate],
    queryFn: () => getDailySummaries(startDate, endDate),
  });
}

/**
 * Hook to generate full day summary
 */
export function useGenerateDailySummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date?: string) => generateDailySummary(date),
    onSuccess: (data, date) => {
      queryClient.setQueryData([DAILY_SUMMARY_KEY, date || 'today'], data);
      queryClient.invalidateQueries({ queryKey: [DAILY_SUMMARIES_KEY] });
    },
  });
}

/**
 * Hook to generate partial summary
 */
export function useGeneratePartialSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generatePartialSummary(),
    onSuccess: (data) => {
      queryClient.setQueryData([DAILY_SUMMARY_KEY, 'partial'], data);
      queryClient.invalidateQueries({ queryKey: [DAILY_SUMMARIES_KEY] });
    },
  });
}
