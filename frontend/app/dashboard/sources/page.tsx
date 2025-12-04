'use client';

import { useState } from "react";
import { SourceList, SourceViewMode } from "@/components/sources";
import { ActivityLog } from "@/components/crawler";
import { Button } from "@/components/ui/button";
import { List, LayoutGrid } from "lucide-react";

export default function SourcesPage() {
  const [viewMode, setViewMode] = useState<SourceViewMode>('list');

  return (
    <div className="h-full flex gap-6">
      {/* Left Column - Sources */}
      <div className="flex-1 min-w-0 overflow-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kaynaklar</h1>
            <p className="text-sm text-muted-foreground">
              Takip ettiğiniz haber kaynaklarını yönetin
            </p>
          </div>
          <div className="inline-flex rounded-md border" role="group">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4 mr-2" />
              Liste
            </Button>
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grouped')}
              className="rounded-l-none"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Site Bazlı
            </Button>
          </div>
        </div>

        {/* Source List */}
        <SourceList viewMode={viewMode} />
      </div>

      {/* Right Column - Activity Log */}
      <div className="w-80 flex-shrink-0 hidden lg:block">
        <div className="sticky top-0 h-[calc(100vh-8rem)]">
          <ActivityLog />
        </div>
      </div>
    </div>
  );
}
