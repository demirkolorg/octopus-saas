"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { VisualSelector } from "@/components/visual-selector/VisualSelector";

type Step = "selector" | "config" | "confirm";

interface SourceConfig {
  url: string;
  name: string;
  selector: string;
  refreshInterval: number;
}

export default function NewSourcePage() {
  const [step, setStep] = useState<Step>("selector");
  const [config, setConfig] = useState<SourceConfig>({
    url: "",
    name: "",
    selector: "",
    refreshInterval: 900, // 15 minutes default
  });

  const handleSelectorSelected = (selector: string, url: string) => {
    setConfig((prev) => ({ ...prev, selector, url }));
  };

  const handleNextStep = () => {
    if (step === "selector" && config.selector) {
      setStep("config");
    } else if (step === "config" && config.name) {
      setStep("confirm");
    }
  };

  const handlePrevStep = () => {
    if (step === "config") {
      setStep("selector");
    } else if (step === "confirm") {
      setStep("config");
    }
  };

  const handleSaveSource = async () => {
    // TODO: Backend API'ye kaydet
    console.log("Saving source:", config);
    // Redirect to sources list after save
  };

  const steps = [
    { key: "selector", label: "Element Seç" },
    { key: "config", label: "Yapılandır" },
    { key: "confirm", label: "Onayla" },
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

      {/* Step 1: Visual Selector */}
      {step === "selector" && (
        <div className="space-y-4">
          <VisualSelector
            onSelectorSelected={handleSelectorSelected}
            initialUrl={config.url}
          />

          {config.selector && (
            <div className="flex justify-end">
              <Button onClick={handleNextStep}>
                Devam Et
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
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
              <Label htmlFor="selector">CSS Seçici</Label>
              <code className="block text-sm bg-slate-900 text-green-400 p-3 rounded font-mono">
                {config.selector}
              </code>
              <p className="text-xs text-muted-foreground">
                Önceki adımda seçtiğiniz element için oluşturulan seçici
              </p>
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
              <p className="text-xs text-muted-foreground">
                Yeni haberler için ne sıklıkta kontrol edilsin
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handlePrevStep}>
                Geri
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!config.name}
                className="flex-1"
              >
                Devam Et
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirmation */}
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
                  {config.url || "Belirlenmedi"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">CSS Seçici</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {config.selector}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tarama Sıklığı</span>
                <span className="text-sm font-medium">
                  {config.refreshInterval / 60} dakika
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handlePrevStep}>
                Geri
              </Button>
              <Button onClick={handleSaveSource} className="flex-1">
                <Check className="mr-2 h-4 w-4" />
                Kaynağı Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
