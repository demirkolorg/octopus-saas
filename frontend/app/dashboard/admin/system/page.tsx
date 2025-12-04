'use client';

import { useSystemSources } from '@/hooks/use-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Rss,
  ArrowLeft,
  ExternalLink,
  Newspaper,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminSystemPage() {
  const { data: sources, isLoading, error } = useSystemSources();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Sistem kaynakları yüklenirken hata oluştu.</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PAUSED':
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Aktif</Badge>;
      case 'PAUSED':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Duraklatıldı</Badge>;
      case 'ERROR':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Hata</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rss className="h-6 w-6" />
            Sistem Kaynakları
          </h1>
          <p className="text-muted-foreground">
            Tüm kullanıcılara açık {sources?.length || 0} sistem kaynağı
          </p>
        </div>
      </div>

      {sources?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Rss className="h-12 w-12 mb-4" />
            <p>Henüz sistem kaynağı bulunmuyor.</p>
            <p className="text-sm mt-2">
              Bir kaynağı sistem kaynağı yapmak için veritabanında isSystem: true olarak işaretleyin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sources?.map((source) => {
            const lastCrawl = source.lastCrawlAt
              ? new Date(source.lastCrawlAt).toLocaleString('tr-TR')
              : 'Henüz taranmadı';

            return (
              <Card key={source.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getStatusIcon(source.status)}
                        {source.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {source.site && (
                          <Badge variant="outline" className="text-xs">
                            {source.site.name}
                          </Badge>
                        )}
                        {source.category && (
                          <Badge variant="secondary" className="text-xs">
                            {source.category.name}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {source.sourceType}
                        </Badge>
                      </CardDescription>
                    </div>
                    {getStatusBadge(source.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">URL:</span>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline truncate"
                      >
                        {source.url}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Newspaper className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{source._count.articles}</span>
                      <span className="text-muted-foreground">haber</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Son tarama:</span>
                      <span className="font-medium">{lastCrawl}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
