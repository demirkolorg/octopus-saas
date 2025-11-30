import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="text-center px-4">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-100 mb-4">
            <FileQuestion className="h-12 w-12 text-slate-400" />
          </div>
          <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-slate-700 mb-4">
            Sayfa Bulunamadı
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
            Ana sayfaya dönüp tekrar deneyebilirsiniz.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Ana Sayfa
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
