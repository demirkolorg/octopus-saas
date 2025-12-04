'use client';

import { useArticleStats } from '@/hooks/use-articles';
import { Newspaper, BookOpen, CalendarDays } from 'lucide-react';

export function InlineStats() {
  const { data: stats, isLoading } = useArticleStats();

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="animate-pulse">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Newspaper className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">{stats?.total || 0}</span>
        <span className="hidden sm:inline">toplam</span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium text-primary">{stats?.unread || 0}</span>
        <span className="hidden sm:inline">okunmamış</span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5 text-green-600" />
        <span className="font-medium text-green-600">{stats?.todayCount || 0}</span>
        <span className="hidden sm:inline">bugün</span>
      </div>
    </div>
  );
}
