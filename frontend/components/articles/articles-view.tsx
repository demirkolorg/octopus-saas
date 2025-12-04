'use client';

import { ArticleList } from './article-list';
import { CompactArticleList } from './compact-article-list';
import { ViewMode } from './view-toggle';
import { ArticleFilterTab } from './article-filter-tabs';

interface ArticlesViewProps {
  viewMode: ViewMode;
  filterTab: ArticleFilterTab;
  searchQuery?: string;
  sourceId?: string;
}

export function ArticlesView({
  viewMode,
  filterTab,
  searchQuery,
  sourceId,
}: ArticlesViewProps) {
  // Convert ArticleFilterTab to query params
  const isRead = filterTab === 'unread' ? false : undefined;
  const watchOnly = filterTab === 'watch';
  const todayOnly = filterTab === 'today';

  return (
    <div className="h-full">
      {viewMode === 'compact' ? (
        <CompactArticleList
          sourceId={sourceId}
          isRead={isRead}
          searchQuery={searchQuery}
          watchOnly={watchOnly}
          todayOnly={todayOnly}
        />
      ) : (
        <ArticleList
          sourceId={sourceId}
          isRead={isRead}
          searchQuery={searchQuery}
          watchOnly={watchOnly}
          todayOnly={todayOnly}
        />
      )}
    </div>
  );
}
