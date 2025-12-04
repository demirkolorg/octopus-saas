'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SourceCard } from './source-card';
import { useSources } from '@/hooks/use-sources';
import { PlusCircle, ChevronDown, ChevronRight, Globe } from 'lucide-react';
import Link from 'next/link';
import { Source } from '@/lib/api/sources';

export type SourceViewMode = 'list' | 'grouped';

interface SiteGroup {
  siteId: string;
  siteName: string;
  domain: string;
  sources: Source[];
}

interface SourceListProps {
  viewMode?: SourceViewMode;
}

export function SourceList({ viewMode = 'list' }: SourceListProps) {
  const { data: sources, isLoading, error } = useSources();
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());

  // Group sources by site
  const groupedSources = useMemo(() => {
    if (!sources) return [];

    const groups: Record<string, SiteGroup> = {};

    sources.forEach((source) => {
      const siteId = source.siteId || 'no-site';
      const siteName = source.site?.name || 'Siteye atanmamış';
      const domain = source.site?.domain || '';

      if (!groups[siteId]) {
        groups[siteId] = {
          siteId,
          siteName,
          domain,
          sources: [],
        };
      }
      groups[siteId].sources.push(source);
    });

    return Object.values(groups).sort((a, b) => a.siteName.localeCompare(b.siteName));
  }, [sources]);

  // Initialize all sites as expanded
  useMemo(() => {
    if (groupedSources.length > 0 && expandedSites.size === 0) {
      setExpandedSites(new Set(groupedSources.map((g) => g.siteId)));
    }
  }, [groupedSources, expandedSites.size]);

  const toggleSite = (siteId: string) => {
    setExpandedSites((prev) => {
      const next = new Set(prev);
      if (next.has(siteId)) {
        next.delete(siteId);
      } else {
        next.add(siteId);
      }
      return next;
    });
  };

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
    <div className="space-y-4">
      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sources.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))}
        </div>
      )}

      {/* Grouped View */}
      {viewMode === 'grouped' && (
        <div className="space-y-4">
          {groupedSources.map((group) => (
            <Card key={group.siteId}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
                onClick={() => toggleSite(group.siteId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedSites.has(group.siteId) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{group.siteName}</CardTitle>
                      {group.domain && (
                        <CardDescription className="text-xs">
                          {group.domain}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {group.sources.length} kaynak
                  </span>
                </div>
              </CardHeader>
              {expandedSites.has(group.siteId) && (
                <CardContent className="pt-0">
                  <div className="grid gap-3 md:grid-cols-2">
                    {group.sources.map((source) => (
                      <SourceCard key={source.id} source={source} />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
