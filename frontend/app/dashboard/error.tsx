'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <CardTitle>Bir Hata Oluştu</CardTitle>
          <CardDescription>
            Bu sayfa yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tekrar Dene
          </Button>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-4 font-mono">
              {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
