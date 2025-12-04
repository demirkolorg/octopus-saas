"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Rss,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  MousePointerClick,
  Check,
  ChevronRight,
  Settings,
  Eye,
  Save,
} from "lucide-react";
import { SiteSelector } from "@/components/sources/site-selector";
import { CategorySelector } from "@/components/sources/category-selector";
import { Site } from "@/lib/api/sites";
import { Category } from "@/lib/api/categories";
import { ContentSelectorDialog } from "@/components/sources/content-selector-dialog";
import { api } from "@/lib/api/client";

type RssStep = "url" | "config" | "preview" | "confirm";

interface RssPreviewItem {
  title: string;
  link: string;
  pubDate?: string;
  summary?: string;
  imageUrl?: string;
  hasFullContent: boolean;
}

interface RssPreviewResult {
  valid: boolean;
  feedUrl: string;
  metadata: {
    title?: string;
    description?: string;
    link?: string;
    language?: string;
    imageUrl?: string | string[];
  };
  sampleItems: RssPreviewItem[];
  itemCount: number;
  error?: string;
}

interface RssSourceConfig {
  feedUrl: string;
  url: string;
  name: string;
  refreshInterval: number;
  enrichContent: boolean;
  contentSelector?: string;
  siteId?: string;
  categoryId?: string;
  site?: Site;
  category?: Category;
}

