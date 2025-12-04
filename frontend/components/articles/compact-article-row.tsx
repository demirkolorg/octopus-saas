'use client';

import { cn } from '@/lib/utils';
import { Article } from '@/lib/api/articles';
import { formatRelativeDate } from '@/lib/date-utils';
import { Circle, ExternalLink, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompactSourceAvatars } from './compact-source-avatars';

interface CompactArticleRowProps {
  article: Article;
  isSelected: boolean;
  onSelect: (article: Article) => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAsUnread?: (id: string) => void;
  searchQuery?: string;
  isNew?: boolean;
}

// Highlight matching text in title
function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query || query.length < 2) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-inherit px-0.5 rounded-sm">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function CompactArticleRow({
  article,
  isSelected,
  onSelect,
  onMarkAsRead,
  onMarkAsUnread,
  searchQuery,
  isNew = false,
}: CompactArticleRowProps) {
  const handleClick = () => {
    onSelect(article);
    if (!article.isRead && onMarkAsRead) {
      onMarkAsRead(article.id);
    }
  };

  const handleReadToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (article.isRead) {
      onMarkAsUnread?.(article.id);
    } else {
      onMarkAsRead?.(article.id);
    }
  };

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(article.url, '_blank');
  };

  // Get all sources for this article
  const allSources = article.relatedSources && article.relatedSources.length > 0
    ? article.relatedSources
    : [article.source];

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group flex items-center gap-2 px-3 py-1.5 border-b cursor-pointer transition-colors',
        'hover:bg-muted/50',
        isSelected && 'bg-primary/5 border-l-2 border-l-primary',
        !article.isRead && 'bg-blue-50/50 dark:bg-blue-950/20',
        isNew && 'animate-highlight-new'
      )}
    >
      {/* Read/Unread indicator */}
      <button
        onClick={handleReadToggle}
        className="flex-shrink-0 p-0.5 hover:bg-muted rounded"
        title={article.isRead ? 'Okunmadı olarak işaretle' : 'Okundu olarak işaretle'}
      >
        {article.isRead ? (
          <Circle className="h-2.5 w-2.5 text-muted-foreground" />
        ) : (
          <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
        )}
      </button>

      {/* Source name */}
      <span className={cn(
        'flex-shrink-0 w-24 text-xs truncate',
        article.isRead ? 'text-muted-foreground' : 'font-medium text-foreground'
      )}>
        {article.source?.site?.name || article.source?.name || 'Bilinmeyen'}
      </span>

      {/* Title */}
      <span className={cn(
        'flex-1 truncate text-sm',
        article.isRead ? 'text-muted-foreground' : 'font-medium text-foreground'
      )}>
        <HighlightText text={article.title} query={searchQuery} />
      </span>

      {/* Watch badges */}
      {article.watchMatches && article.watchMatches.length > 0 && (
        <div className="flex-shrink-0 flex items-center gap-1">
          {article.watchMatches.slice(0, 2).map((match) => (
            <Badge
              key={match.id}
              style={{ backgroundColor: match.watchKeyword.color }}
              className="text-white text-[10px] px-1.5 py-0 h-4 font-normal"
            >
              <Eye className="h-2.5 w-2.5 mr-0.5" />
              {match.watchKeyword.keyword}
            </Badge>
          ))}
          {article.watchMatches.length > 2 && (
            <span className="text-[10px] text-muted-foreground">
              +{article.watchMatches.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Source avatars (multiple sources) */}
      {allSources.length > 1 && (
        <CompactSourceAvatars sources={allSources} maxVisible={3} />
      )}

      {/* Date - single line */}
      <span className="flex-shrink-0 text-[10px] text-muted-foreground/70 whitespace-nowrap">
        {formatRelativeDate(article.publishedAt)}
      </span>

      {/* Actions - show on hover */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={handleExternalLink}
          title="Yeni sekmede aç"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
