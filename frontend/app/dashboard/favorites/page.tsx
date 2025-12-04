'use client';

import { useState } from 'react';
import { useFavorites } from '@/hooks/use-favorites';
import { ArticleDetailPanel } from '@/components/articles/article-detail-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeDate } from '@/lib/date-utils';
import {
  Star,
  Newspaper,
  Globe,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { useMarkAsRead, useMarkAsUnread } from '@/hooks/use-articles';

export default function FavoritesPage() {
  const { data: favorites = [], isLoading } = useFavorites();
  const [selectedArticle, setSelectedArticle] = useState<typeof favorites[0]['article'] | null>(null);
  const markAsRead = useMarkAsRead();
  const markAsUnread = useMarkAsUnread();

  const handleSelectArticle = (article: typeof favorites[0]['article']) => {
    setSelectedArticle(article);
    if (!article.isRead) {
      markAsRead.mutate(article.id);
    }
  };

  const selectedIndex = selectedArticle
    ? favorites.findIndex((f) => f.article.id === selectedArticle.id)
    : -1;

  const handleNavigatePrev = () => {
    if (selectedIndex > 0) {
      handleSelectArticle(favorites[selectedIndex - 1].article);
    }
  };

  const handleNavigateNext = () => {
    if (selectedIndex < favorites.length - 1) {
      handleSelectArticle(favorites[selectedIndex + 1].article);
    }
  };

  const getSourceLogo = (article: typeof favorites[0]['article']) => {
    const source = article.source;
    if (!source) return null;
    const logoUrl = source.site?.logoUrl;
    const domain = source.site?.domain;
    return logoUrl || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null);
  };

  if (isLoading) {
    return (
      <div className="flex h-full">
        <div className="flex-1 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <Star className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">Favoriler</h1>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-4">
                <Skeleton className="h-24 w-32 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Article List */}
      <div className={`flex-1 p-6 overflow-y-auto ${selectedArticle ? 'w-1/2' : 'w-full'}`}>
        <div className="flex items-center gap-3 mb-6">
          <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">Favoriler</h1>
            <p className="text-muted-foreground">
              {favorites.length} favori haber
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Star className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Henüz Favoriniz Yok</h3>
            <p className="text-muted-foreground max-w-sm">
              Haberleri favorilere eklemek için haber detayında yıldız ikonuna tıklayın
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((favorite) => {
              const article = favorite.article;
              const logoUrl = getSourceLogo(article);
              const isSelected = selectedArticle?.id === article.id;

              return (
                <Card
                  key={favorite.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary bg-accent/30' : ''
                  } ${!article.isRead ? 'border-l-4 border-l-primary' : ''}`}
                  onClick={() => handleSelectArticle(article)}
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    {article.imageUrl && (
                      <div className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={article.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold line-clamp-2 mb-2 ${!article.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {article.title}
                      </h3>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {/* Source */}
                        <div className="flex items-center gap-1.5">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt=""
                              className="h-4 w-4 rounded-full object-cover"
                            />
                          ) : (
                            <Globe className="h-4 w-4" />
                          )}
                          <span className="truncate max-w-[120px]">
                            {article.source?.site?.name || article.source?.name || 'Bilinmeyen'}
                          </span>
                        </div>

                        <span>•</span>

                        {/* Date */}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatRelativeDate(article.publishedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-start">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(article.url, '_blank');
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedArticle && (
        <div className="w-1/2 border-l">
          <ArticleDetailPanel
            article={selectedArticle}
            onClose={() => setSelectedArticle(null)}
            onMarkAsRead={(id) => markAsRead.mutate(id)}
            onMarkAsUnread={(id) => markAsUnread.mutate(id)}
            onNavigatePrev={handleNavigatePrev}
            onNavigateNext={handleNavigateNext}
            hasPrev={selectedIndex > 0}
            hasNext={selectedIndex < favorites.length - 1}
          />
        </div>
      )}
    </div>
  );
}
