'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { articlesApi, Article } from '@/lib/api/articles';
import { useNotificationSound } from './use-notification-sound';
import { articleKeys } from './use-articles';

const POLL_INTERVAL = 30000; // 30 seconds
const HIGHLIGHT_DURATION = 5000; // 5 seconds for highlight animation

interface UseNewArticleNotificationsOptions {
  enabled?: boolean;
}

// Global state for new article IDs (shared across components)
let newArticleIdsSet = new Set<string>();
let newArticleIdsListeners: Array<(ids: Set<string>) => void> = [];

function notifyListeners() {
  newArticleIdsListeners.forEach(listener => listener(new Set(newArticleIdsSet)));
}

export function addNewArticleIds(ids: string[]) {
  ids.forEach(id => newArticleIdsSet.add(id));
  notifyListeners();

  // Remove after highlight duration
  setTimeout(() => {
    ids.forEach(id => newArticleIdsSet.delete(id));
    notifyListeners();
  }, HIGHLIGHT_DURATION);
}

export function useNewArticleIds() {
  const [newIds, setNewIds] = useState<Set<string>>(new Set(newArticleIdsSet));

  useEffect(() => {
    const listener = (ids: Set<string>) => setNewIds(ids);
    newArticleIdsListeners.push(listener);
    return () => {
      newArticleIdsListeners = newArticleIdsListeners.filter(l => l !== listener);
    };
  }, []);

  return newIds;
}

export function useNewArticleNotifications(options: UseNewArticleNotificationsOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  const { playSound } = useNotificationSound();
  const previousArticleIdsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  // Poll stats endpoint (lightweight)
  const { data: stats } = useQuery({
    queryKey: ['articles', 'stats', 'poll'],
    queryFn: () => articlesApi.getStats(),
    refetchInterval: enabled ? POLL_INTERVAL : false,
    refetchIntervalInBackground: false, // Only poll when tab is active
    staleTime: POLL_INTERVAL - 5000,
  });

  const showNotification = useCallback(async (newCount: number) => {
    // Play sound
    playSound();

    // Fetch first page to get new article IDs
    try {
      const response = await articlesApi.getAll({ page: 1, limit: 50 });
      const currentIds = new Set(response.data.map((a: Article) => a.id));

      // Find new IDs (in current but not in previous)
      const newIds: string[] = [];
      currentIds.forEach(id => {
        if (!previousArticleIdsRef.current.has(id)) {
          newIds.push(id);
        }
      });

      // Update previous IDs
      previousArticleIdsRef.current = currentIds;

      // Add new IDs for highlighting
      if (newIds.length > 0) {
        addNewArticleIds(newIds);
      }
    } catch {
      // Ignore fetch errors
    }

    // Show toast
    toast.success(
      `${newCount} yeni haber geldi!`,
      {
        description: 'Listeyi yenilemek için tıklayın',
        action: {
          label: 'Yenile',
          onClick: () => {
            // Invalidate article lists to trigger refetch
            queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
            queryClient.invalidateQueries({ queryKey: articleKeys.stats() });
          },
        },
        duration: 5000,
      }
    );

    // Also invalidate to update the list automatically
    queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    queryClient.invalidateQueries({ queryKey: articleKeys.stats() });
  }, [playSound, queryClient]);

  // Initialize previous article IDs on first load
  useEffect(() => {
    if (!isInitializedRef.current && enabled) {
      articlesApi.getAll({ page: 1, limit: 50 }).then(response => {
        previousArticleIdsRef.current = new Set(response.data.map((a: Article) => a.id));
      }).catch(() => {});
    }
  }, [enabled]);

  useEffect(() => {
    if (!stats || !enabled) return;

    const currentTotal = stats.total;

    // Skip first load - just initialize
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    // Check if there are new articles
    const previousTotal = previousArticleIdsRef.current.size;
    if (previousTotal > 0 && currentTotal > previousTotal) {
      const newCount = currentTotal - previousTotal;
      showNotification(newCount);
    }
  }, [stats, enabled, showNotification]);

  return {
    isPolling: enabled,
  };
}
