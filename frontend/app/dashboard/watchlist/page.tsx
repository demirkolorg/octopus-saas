'use client';

import { useWatchKeywords, useWatchGroups } from '@/hooks/use-watchlist';
import { AddGroupDialog, WatchGroupCard } from '@/components/watchlist';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Target,
  BookOpen,
} from 'lucide-react';

export default function WatchlistPage() {
  const { data: keywords = [] } = useWatchKeywords();
  const { data: groups = [], isLoading: groupsLoading } = useWatchGroups();

  // Toplam eşleşme sayısı
  const totalMatches = keywords.reduce((sum, k) => sum + (k.matchCount || 0), 0);
  const totalKeywords = keywords.length;

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-amber-500" />
            <div>
              <h1 className="text-3xl font-bold">Takip Listesi</h1>
              <p className="text-muted-foreground">
                {groups.length} konu, {totalKeywords} kelime, {totalMatches} eşleşme
              </p>
            </div>
          </div>
          <AddGroupDialog />
        </div>

        {/* Topics View */}
        {groupsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-28 rounded-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Henüz Takip Konusu Yok</h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              İlgili kelimeleri konular altında organize edin.
              Örneğin &quot;Van&quot; konusu altında ilçe isimlerini toplayabilirsiniz.
            </p>
            <AddGroupDialog />
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <WatchGroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
