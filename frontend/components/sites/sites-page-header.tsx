'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List } from 'lucide-react';
import { siteTypeLabels } from '@/lib/api/sites';
import type { SiteType } from '@/lib/api/sites';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SitesPageHeaderProps = {
  onAddSite: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  selectedType: SiteType | 'all';
  onSelectedTypeChange: (type: SiteType | 'all') => void;
};

const siteTypes = Object.keys(siteTypeLabels) as SiteType[];

export function SitesPageHeader({
  onAddSite,
  viewMode,
  onViewModeChange,
  selectedType,
  onSelectedTypeChange,
}: SitesPageHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Siteler</h1>
          <p className="text-muted-foreground">
            Haber kaynaklarınızı gruplayacak siteleri yönetin
          </p>
        </div>
        <Button onClick={onAddSite}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Yeni Site Ekle
        </Button>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        {/* Type Filter */}
        <Tabs
          value={selectedType}
          onValueChange={(value) => onSelectedTypeChange(value as SiteType | 'all')}
        >
          <TabsList>
            <TabsTrigger value="all">Tümü</TabsTrigger>
            {siteTypes.map((type) => (
              <TabsTrigger key={type} value={type}>
                {siteTypeLabels[type]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onViewModeChange('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
