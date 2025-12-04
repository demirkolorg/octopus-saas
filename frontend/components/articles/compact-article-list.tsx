'use client';

import { useState, useEffect, useCallback } from 'react';
import { CompactArticleRow } from './compact-article-row';
import { ArticleDetailPanel } from './article-detail-panel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useArticles, useMarkAsRead, useMarkAsUnread, useMarkAllAsRead } from '@/hooks/use-articles';
import { useNewArticleIds } from '@/hooks/use-new-article-notifications';
import { Article } from '@/lib/api/articles';
import { ChevronLeft, ChevronRight, CheckCheck, Loader2, RefreshCw } from 'lucide-react';

interface CompactArticleListProps {
  sourceId?: string;
  isRead?: boolean;
  searchQuery?: string;
  watchOnly?: boolean;
  todayOnly?: boolean;
}

export function CompactArticleList({
  sourceId,
  isRead,
  searchQuery = '',
  watchOnly = false,
  todayOnly = false
}: CompactArticleListProps) {
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const limit = 30;

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
  const newArticleIds = useNewArticleIds();

  const handleMarkAsRead = useCallback((id: string) => {
    markAsRead.mutate(id);
  }, [markAsRead]);

  const handleMarkAsUnread = useCallback((id: string) => {
    markAsUnread.mutate(id);
  }, [markAsUnread]);

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(sourceId);
  };

  const handleSelectArticle = useCallback((article: Article) => {
    setSelectedArticle(article);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedArticle(null);
  }, []);

  // Navigation between articles
  const currentIndex = selectedArticle
    ? data?.data.findIndex(a => a.id === selectedArticle.id) ?? -1
    : -1;

  const handleNavigatePrev = useCallback(() => {
    if (data && currentIndex > 0) {
      const prevArticle = data.data[currentIndex - 1];
      setSelectedArticle(prevArticle);
      if (!prevArticle.isRead) {
        handleMarkAsRead(prevArticle.id);
      }
    }
  }, [data, currentIndex, handleMarkAsRead]);

  const handleNavigateNext = useCallback(() => {
    if (data && currentIndex < data.data.length - 1) {
      const nextArticle = data.data[currentIndex + 1];
      setSelectedArticle(nextArticle);
      if (!nextArticle.isRead) {
        handleMarkAsRead(nextArticle.id);
      }
    }
  }, [data, currentIndex, handleMarkAsRead]);

  // Keyboard navigation - only when not typing in search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input
      if (document.activeElement?.tagName === 'INPUT') return;
      if (!selectedArticle) return;

      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        handleNavigatePrev();
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        handleNavigateNext();
      } else if (e.key === 'Escape') {
        handleCloseDetail();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArticle, handleNavigatePrev, handleNavigateNext, handleCloseDetail]);

  // Update selected article when data changes (keep selection in sync)
  useEffect(() => {
    if (selectedArticle && data) {
      const updated = data.data.find(a => a.id === selectedArticle.id);
      if (updated) {
        setSelectedArticle(updated);
      }
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-full border rounded-lg overflow-hidden">
        <div className="flex h-full">
          <div className="w-1/2 border-r overflow-auto">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="px-3 py-2 border-b">
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
          <div className="w-1/2">
            <Skeleton className="h-full w-full" />
          </div>
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

  const articles = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="h-full flex flex-col">
      {/* Search Results Info */}
      {debouncedSearch && (
        <div className="flex-shrink-0 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded mb-2">
          &quot;{debouncedSearch}&quot; için {meta?.total || 0} sonuç
        </div>
      )}

      {/* Main Content - Split View */}
      {articles.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground border rounded-lg">
          <div className="text-center">
            <p>Henüz haber bulunmuyor.</p>
            <p className="text-sm mt-2">Kaynakları taramaya başlamak için bir kaynak ekleyin.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-background">
          <div className="flex h-full">
            {/* Article List - 50% */}
            <div className={`${selectedArticle ? 'hidden lg:flex lg:w-1/2' : 'w-full flex'} flex-col h-full border-r`}>
              <div className="flex-1 min-h-0 overflow-auto">
                {articles.map((article) => (
                  <CompactArticleRow
                    key={article.id}
                    article={article}
                    isSelected={selectedArticle?.id === article.id}
                    onSelect={handleSelectArticle}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAsUnread={handleMarkAsUnread}
                    searchQuery={debouncedSearch}
                    isNew={newArticleIds.has(article.id)}
                  />
                ))}
              </div>

              {/* Footer - Pagination & Actions */}
              <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-t bg-muted/30">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    title="Yenile"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleMarkAllAsRead}
                    disabled={markAllAsRead.isPending}
                    title="Tümünü okundu işaretle"
                  >
                    {markAllAsRead.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCheck className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <span className="text-xs text-muted-foreground ml-1">
                    {meta?.total || 0} haber
                  </span>
                </div>

                {meta && meta.lastPage > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground px-1">
                      {page}/{meta.lastPage}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
                      disabled={page === meta.lastPage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Detail Panel - 50% */}
            <div className={`${selectedArticle ? 'w-full lg:w-1/2' : 'hidden lg:block lg:w-1/2'} h-full`}>
              <ArticleDetailPanel
                article={selectedArticle}
                onClose={handleCloseDetail}
                onMarkAsRead={handleMarkAsRead}
                onMarkAsUnread={handleMarkAsUnread}
                onNavigatePrev={handleNavigatePrev}
                onNavigateNext={handleNavigateNext}
                hasPrev={currentIndex > 0}
                hasNext={data ? currentIndex < data.data.length - 1 : false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
