'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Source } from '@/lib/api/sources';
import { formatRelativeDate } from '@/lib/date-utils';
import { useCrawlSource, usePauseSource, useActivateSource } from '@/hooks/use-sources';
import {
  ExternalLink,
  RefreshCw,
  Pause,
  Play,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface SourceCardProps {
  source: Source;
}

export function SourceCard({ source }: SourceCardProps) {
  const crawlSource = useCrawlSource();
  const pauseSource = usePauseSource();
  const activateSource = useActivateSource();

  const handleCrawl = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    crawlSource.mutate(source.id);
  };

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (source.status === 'ACTIVE') {
      pauseSource.mutate(source.id);
    } else {
      activateSource.mutate(source.id);
    }
  };

  const getStatusBadge = () => {
    switch (source.status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Aktif</Badge>;
      case 'PAUSED':
        return <Badge variant="secondary">Duraklatıldı</Badge>;
      case 'ERROR':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Hata
          </Badge>
        );
      default:
        return <Badge variant="outline">{source.status}</Badge>;
    }
  };

  return (
    <Link href={`/dashboard/sources/${source.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{source.name}</CardTitle>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
              >
                {new URL(source.url).hostname}
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {source.lastCrawlAt
                  ? formatRelativeDate(source.lastCrawlAt)
                  : 'Hiç taranmadı'}
              </div>
              <div className="text-xs">
                Her {source.crawlInterval} dk
              </div>
            </div>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleToggleStatus}
                disabled={pauseSource.isPending || activateSource.isPending}
              >
                {source.status === 'ACTIVE' ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCrawl}
                disabled={crawlSource.isPending || source.status !== 'ACTIVE'}
              >
                {crawlSource.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
