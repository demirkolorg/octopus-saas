"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  Eye,
  Loader2,
  AlertCircle,
  ExternalLink,
  Save
} from "lucide-react";
import Link from "next/link";
import { VisualSelector, SelectorsConfig } from "@/components/visual-selector/VisualSelector";

type Step = "selector" | "config" | "preview" | "confirm";

interface SourceConfig {
  url: string;
  name: string;
  selectors: SelectorsConfig | null;
  refreshInterval: number;
}

interface PreviewItem {
  title: string;
  link: string;
  date?: string;
  summary?: string;
}

interface PreviewResult {
  success: boolean;
  items: PreviewItem[];
  totalFound: number;
  error?: string;
}

export default function NewSourcePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("selector");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [config, setConfig] = useState<SourceConfig>({
    url: "",
    name: "",
    selectors: null,
    refreshInterval: 900,
  });

  const handleSelectorsConfirmed = (selectors: SelectorsConfig, url: string) => {
    setConfig((prev) => ({ ...prev, selectors, url }));
    setStep("config");
  };

  const handlePreview = async () => {
    if (!config.selectors || !config.url) return;

    setIsLoading(true);
    setError(null);
    setPreviewResult(null);

    try {
      const response = await fetch("/api/sources/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: config.url,
          selectors: config.selectors,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Önizleme başarısız");
      }

      setPreviewResult(result);

      if (result.success) {
        setStep("preview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.selectors || !config.url || !config.name) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: config.name,
          url: config.url,
          selectors: config.selectors,
          refreshInterval: config.refreshInterval,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Kaydetme başarısız");
      }

      // Success - redirect to sources list
      router.push("/dashboard/sources?success=created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { key: "selector", label: "Element Seç" },
    { key: "config", label: "Yapılandır" },
    { key: "preview", label: "Önizle" },
    { key: "confirm", label: "Kaydet" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/sources">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yeni Kaynak Ekle</h1>
          <p className="text-sm text-muted-foreground">
            Takip etmek istediğiniz haber sitesini ekleyin
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, index) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index < currentStepIndex
                  ? "bg-primary text-primary-foreground"
                  : index === currentStepIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index < currentStepIndex ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
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

      {/* Step 1: Visual Selector */}
      {step === "selector" && (
        <VisualSelector
          onSelectorsConfirmed={handleSelectorsConfirmed}
          initialUrl={config.url}
        />
      )}

      {/* Step 2: Configuration */}
      {step === "config" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Kaynak Yapılandırması
            </CardTitle>
            <CardDescription>
              Kaynağınız için isim ve tarama ayarlarını belirleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Kaynak Adı</Label>
              <Input
                id="name"
                placeholder="Örn: Hürriyet Teknoloji"
                value={config.name}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Bu kaynağı tanımlamak için bir isim verin
              </p>
            </div>

            <div className="space-y-2">
              <Label>URL</Label>
              <p className="text-sm font-mono bg-muted p-2 rounded truncate">
                {config.url}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Seçilen Kurallar</Label>
              <div className="text-xs space-y-1 font-mono bg-slate-900 text-slate-100 p-3 rounded">
                <div><span className="text-blue-400">listItem:</span> {config.selectors?.listItem}</div>
                <div><span className="text-green-400">title:</span> {config.selectors?.title}</div>
                <div><span className="text-yellow-400">link:</span> {config.selectors?.link}</div>
                {config.selectors?.date && (
                  <div><span className="text-purple-400">date:</span> {config.selectors.date}</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval">Tarama Sıklığı</Label>
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

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("selector")}>
                Geri
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!config.name || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Test Et ve Önizle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview Results */}
      {step === "preview" && previewResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Önizleme Sonuçları
            </CardTitle>
            <CardDescription>
              {previewResult.totalFound} haber bulundu, ilk 5 tanesi gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewResult.success ? (
              <div className="space-y-3">
                {previewResult.items.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2">
                          {item.title || "(Başlık bulunamadı)"}
                        </h3>
                        {item.date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.date}
                          </p>
                        )}
                        {item.summary && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {item.summary}
                          </p>
                        )}
                      </div>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">
                  {previewResult.error || "Önizleme başarısız"}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("config")}>
                Geri
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                disabled={!previewResult.success}
                className="flex-1"
              >
                Devam Et
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirmation */}
      {step === "confirm" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Kaynağı Onayla
            </CardTitle>
            <CardDescription>
              Ayarlarınızı kontrol edin ve kaynağı kaydedin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kaynak Adı</span>
                <span className="text-sm font-medium">{config.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">URL</span>
                <span className="text-sm font-medium truncate max-w-[300px]">
                  {config.url}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Bulunan Haber</span>
                <span className="text-sm font-medium">
                  {previewResult?.totalFound || 0} adet
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tarama Sıklığı</span>
                <span className="text-sm font-medium">
                  {config.refreshInterval / 60} dakika
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Seçilen Kurallar</Label>
              <div className="text-xs space-y-1 font-mono bg-slate-900 text-slate-100 p-3 rounded">
                <div><span className="text-blue-400">listItem:</span> {config.selectors?.listItem}</div>
                <div><span className="text-green-400">title:</span> {config.selectors?.title}</div>
                <div><span className="text-yellow-400">link:</span> {config.selectors?.link}</div>
                {config.selectors?.date && (
                  <div><span className="text-purple-400">date:</span> {config.selectors.date}</div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("preview")}>
                Geri
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Kaynağı Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
