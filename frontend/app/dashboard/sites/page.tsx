'use client';

import { useState, useMemo } from 'react';
import { useSites, useDeleteSite } from '@/hooks/use-sites';
import { Site, SiteType, siteTypeLabels } from '@/lib/api/sites';
import { SitesPageHeader } from '@/components/sites/sites-page-header';
import { SiteCardList } from '@/components/sites/site-card-list';
import { CompactSiteList } from '@/components/sites/compact-site-list';
import { SiteFormDialog } from '@/components/sites/site-form-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function SitesPage() {
  const { data: sites, isLoading, error } = useSites();
  const deleteSite = useDeleteSite();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedType, setSelectedType] = useState<SiteType | 'all'>('all');
  const [siteFormOpen, setSiteFormOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const handleAddSite = () => {
    setEditingSite(null);
    setSiteFormOpen(true);
  };

  const handleEditSite = (site: Site) => {
    setEditingSite(site);
    setSiteFormOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    deleteSite.mutate(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const filteredSites = useMemo(() => {
    if (!sites) return [];
    if (selectedType === 'all') {
      return sites;
    }
    return sites.filter((site) => site.siteType === selectedType);
  }, [sites, selectedType]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>Siteler yüklenirken bir hata oluştu.</p>
          <p className="text-sm mt-2">{(error as Error).message}</p>
        </div>
      );
    }

    if (!sites || sites.length === 0) {
      return (
        <Card className="border-dashed mt-6">
          <CardHeader className="text-center">
            <CardTitle>Henüz site eklemediniz</CardTitle>
            <CardDescription>
              Haber kaynaklarınızı organize etmek için site ekleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button onClick={handleAddSite}>
              <PlusCircle className="mr-2 h-4 w-4" />
              İlk Siteyi Ekle
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (filteredSites.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>Seçili filtrelere uygun site bulunamadı.</p>
        </div>
      );
    }

    return viewMode === 'grid' ? (
      <SiteCardList
        sites={filteredSites}
        onEditSite={handleEditSite}
        onDeleteSite={setDeleteConfirm}
      />
    ) : (
      <CompactSiteList
        sites={filteredSites}
        onEditSite={handleEditSite}
        onDeleteSite={setDeleteConfirm}
      />
    );
  };

  return (
    <div className="h-full flex flex-col">
      <SitesPageHeader
        onAddSite={handleAddSite}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedType={selectedType}
        onSelectedTypeChange={setSelectedType}
      />
      <div className="flex-1 min-h-0 overflow-auto pt-6">{renderContent()}</div>

      {/* Site Form Dialog */}
      <SiteFormDialog
        open={siteFormOpen}
        onOpenChange={setSiteFormOpen}
        site={editingSite}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silme Onayı</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteConfirm?.name}&quot; sitesini silmek istediğinize emin misiniz? Bu
              işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
