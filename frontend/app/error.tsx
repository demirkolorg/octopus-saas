'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="text-center px-4">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Bir Hata Oluştu
          </h1>
          <p className="text-slate-500 max-w-md mx-auto mb-4">
            Beklenmeyen bir hata meydana geldi. Lütfen tekrar deneyin veya
            sorun devam ederse destek ekibiyle iletişime geçin.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 font-mono">
              Hata Kodu: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tekrar Dene
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Ana Sayfa
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
