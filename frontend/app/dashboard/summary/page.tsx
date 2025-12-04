'use client';

import { useState } from 'react';
import { format, subDays, addDays, startOfDay, isToday, isFuture } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  Loader2,
  FileText,
  BarChart3,
  Newspaper,
} from 'lucide-react';
import {
  useDailySummary,
  useGenerateDailySummary,
  useGeneratePartialSummary,
} from '@/hooks/use-daily-summary';
import { CategoryStat, SourceStat, BulletPoint } from '@/lib/api/daily-summary';

export default function SummaryPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const isSelectedToday = isToday(selectedDate);

  const { data: summary, isLoading, refetch } = useDailySummary(dateStr);
  const generateMutation = useGenerateDailySummary();
  const generatePartialMutation = useGeneratePartialSummary();

  const goToPreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const goToNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    if (!isFuture(nextDay)) {
      setSelectedDate(nextDay);
    }
  };

  const goToToday = () => {
    setSelectedDate(startOfDay(new Date()));
  };

  const handleGenerateSummary = async () => {
    if (isSelectedToday) {
      await generatePartialMutation.mutateAsync();
    } else {
      await generateMutation.mutateAsync(dateStr);
    }
    refetch();
  };

  const isGenerating = generateMutation.isPending || generatePartialMutation.isPending;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Günlük Özet</h1>
          <p className="text-muted-foreground">
            Günün haberlerinin AI tarafından oluşturulan özeti
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousDay}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={goToToday}
            className="min-w-[160px]"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {format(selectedDate, 'd MMMM yyyy', { locale: tr })}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextDay}
            disabled={isToday(selectedDate)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Generate Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {summary
                    ? `Son güncelleme: ${format(new Date(summary.generatedAt), 'HH:mm', { locale: tr })}`
                    : 'Henüz özet oluşturulmamış'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isSelectedToday
                    ? 'Şu ana kadar olan haberlerin özetini oluştur'
                    : 'Bu günün tüm haberlerinin özetini oluştur'}
                </p>
              </div>
            </div>
            <Button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {summary ? 'Yeniden Oluştur' : 'Özet Oluştur'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Summary State */}
      {!isLoading && !summary && (
        <Card className="py-12">
          <CardContent className="text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Özet Bulunamadı</h3>
            <p className="text-muted-foreground mb-4">
              {isSelectedToday
                ? 'Bugün için henüz bir özet oluşturulmamış'
                : 'Bu tarih için özet bulunmuyor'}
            </p>
            <Button onClick={handleGenerateSummary} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Özet Oluştur
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Content */}
      {!isLoading && summary && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Summary */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Günün Özeti
                  </CardTitle>
                  <CardDescription>
                    {summary.articleCount} haber analiz edildi
                  </CardDescription>
                </div>
                {summary.isPartial && (
                  <Badge variant="secondary">Kısmi Özet</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {summary.summary.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Bullet Points */}
              {summary.bulletPoints && summary.bulletPoints.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Newspaper className="h-4 w-4" />
                    Öne Çıkan Haberler
                  </h4>
                  <ul className="space-y-3">
                    {summary.bulletPoints.map((point: BulletPoint, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <Badge variant="outline" className="shrink-0 mt-0.5">
                          {point.category}
                        </Badge>
                        <span className="text-sm">{point.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* Top Categories */}
            {summary.topCategories && summary.topCategories.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Kategori Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary.topCategories.slice(0, 6).map((cat: CategoryStat, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {cat.color && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                          )}
                          <span className="text-sm">{cat.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {cat.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Sources */}
            {summary.topSources && summary.topSources.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Newspaper className="h-4 w-4" />
                    En Aktif Kaynaklar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary.topSources.slice(0, 6).map((source: SourceStat, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm truncate max-w-[150px]">
                          {source.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {source.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
