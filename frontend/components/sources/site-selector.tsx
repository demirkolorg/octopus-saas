"use client";

import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Loader2, AlertCircle } from "lucide-react";
import { Site } from "@/lib/api";
import { useSites } from "@/hooks/use-sites";
import Link from "next/link";

interface SiteSelectorProps {
  url: string;
  value?: string;
  onChange: (siteId: string, site: Site) => void;
}

export function SiteSelector({ url, value, onChange }: SiteSelectorProps) {
  const { data: sites, isLoading, error } = useSites();

  // Extract domain from URL for auto-selection
  const extractDomain = (urlString: string): string => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  };

  const domain = extractDomain(url);

  // Auto-select site if domain matches
  useEffect(() => {
    if (sites && sites.length > 0 && !value && domain) {
      const matchingSite = sites.find((s) => s.domain === domain);
      if (matchingSite) {
        onChange(matchingSite.id, matchingSite);
      }
    }
  }, [sites, domain, value, onChange]);

  const handleSelectChange = (siteId: string) => {
    const site = sites?.find((s) => s.id === siteId);
    if (site) {
      onChange(siteId, site);
    }
  };

  const selectedSite = sites?.find((s) => s.id === value);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Siteler yukleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        Siteler yuklenirken hata olustu
      </div>
    );
  }

  // No sites available
  if (!sites || sites.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Label>Site (Yayinci) <span className="text-destructive">*</span></Label>
        </div>
        <div className="p-4 border rounded-lg bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Henuz site eklenmemis. Kaynak eklemeden once bir site olusturun.
          </p>
          <Link
            href="/dashboard/sites"
            className="text-sm text-primary hover:underline font-medium"
          >
            Siteler sayfasina git →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Label>Site (Yayinci) <span className="text-destructive">*</span></Label>
        </div>
        <Link
          href="/dashboard/sites"
          className="text-xs text-muted-foreground hover:text-primary"
        >
          Siteleri yonet
        </Link>
      </div>

      <Select value={value || ""} onValueChange={handleSelectChange}>
        <SelectTrigger>
          <SelectValue placeholder="Site secin">
            {selectedSite ? (
              <div className="flex items-center gap-2">
                <span>{selectedSite.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({selectedSite.domain})
                </span>
              </div>
            ) : (
              "Site secin"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sites.map((site) => (
            <SelectItem key={site.id} value={site.id}>
              <div className="flex items-center gap-2">
                <span>{site.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({site.domain})
                </span>
                {site._count?.sources !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    - {site._count.sources} kaynak
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedSite && (
        <p className="text-xs text-muted-foreground">
          Bu kaynak &quot;{selectedSite.name}&quot; sitesine eklenecek
        </p>
      )}
    </div>
  );
}
