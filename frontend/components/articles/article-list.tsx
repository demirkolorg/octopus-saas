'use client';

import { useState, useEffect } from 'react';
import { ArticleCard } from './article-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useArticles, useMarkAsRead, useMarkAsUnread, useMarkAllAsRead } from '@/hooks/use-articles';
import { ChevronLeft, ChevronRight, CheckCheck, Loader2, RefreshCw } from 'lucide-react';

interface ArticleListProps {
  sourceId?: string;
  isRead?: boolean;
  searchQuery?: string;
  watchOnly?: boolean;
  todayOnly?: boolean;
}

export function ArticleList({ sourceId, isRead, searchQuery = '', watchOnly = false, todayOnly = false }: ArticleListProps) {
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const limit = 20;

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [isRead, watchOnly, todayOnly]);

  // Debounce search from parent
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== debouncedSearch) {
        setDebouncedSearch(searchQuery);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, error, refetch, isFetching } = useArticles({
    page,
    limit,
    sourceId,
    isRead,
    search: debouncedSearch || undefined,
    watchOnly: watchOnly || undefined,
    todayOnly: todayOnly || undefined,
  });

  const markAsRead = useMarkAsRead();
  const markAsUnread = useMarkAsUnread();
  const markAllAsRead = useMarkAllAsRead();

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAsUnread = (id: string) => {
    markAsUnread.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(sourceId);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto space-y-4 pr-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Haberler yüklenirken bir hata oluştu.</p>
        <p className="text-sm mt-2">{(error as Error).message}</p>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>Henüz haber bulunmuyor.</p>
          <p className="text-sm mt-2">Kaynakları taramaya başlamak için bir kaynak ekleyin.</p>
        </div>
      </div>
    );
  }

  const { meta } = data;

  return (
    <div className="h-full flex flex-col">
      {/* Search Results Info */}
      {debouncedSearch && (
        <div className="flex-shrink-0 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded mb-2">
          &quot;{debouncedSearch}&quot; için {meta.total || 0} sonuç
        </div>
      )}

      {/* Articles */}
      <div className="flex-1 min-h-0 overflow-auto space-y-3 pr-2">
        {data.data.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onMarkAsRead={handleMarkAsRead}
            onMarkAsUnread={handleMarkAsUnread}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center justify-between pt-3 border-t mt-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Yenile"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
            title="Tümünü okundu işaretle"
          >
            {markAllAsRead.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            {meta.total} haber
          </span>
        </div>

        {meta.lastPage > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {meta.lastPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
              disabled={page === meta.lastPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
