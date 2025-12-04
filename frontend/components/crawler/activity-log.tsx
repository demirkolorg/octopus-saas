'use client';

import { useCrawlActivity, useQueueStatus } from '@/hooks/use-crawler';
import { formatRelativeDate } from '@/lib/date-utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Rss,
  Code,
  Activity,
  Zap,
  Globe,
} from 'lucide-react';
import { CrawlActivity } from '@/lib/api/crawler';

function ActivityItem({ activity }: { activity: CrawlActivity }) {
  const getStatusIcon = () => {
    switch (activity.status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'RUNNING':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (activity.status) {
      case 'COMPLETED':
        return 'Tamamlandı';
      case 'FAILED':
        return 'Başarısız';
      case 'RUNNING':
        return 'Çalışıyor';
      case 'PENDING':
        return 'Bekliyor';
      default:
        return activity.status;
    }
  };

  const getDuration = () => {
    if (activity.duration) {
      const seconds = Math.round(activity.duration / 1000);
      return seconds > 60 ? `${Math.round(seconds / 60)}dk` : `${seconds}sn`;
    }
    if (activity.startedAt && activity.finishedAt) {
      const start = new Date(activity.startedAt).getTime();
      const end = new Date(activity.finishedAt).getTime();
      const seconds = Math.round((end - start) / 1000);
      return seconds > 60 ? `${Math.round(seconds / 60)}dk` : `${seconds}sn`;
    }
    return null;
  };

  return (
    <div className="flex items-start gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      <div className="mt-0.5">{getStatusIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {activity.source.name}
          </span>
          {activity.source.isSystem && (
            <span title="Sistem Kaynağı"><Globe className="h-3 w-3 text-purple-500 flex-shrink-0" /></span>
          )}
          {activity.source.sourceType === 'RSS' ? (
            <Rss className="h-3 w-3 text-orange-500 flex-shrink-0" />
          ) : (
            <Code className="h-3 w-3 text-blue-500 flex-shrink-0" />
          )}
        </div>
        {activity.source.site && (
          <span className="text-xs text-muted-foreground">
            {activity.source.site.name}
          </span>
        )}
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{formatRelativeDate(activity.startedAt)}</span>
          {getDuration() && (
            <>
              <span>•</span>
              <span>{getDuration()}</span>
            </>
          )}
        </div>
        {activity.status === 'COMPLETED' && (
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-green-600">
              +{activity.itemsInserted} yeni
            </span>
            {activity.itemsFound > activity.itemsInserted && (
              <span className="text-muted-foreground">
                ({activity.itemsFound - activity.itemsInserted} tekrar)
              </span>
            )}
          </div>
        )}
        {activity.status === 'FAILED' && activity.errorMessage && (
          <div className="text-xs text-red-500 mt-1 truncate">
            {activity.errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}

function QueueStatusBar() {
  const { data: status, isLoading } = useQueueStatus();

  if (isLoading || !status) {
    return null;
  }

  const hasActivity = status.waiting > 0 || status.active > 0;

  if (!hasActivity) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 border-b text-xs">
      <Zap className="h-3.5 w-3.5 text-yellow-500" />
      {status.active > 0 && (
        <Badge variant="secondary" className="text-xs">
          {status.active} çalışıyor
        </Badge>
      )}
      {status.waiting > 0 && (
        <Badge variant="outline" className="text-xs">
          {status.waiting} bekliyor
        </Badge>
      )}
    </div>
  );
}

export function ActivityLog() {
  const { data: activities, isLoading, error } = useCrawlActivity(50);

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Tarama Aktivitesi</h3>
        {activities && activities.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {activities.length}
          </Badge>
        )}
      </div>

      <QueueStatusBar />

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Aktivite yüklenemedi
          </div>
        ) : activities && activities.length > 0 ? (
          <div>
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Henüz tarama aktivitesi yok</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
