"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MousePointerClick, Rss } from "lucide-react";

export type SourceType = "SELECTOR" | "RSS";

interface SourceTypeSelectorProps {
  value?: SourceType;
  onChange: (type: SourceType) => void;
}

export function SourceTypeSelector({
  value,
  onChange,
}: SourceTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* CSS Selector Option */}
      <Card
        className={`cursor-pointer transition-all hover:border-primary/50 ${
          value === "SELECTOR"
            ? "border-primary ring-2 ring-primary/20"
            : "border-border"
        }`}
        onClick={() => onChange("SELECTOR")}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-lg ${
                value === "SELECTOR"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <MousePointerClick className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">CSS/XPath Selector</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Haber sitesindeki elementleri gorsel olarak secin. Herhangi bir
                web sayfasindan haber cekilebilir.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  Esnek
                </span>
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  Tum siteler
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RSS Option */}
      <Card
        className={`cursor-pointer transition-all hover:border-orange-500/50 ${
          value === "RSS"
            ? "border-orange-500 ring-2 ring-orange-500/20"
            : "border-border"
        }`}
        onClick={() => onChange("RSS")}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-lg ${
                value === "RSS"
                  ? "bg-orange-500/10 text-orange-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Rss className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">RSS Feed</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sitenin RSS/Atom feed adresini girin. Otomatik format algilama
                ve iceri zenginlestirme destegi.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-1 rounded">
                  Hizli
                </span>
                <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-1 rounded">
                  Kolay
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
