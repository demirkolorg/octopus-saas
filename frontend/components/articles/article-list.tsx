'use client';

import { useState } from 'react';
import { ArticleCard } from './article-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useArticles, useMarkAsRead, useMarkAsUnread, useMarkAllAsRead } from '@/hooks/use-articles';
import { ChevronLeft, ChevronRight, CheckCheck, Loader2 } from 'lucide-react';

interface ArticleListProps {
  sourceId?: string;
  showReadFilter?: boolean;
}

export function ArticleList({ sourceId, showReadFilter = true }: ArticleListProps) {
  const [page, setPage] = useState(1);
  const [showRead, setShowRead] = useState<boolean | undefined>(undefined);
  const limit = 20;

  const { data, isLoading, error } = useArticles({
    page,
    limit,
    sourceId,
    isRead: showRead,
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
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
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
      <div className="text-center py-12 text-muted-foreground">
        <p>Henüz haber bulunmuyor.</p>
        <p className="text-sm mt-2">Kaynakları taramaya başlamak için bir kaynak ekleyin.</p>
      </div>
    );
  }

  const { meta } = data;

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        {showReadFilter && (
          <div className="flex gap-2">
            <Button
              variant={showRead === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowRead(undefined)}
            >
              Tümü
            </Button>
            <Button
              variant={showRead === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowRead(false)}
            >
              Okunmamış
            </Button>
            <Button
              variant={showRead === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowRead(true)}
            >
              Okunmuş
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllAsRead}
          disabled={markAllAsRead.isPending}
        >
          {markAllAsRead.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCheck className="h-4 w-4 mr-2" />
          )}
          Tümünü Okundu İşaretle
        </Button>
      </div>

      {/* Articles */}
      <div className="space-y-3">
        {data.data.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onMarkAsRead={handleMarkAsRead}
            onMarkAsUnread={handleMarkAsUnread}
          />
        ))}
      </div>

      {/* Pagination */}
      {meta.lastPage > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Önceki
          </Button>

          <span className="text-sm text-muted-foreground">
            Sayfa {meta.page} / {meta.lastPage}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
            disabled={page === meta.lastPage}
          >
            Sonraki
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="text-center text-sm text-muted-foreground">
        Toplam {meta.total} haber
      </div>
    </div>
  );
}
