'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Source, HealthStatus } from '@/lib/api/sources';
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
  Rss,
  Code,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';

interface SourceCardProps {
  source: Source;
}

// Calculate health status from source metrics
function calculateHealthStatus(source: Source): HealthStatus {
  const totalCrawls = source.totalCrawlCount || 0;
  const successfulCrawls = source.successfulCrawlCount || 0;
  const consecutiveFailures = source.consecutiveFailures || 0;

  const successRate = totalCrawls > 0 ? (successfulCrawls / totalCrawls) * 100 : 100;

  if (consecutiveFailures >= 5 || successRate < 50) {
    return 'CRITICAL';
  }
  if (consecutiveFailures >= 2 || successRate < 80) {
    return 'WARNING';
  }
  return 'HEALTHY';
}

// Calculate success rate from source metrics
function calculateSuccessRate(source: Source): number {
  const totalCrawls = source.totalCrawlCount || 0;
  const successfulCrawls = source.successfulCrawlCount || 0;
  if (totalCrawls === 0) return 100;
  return Math.round((successfulCrawls / totalCrawls) * 100);
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
        return <Badge className="bg-green-500 dark:bg-green-600 text-white">Aktif</Badge>;
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

  const getTypeBadge = () => {
    if (source.sourceType === 'RSS') {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:bg-orange-950">
          <Rss className="h-3 w-3 mr-1" />
          RSS
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950">
        <Code className="h-3 w-3 mr-1" />
        Selector
      </Badge>
    );
  };

  const healthStatus = calculateHealthStatus(source);
  const successRate = calculateSuccessRate(source);
  const hasCrawlHistory = (source.totalCrawlCount || 0) > 0;

  const getHealthIcon = () => {
    switch (healthStatus) {
      case 'HEALTHY':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
      case 'CRITICAL':
        return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    }
  };

  const getHealthColor = () => {
    switch (healthStatus) {
      case 'HEALTHY':
        return 'text-green-600';
      case 'WARNING':
        return 'text-yellow-600';
      case 'CRITICAL':
        return 'text-red-600';
    }
  };

  return (
    <Link href={`/dashboard/sources/${source.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 overflow-hidden">
              <CardTitle className="text-base truncate">{source.name}</CardTitle>
              <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
                {source.site && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[80px]">
                    {source.site.name}
                  </span>
                )}
                {source.category && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded truncate max-w-[80px]"
                    style={{
                      backgroundColor: source.category.color ? `${source.category.color}20` : undefined,
                      color: source.category.color
                    }}
                  >
                    {source.category.name}
                  </span>
                )}
              </div>
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(source.url, '_blank', 'noopener,noreferrer');
                }}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 cursor-pointer mt-0.5"
              >
                <span className="truncate">{new URL(source.url).hostname}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </span>
            </div>
            <div className="flex gap-1 items-center flex-shrink-0">
              {getTypeBadge()}
              {getStatusBadge()}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 space-y-2">
          {/* Health metrics row */}
          {hasCrawlHistory && (
            <div className="flex items-center gap-2 text-xs">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-1 ${getHealthColor()}`}>
                      {getHealthIcon()}
                      <span className="font-medium">{successRate}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <div className="space-y-1">
                      <div>Başarı: {source.successfulCrawlCount || 0}/{source.totalCrawlCount || 0}</div>
                      <div>Hata: {source.failedCrawlCount || 0}</div>
                      {source.consecutiveFailures && source.consecutiveFailures > 0 && (
                        <div className="text-red-400">Ardışık hata: {source.consecutiveFailures}</div>
                      )}
                      {source.lastErrorMessage && (
                        <div className="text-red-400 max-w-[200px] truncate">
                          Son hata: {source.lastErrorMessage}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-muted-foreground">|</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>{source.totalArticlesInserted || 0} haber</span>
              </div>
            </div>
          )}

          {/* Time and actions row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0 overflow-hidden">
              <div className="flex items-center gap-1 flex-shrink-0">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {source.lastCrawlAt
                    ? formatRelativeDate(source.lastCrawlAt)
                    : 'Hiç'}
                </span>
              </div>
              <span className="flex-shrink-0">
                {Math.floor((source.refreshInterval || 900) / 60)}dk
              </span>
            </div>

            <div className="flex gap-0.5 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleToggleStatus}
                disabled={pauseSource.isPending || activateSource.isPending}
              >
                {source.status === 'ACTIVE' ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCrawl}
                disabled={crawlSource.isPending || source.status !== 'ACTIVE'}
              >
                {crawlSource.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