interface RssSourceFormProps {
  onSave: (config: RssSourceConfig, metadata: RssPreviewResult["metadata"]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const steps = [
  { key: "url", label: "RSS URL", icon: Rss },
  { key: "config", label: "Yapılandır", icon: Settings },
  { key: "preview", label: "Önizle", icon: Eye },
  { key: "confirm", label: "Kaydet", icon: Save },
];

export function RssSourceForm({ onSave, onCancel, isLoading }: RssSourceFormProps) {
  const [step, setStep] = useState<RssStep>("url");
  const [feedUrl, setFeedUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<RssPreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<RssSourceConfig>({
    feedUrl: "",
    url: "",
    name: "",
    refreshInterval: 900,
    enrichContent: false,
  });

  // Content selector dialog state
  const [contentSelectorOpen, setContentSelectorOpen] = useState(false);
  const [selectedDetailUrl, setSelectedDetailUrl] = useState<string | null>(null);

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  const handlePreview = async () => {
    if (!feedUrl.trim()) return;

    setPreviewLoading(true);
    setError(null);
    setPreviewResult(null);

    try {
      const response = await fetch("/api/sources/preview-rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedUrl }),
      });

      const result: RssPreviewResult = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Onizleme basarisiz");
      }

      setPreviewResult(result);

      if (result.valid) {
        // Auto-fill config from metadata
        setConfig((prev) => ({
          ...prev,
          feedUrl,
          url: result.metadata.link || feedUrl,
          name: result.metadata.title || "",
        }));
        // Move to next step
        setStep("config");
      } else {
        setError(result.error || "Gecersiz RSS feed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata olustu");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = () => {
    if (!previewResult?.valid || !config.siteId) return;

    // Generate name from site + category if not set
    const finalName = config.name ||
      (config.site && config.category
        ? `${config.site.name} - ${config.category.name}`
        : config.site?.name || "RSS Kaynak");

    // Only send fields that backend expects (exclude site/category objects)
    onSave({
      feedUrl: config.feedUrl,
      url: config.url,
      name: finalName,
      refreshInterval: config.refreshInterval,
      enrichContent: config.enrichContent,
      contentSelector: config.contentSelector,
      siteId: config.siteId,
      categoryId: config.categoryId,
    }, previewResult.metadata);
  };

  const handleOpenContentSelector = (detailUrl: string) => {
    setSelectedDetailUrl(detailUrl);
    setContentSelectorOpen(true);
  };

  const handleContentSelectorConfirmed = (selector: string) => {
    setConfig((prev) => ({ ...prev, contentSelector: selector }));
  };

  const getImageUrl = (imageUrl: string | string[] | undefined): string | undefined => {
    if (!imageUrl) return undefined;
    return Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;
  };

  const generatedName = config.site && config.category
    ? `${config.site.name} - ${config.category.name}`
    : config.site?.name || config.name || "RSS Kaynak";

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, index) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index < currentStepIndex
                  ? "bg-orange-500 text-white"
                  : index === currentStepIndex
                  ? "bg-orange-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index < currentStepIndex ? (
                <Check className="h-4 w-4" />
              ) : (
                <s.icon className="h-4 w-4" />
              )}
            </div>
            <span
              className={`ml-2 text-sm ${
                index === currentStepIndex
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {index < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 mx-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Step 1: RSS URL */}
      {step === "url" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rss className="h-5 w-5 text-orange-500" />
              RSS Feed URL
            </CardTitle>
            <CardDescription>
              Haber sitesinin RSS feed adresini girin ve dogrulayin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedUrl">Feed URL</Label>
              <div className="flex gap-2">
                <Input
                  id="feedUrl"
                  placeholder="https://example.com/rss/feed"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePreview()}
                  className="flex-1"
                />
                <Button
                  onClick={handlePreview}
                  disabled={!feedUrl.trim() || previewLoading}
                >
                  {previewLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">Dogrula</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Ornek: https://www.ntv.com.tr/gundem.rss
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={onCancel}>
                Iptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Configuration */}
      {step === "config" && previewResult?.valid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Kaynak Ayarlari
            </CardTitle>
            <CardDescription>
              Site, kategori ve tarama ayarlarini belirleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Feed Info Summary */}
            <div className="rounded-lg border p-3 bg-orange-50/50">
              <div className="flex items-start gap-3">
                {getImageUrl(previewResult.metadata.imageUrl) && (
                  <img
                    src={getImageUrl(previewResult.metadata.imageUrl)}
                    alt="Feed logo"
                    className="w-10 h-10 rounded object-contain bg-white"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{previewResult.metadata.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {config.feedUrl}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    {previewResult.itemCount} haber bulundu
                  </p>
                </div>
              </div>
            </div>

            {/* Site Selection */}
            <SiteSelector
              url={config.url}
              value={config.siteId}
              onChange={(siteId, site) =>
                setConfig((prev) => ({
                  ...prev,
                  siteId,
                  site,
                  categoryId: undefined,
                  category: undefined,
                }))
              }
            />

            {/* Category Selection */}
            <CategorySelector
              value={config.categoryId}
              onChange={(categoryId, category) =>
                setConfig((prev) => ({ ...prev, categoryId, category }))
              }
            />

            {/* Refresh Interval */}
            <div className="space-y-2">
              <Label htmlFor="interval">Tarama Sikligi</Label>
              <select
                id="interval"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={config.refreshInterval}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    refreshInterval: Number(e.target.value),
                  }))
                }
              >
                <option value={300}>Her 5 dakika</option>
                <option value={900}>Her 15 dakika</option>
                <option value={1800}>Her 30 dakika</option>
                <option value={3600}>Her 1 saat</option>
                <option value={7200}>Her 2 saat</option>
                <option value={21600}>Her 6 saat</option>
                <option value={86400}>Her 24 saat</option>
              </select>
            </div>

            {/* Content Enrichment */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="enrich">Icerik Zenginlestirme</Label>
                <p className="text-sm text-muted-foreground">
                  RSS ozet iceriyorsa, detay sayfasindan tam icerigi cek
                </p>
              </div>
              <Switch
                id="enrich"
                checked={config.enrichContent}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, enrichContent: checked }))
                }
              />
            </div>

            {/* Content Selector (only if enrichment enabled) */}
            {config.enrichContent && (
              <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <Label>Icerik Alani Secici</Label>

                {/* Show selected selector if exists */}
                {config.contentSelector ? (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200 space-y-2">
                    <p className="text-xs font-medium text-green-800 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Secilen Alan
                    </p>
                    <code className="text-[10px] bg-slate-900 text-green-400 p-2 rounded block break-all">
                      {config.contentSelector}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        if (previewResult?.sampleItems[0]?.link) {
                          handleOpenContentSelector(previewResult.sampleItems[0].link);
                        }
                      }}
                      disabled={!previewResult?.sampleItems[0]?.link}
                    >
                      <MousePointerClick className="h-3 w-3 mr-1" />
                      Yeniden Sec
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Asagidaki haberlerden birini secin ve icerik alanini belirleyin
                    </p>
                    <div className="space-y-2">
                      {previewResult?.sampleItems.slice(0, 3).map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2 rounded-lg border bg-background hover:border-orange-300 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0 text-xs"
                            onClick={() => handleOpenContentSelector(item.link)}
                          >
                            <MousePointerClick className="h-3 w-3 mr-1" />
                            Sec
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Validation message */}
            {!config.siteId && (
              <p className="text-xs text-amber-600">
                Devam etmek icin site secmelisiniz
              </p>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("url")}>
                Geri
              </Button>
              <Button
                onClick={() => setStep("preview")}
                disabled={!config.siteId}
                className="flex-1"
              >
                Devam Et
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && previewResult?.valid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Onizleme
            </CardTitle>
            <CardDescription>
              {previewResult.itemCount} haber bulundu, ilk 5 tanesi gosteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sample Items */}
            <div className="space-y-3">
              {previewResult.sampleItems.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded object-cover bg-muted flex-shrink-0"
                    />
                  )}
                  {!item.imageUrl && (
                    <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium line-clamp-2">
                      {item.title}
                    </h5>
                    {item.pubDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.pubDate).toLocaleString("tr-TR")}
                      </p>
                    )}
                    {item.summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {item.hasFullContent ? (
                        <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded">
                          Tam Icerik
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded">
                          Ozet
                        </span>
                      )}
                      {config.enrichContent && !item.hasFullContent && (
                        <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">
                          Zenginlestirilecek
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("config")}>
                Geri
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                className="flex-1"
              >
                Devam Et
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirm */}
      {step === "confirm" && previewResult?.valid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Kaynagi Onayla
            </CardTitle>
            <CardDescription>
              Ayarlarinizi kontrol edin ve kaynaği kaydedin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kaynak Adi</span>
                <span className="text-sm font-medium">{generatedName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tip</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Rss className="h-3 w-3 text-orange-500" />
                  RSS Feed
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Feed URL</span>
                <span className="text-sm font-medium truncate max-w-[250px]">
                  {config.feedUrl}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Site</span>
                <span className="text-sm font-medium">
                  {config.site?.name || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Kategori</span>
                <span className="text-sm font-medium flex items-center gap-2">
                  {config.category?.color && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: config.category.color }}
                    />
                  )}
                  {config.category?.name || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Bulunan Haber</span>
                <span className="text-sm font-medium">
                  {previewResult.itemCount} adet
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tarama Sikligi</span>
                <span className="text-sm font-medium">
                  {config.refreshInterval / 60} dakika
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Icerik Zenginlestirme</span>
                <span className="text-sm font-medium">
                  {config.enrichContent ? "Aktif" : "Kapali"}
                </span>
              </div>
              {config.enrichContent && config.contentSelector && (
                <div className="pt-2 border-t">
                  <span className="text-sm text-muted-foreground block mb-1">Icerik Secici</span>
                  <code className="text-xs bg-slate-900 text-green-400 p-2 rounded block break-all">
                    {config.contentSelector}
                  </code>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("preview")}>
                Geri
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                RSS Kaynagini Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Selector Dialog */}
      {selectedDetailUrl && (
        <ContentSelectorDialog
          open={contentSelectorOpen}
          onOpenChange={setContentSelectorOpen}
          detailUrl={selectedDetailUrl}
          onSelectorConfirmed={handleContentSelectorConfirmed}
        />
      )}
    </div>
  );
}
