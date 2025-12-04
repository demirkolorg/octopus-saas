'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Site, siteTypeLabels } from '@/lib/api/sites';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';

type CompactSiteListProps = {
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
        className="w-8 h-8 rounded-md object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${site.domain}&sz=32`;
        }}
      />
    );
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=32`}
      alt={site.name}
      className="w-8 h-8 rounded-md object-contain bg-muted p-0.5"
    />
  );
};

export function CompactSiteList({ sites, onEditSite, onDeleteSite }: CompactSiteListProps) {
  return (
    <div className="border rounded-md">
      <div className="divide-y">
        {sites.map((site) => (
          <div
            key={site.id}
            className="flex items-center p-3 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex-shrink-0 mr-3">{getSiteAvatar(site)}</div>
            <div className="flex-1 grid grid-cols-3 items-center gap-4">
              {/* Name & Domain */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{site.name}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm text-muted-foreground truncate">{site.domain}</p>
                  <a
                    href={`https://${site.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Type & Source Count */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {siteTypeLabels[site.siteType] || 'Diğer'}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {site._count?.sources || 0} kaynak
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="ml-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        ))}
      </div>
    </div>
  );
}
