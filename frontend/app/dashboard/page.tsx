'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CompactArticleList } from "@/components/articles/compact-article-list";
import { ArticleFilterTabs, ArticleFilterTab } from "@/components/articles";
import { useNewArticleNotifications } from "@/hooks/use-new-article-notifications";
import { useQueryClient } from '@tanstack/react-query';
import { articleKeys } from "@/hooks/use-articles";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [filterTab, setFilterTab] = useState<ArticleFilterTab>('all');
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Enable real-time notifications for new articles
  useNewArticleNotifications({ enabled: true });

  // Refresh articles list
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    await queryClient.invalidateQueries({ queryKey: articleKeys.stats() });
    setIsRefreshing(false);
    toast.success('Haberler yenilendi');
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Convert filter tab to query params
  const isRead = filterTab === 'unread' ? false : undefined;
  const watchOnly = filterTab === 'watch';
  const todayOnly = filterTab === 'today';

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="flex-shrink-0 flex items-center gap-4 py-2">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex-shrink-0">Haberler</h1>

        <ArticleFilterTabs value={filterTab} onChange={setFilterTab} />

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8"
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Articles - Full Height */}
      <div className="flex-1 min-h-0">
        <CompactArticleList
          isRead={isRead}
          searchQuery={searchQuery}
          watchOnly={watchOnly}
          todayOnly={todayOnly}
        />
      </div>
    </div>
  );
}
