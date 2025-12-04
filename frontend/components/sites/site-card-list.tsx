'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Site, siteTypeLabels } from '@/lib/api/sites';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';

type SiteCardListProps = {
  sites: Site[];
  onEditSite: (site: Site) => void;
  onDeleteSite: (site: { id: string; name: string }) => void;
};

const getSiteAvatar = (site: Site) => {
  if (site.logoUrl) {
    return (
      <img
        src={site.logoUrl}
        alt={site.name}
        className="w-10 h-10 rounded-lg object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${site.domain}&sz=64`;
        }}
      />
    );
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=64`}
      alt={site.name}
      className="w-10 h-10 rounded-lg object-contain bg-muted p-1"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
        const nextEl = (e.target as HTMLImageElement).nextElementSibling;
        if (nextEl) {
          nextEl.classList.remove('hidden');
        }
      }}
    />
  );
};

export function SiteCardList({ sites, onEditSite, onDeleteSite }: SiteCardListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sites.map((site) => (
        <Card key={site.id} className="group hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {getSiteAvatar(site)}
                <div className="hidden w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {site.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{site.name}</h3>
                  <a
                    href={`https://${site.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary flex-shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {site.domain}
                </p>
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {siteTypeLabels[site.siteType] || 'Diger'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {site._count?.sources || 0} kaynak
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEditSite(site)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDeleteSite({ id: site.id, name: site.name })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}