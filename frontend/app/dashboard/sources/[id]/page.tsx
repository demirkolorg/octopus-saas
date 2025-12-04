'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useSource,
  useSourceJobs,
  useDeleteSource,
  usePauseSource,
  useActivateSource,
  useCrawlSource,
} from '@/hooks/use-sources';
import { formatRelativeDate, formatFullDate } from '@/lib/date-utils';
import {
  ArrowLeft,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  ExternalLink,
  Clock,
  Newspaper,
  AlertCircle,
  CheckCircle,
  Loader2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SourceDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: source, isLoading: sourceLoading } = useSource(id);
  const { data: jobs, isLoading: jobsLoading } = useSourceJobs(id);

  const deleteSource = useDeleteSource();
  const pauseSource = usePauseSource();
  const activateSource = useActivateSource();
  const crawlSource = useCrawlSource();

  const handleDelete = async () => {
    if (confirm('Bu kaynağı silmek istediğinizden emin misiniz?')) {
      await deleteSource.mutateAsync(id);
      router.push('/dashboard/sources');
    }
  };

  const handleToggleStatus = () => {
    if (source?.status === 'ACTIVE') {
      pauseSource.mutate(id);
    } else {
      activateSource.mutate(id);
    }
  };

  const handleCrawl = () => {
    crawlSource.mutate(id);
  };

  if (sourceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!source) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Kaynak bulunamadı.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/sources">Kaynaklara Dön</Link>
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Aktif</Badge>;
      case 'PAUSED':
        return <Badge variant="secondary">Duraklatıldı</Badge>;
      case 'ERROR':
        return <Badge variant="destructive">Hata</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
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

  return (
    <div className="h-full overflow-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/sources">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{source.name}</h1>
            {getStatusBadge(source.status)}
          </div>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            {source.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleCrawl}
          disabled={crawlSource.isPending || source.status !== 'ACTIVE'}
        >
          {crawlSource.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Şimdi Tara
        </Button>

        <Button variant="outline" onClick={handleToggleStatus}>
          {source.status === 'ACTIVE' ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Duraklat
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Aktifleştir
            </>
          )}
        </Button>

        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteSource.isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Sil
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Son Tarama</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {source.lastCrawlAt
                ? formatRelativeDate(source.lastCrawlAt)
                : 'Henüz taranmadı'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarama Aralığı</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {source.refreshInterval} dakika
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oluşturulma</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {formatRelativeDate(source.createdAt)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crawl History */}
      <Card>
        <CardHeader>
          <CardTitle>Tarama Geçmişi</CardTitle>
          <CardDescription>Son 10 tarama işlemi</CardDescription>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Henüz tarama yapılmadı.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-sm font-medium">Durum</th>
                    <th className="text-left py-2 px-2 text-sm font-medium">Tarih</th>
                    <th className="text-left py-2 px-2 text-sm font-medium">Bulunan</th>
                    <th className="text-left py-2 px-2 text-sm font-medium">Eklenen</th>
                    <th className="text-left py-2 px-2 text-sm font-medium">Süre</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          {getJobStatusIcon(job.status)}
                          <span className="text-sm">{job.status}</span>
                          {job.status === 'FAILED' && job.errorMessage && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{job.errorMessage}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-sm">
                        {formatFullDate(job.startedAt)}
                      </td>
                      <td className="py-2 px-2 text-sm">{job.itemsFound}</td>
                      <td className="py-2 px-2 text-sm">{job.itemsInserted}</td>
                      <td className="py-2 px-2 text-sm">
                        {job.finishedAt
                          ? `${Math.round(
                              (new Date(job.finishedAt).getTime() -
                                new Date(job.startedAt).getTime()) /
                                1000,
                            )}s`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selectors Info - Only for web sources */}
      {source.selectors && (
        <Card>
          <CardHeader>
            <CardTitle>CSS Seçiciler</CardTitle>
            <CardDescription>Bu kaynak için tanımlanan seçiciler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm font-mono">
              <div className="text-muted-foreground text-xs mb-1">-- Liste Sayfası --</div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24">Haber Kartı:</span>
                <code className="bg-muted px-2 py-1 rounded">{source.selectors.listItem || '-'}</code>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24">Link:</span>
                <code className="bg-muted px-2 py-1 rounded text-green-600">otomatik bulunur</code>
              </div>

              <div className="text-muted-foreground text-xs mb-1 mt-3">-- Detay Sayfası --</div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24">Başlık:</span>
                <code className="bg-muted px-2 py-1 rounded">{source.selectors.title || '-'}</code>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24">Tarih:</span>
                <code className="bg-muted px-2 py-1 rounded">{source.selectors.date || '-'}</code>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24">İçerik:</span>
                <code className="bg-muted px-2 py-1 rounded">{source.selectors.content || '-'}</code>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24">Özet:</span>
                <code className="bg-muted px-2 py-1 rounded">{source.selectors.summary || '-'}</code>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24">Görsel:</span>
                <code className="bg-muted px-2 py-1 rounded">{source.selectors.image || '-'}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
