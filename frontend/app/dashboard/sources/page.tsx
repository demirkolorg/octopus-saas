'use client';

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { SourceList } from "@/components/sources";

export default function SourcesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kaynaklar</h1>
          <p className="text-sm text-muted-foreground">
            Takip ettiğiniz haber kaynaklarını yönetin
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sources/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Kaynak Ekle
          </Link>
        </Button>
      </div>

      {/* Source List */}
      <SourceList />
    </div>
  );
}
