'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateSite, useUpdateSite } from '@/hooks/use-sites';
import { Site, SiteType, siteTypeLabels } from '@/lib/api/sites';
import { Loader2 } from 'lucide-react';

interface SiteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site?: Site | null;
}

export function SiteFormDialog({ open, onOpenChange, site }: SiteFormDialogProps) {
  const createSite = useCreateSite();
  const updateSite = useUpdateSite();
  const isEditing = !!site;

  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [siteType, setSiteType] = useState<SiteType>('OTHER');

  useEffect(() => {
    if (site) {
      setName(site.name);
      setDomain(site.domain);
      setLogoUrl(site.logoUrl || '');
      setSiteType(site.siteType || 'OTHER');
    } else {
      setName('');
      setDomain('');
      setLogoUrl('');
      setSiteType('OTHER');
    }
  }, [site, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: name.trim(),
      domain: domain.trim(),
      logoUrl: logoUrl.trim() || undefined,
      siteType,
    };

    try {
      if (isEditing && site) {
        await updateSite.mutateAsync({ id: site.id, data });
      } else {
        await createSite.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save site:', error);
    }
  };

  const isPending = createSite.isPending || updateSite.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Siteyi Duzenle' : 'Yeni Site Ekle'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Site bilgilerini guncelleyin'
              : 'Kaynaklarinizi gruplayacak yeni bir site ekleyin'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Site Adi *</Label>
            <Input
              id="name"
              placeholder="Hurriyet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Domain *</Label>
            <Input
              id="domain"
              placeholder="hurriyet.com.tr"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              www. oneki olmadan girin (ornek: hurriyet.com.tr)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL (Opsiyonel)</Label>
            <Input
              id="logoUrl"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteType">Site Tipi</Label>
            <Select value={siteType} onValueChange={(value) => setSiteType(value as SiteType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Site tipi secin" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(siteTypeLabels) as SiteType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {siteTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Iptal
            </Button>
            <Button type="submit" disabled={isPending || !name.trim() || !domain.trim()}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Guncelle' : 'Olustur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
