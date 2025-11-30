'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SourceCard } from './source-card';
import { useSources } from '@/hooks/use-sources';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export function SourceList() {
  const { data: sources, isLoading, error } = useSources();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Kaynaklar yüklenirken bir hata oluştu.</p>
        <p className="text-sm mt-2">{(error as Error).message}</p>
      </div>
    );
  }

  if (!sources || sources.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>Henüz kaynak eklemediniz</CardTitle>
          <CardDescription>
            Haber toplamaya başlamak için ilk kaynağınızı ekleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button asChild>
            <Link href="/dashboard/sources/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              İlk Kaynağı Ekle
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sources.map((source) => (
        <SourceCard key={source.id} source={source} />
      ))}
    </div>
  );
}
