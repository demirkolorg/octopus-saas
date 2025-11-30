'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Article } from '@/lib/api/articles';
import { formatRelativeDate } from '@/lib/date-utils';
import { Check, ExternalLink, Eye, EyeOff } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  onMarkAsRead?: (id: string) => void;
  onMarkAsUnread?: (id: string) => void;
}

export function ArticleCard({
  article,
  onMarkAsRead,
  onMarkAsUnread,
}: ArticleCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isHiding, setIsHiding] = useState(false);

  const handleMarkAsRead = () => {
    setIsHiding(true);
    onMarkAsRead?.(article.id);
  };

  const handleMarkAsUnread = () => {
    onMarkAsUnread?.(article.id);
  };

  if (isHiding) {
    return null;
  }

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${
        article.isRead ? 'opacity-60' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {article.imageUrl && (
            <div className="flex-shrink-0">
              <img
                src={article.imageUrl}
                alt=""
                className="w-24 h-24 object-cover rounded-md bg-muted"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <h3
                    className={`font-medium text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors ${
                      article.isRead ? 'text-muted-foreground' : ''
                    }`}
                  >
                    {article.title}
                  </h3>
                </a>

                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {article.source.name}
                  </Badge>
                  <span className="text-xs">
                    {formatRelativeDate(article.publishedAt)}
                  </span>
                </div>

                {article.content && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {article.content}
                  </p>
                )}
              </div>

              <div
                className={`flex-shrink-0 flex gap-1 transition-opacity ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(article.url, '_blank')}
                  title="Yeni sekmede aç"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>

                {article.isRead ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleMarkAsUnread}
                    title="Okunmadı olarak işaretle"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleMarkAsRead}
                    title="Okundu olarak işaretle"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
