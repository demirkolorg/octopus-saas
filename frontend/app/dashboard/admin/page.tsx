'use client';

import { useSystemStatus } from '@/hooks/use-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Users,
  Rss,
  Newspaper,
  Globe,
  Tag,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  ArrowRight,
  Server,
} from 'lucide-react';

export default function AdminPage() {
  const { data: status, isLoading, error } = useSystemStatus();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Sistem durumu yüklenirken hata oluştu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Paneli</h1>
          <p className="text-muted-foreground">Sistem durumu ve yönetimi</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Activity className="h-3 w-3" />
          Canlı
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Kullanıcılar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{status?.users.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Rss className="h-4 w-4" />
              Kaynaklar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{status?.sources.total}</div>
            <p className="text-xs text-muted-foreground">
              {status?.sources.system} sistem, {status?.sources.active} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              Haberler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{status?.articles.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Bugün: +{status?.articles.today}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Siteler / Kategoriler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {status?.sites.total} / {status?.categories.total}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crawl Job Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tarama İşleri</CardTitle>
          <CardDescription>Crawler durumu ve son işlemler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{status?.crawlJobs.pending}</div>
                <div className="text-xs text-muted-foreground">Bekliyor</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10">
              <PlayCircle className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{status?.crawlJobs.running}</div>
                <div className="text-xs text-muted-foreground">Çalışıyor</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{status?.crawlJobs.completed}</div>
                <div className="text-xs text-muted-foreground">Tamamlandı</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{status?.crawlJobs.failed}</div>
                <div className="text-xs text-muted-foreground">Başarısız</div>
              </div>
            </div>
          </div>

          {/* Recent Jobs */}
          {status?.crawlJobs.recent && status.crawlJobs.recent.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Son İşlemler</h4>
              <div className="space-y-1">
                {status.crawlJobs.recent.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between py-2 px-3 rounded bg-muted/50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          job.status === 'COMPLETED'
                            ? 'default'
                            : job.status === 'FAILED'
                            ? 'destructive'
                            : job.status === 'RUNNING'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {job.status}
                      </Badge>
                      <span className="font-medium">{job.source.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {job.itemsInserted > 0 && `+${job.itemsInserted} haber`}
                      {job.errorMessage && (
                        <span className="text-red-500 ml-2">{job.errorMessage.slice(0, 30)}...</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Kullanıcı Yönetimi
            </CardTitle>
            <CardDescription>Kullanıcıları görüntüle, rol değiştir veya sil</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/admin/users">
                Kullanıcıları Yönet
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Rss className="h-5 w-5" />
              Sistem Kaynakları
            </CardTitle>
            <CardDescription>Tüm kullanıcılara açık sistem kaynaklarını yönet</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/admin/system">
                Sistem Kaynaklarını Görüntüle
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
