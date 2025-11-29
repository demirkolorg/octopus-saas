"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Loader2,
  MousePointer2,
  Check,
  RefreshCw,
  List,
  Type,
  Link as LinkIcon,
  Calendar,
  ChevronRight,
  RotateCcw
} from "lucide-react";

// Selector types for the wizard
export interface SelectorsConfig {
  listItem: string;
  title: string;
  link: string;
  date?: string;
  summary?: string;
}

interface VisualSelectorProps {
  onSelectorsConfirmed?: (selectors: SelectorsConfig, url: string) => void;
  initialUrl?: string;
}

type SelectionStep = "listItem" | "title" | "link" | "date" | "complete";

interface StepConfig {
  key: SelectionStep;
  label: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
}

const STEPS: StepConfig[] = [
  {
    key: "listItem",
    label: "Liste Elemanı",
    description: "Bir haber kartına/satırına tıklayın",
    icon: <List className="h-4 w-4" />,
    required: true
  },
  {
    key: "title",
    label: "Başlık",
    description: "Kartın içindeki başlığa tıklayın",
    icon: <Type className="h-4 w-4" />,
    required: true
  },
  {
    key: "link",
    label: "Link",
    description: "Haber linkine tıklayın (genellikle başlıkla aynı)",
    icon: <LinkIcon className="h-4 w-4" />,
    required: true
  },
  {
    key: "date",
    label: "Tarih (Opsiyonel)",
    description: "Tarih alanına tıklayın veya atlayın",
    icon: <Calendar className="h-4 w-4" />,
    required: false
  },
];

// Script to inject into iframe for element selection
const createIframeScript = (mode: SelectionStep, listItemSelector: string | null) => `
(function() {
  // Clean up previous injection
  if (window.__octopusCleanup) {
    window.__octopusCleanup();
  }

  const MODE = '${mode}';
  const LIST_ITEM_SELECTOR = ${listItemSelector ? `'${listItemSelector}'` : 'null'};

  let hoveredElement = null;
  let selectedElement = null;
  const HOVER_STYLE = '2px solid #3b82f6';
  const SELECTED_STYLE = '2px solid #ef4444';
  const SIMILAR_STYLE = '2px solid #eab308';

  const originalStyles = new WeakMap();
  const highlightedSimilar = new Set();

  function saveOriginalStyle(el) {
    if (!originalStyles.has(el)) {
      originalStyles.set(el, {
        outline: el.style.outline,
        outlineOffset: el.style.outlineOffset,
        cursor: el.style.cursor,
        backgroundColor: el.style.backgroundColor
      });
    }
  }

  function restoreOriginalStyle(el) {
    const original = originalStyles.get(el);
    if (original) {
      el.style.outline = original.outline;
      el.style.outlineOffset = original.outlineOffset;
      el.style.cursor = original.cursor;
      el.style.backgroundColor = original.backgroundColor;
    }
  }

  function highlightElement(el, style, bg = null) {
    saveOriginalStyle(el);
    el.style.outline = style;
    el.style.outlineOffset = '2px';
    el.style.cursor = 'pointer';
    if (bg) el.style.backgroundColor = bg;
  }

  function clearAllHighlights() {
    highlightedSimilar.forEach(el => restoreOriginalStyle(el));
    highlightedSimilar.clear();
    if (hoveredElement) restoreOriginalStyle(hoveredElement);
    if (selectedElement) restoreOriginalStyle(selectedElement);
  }

  // CSS Escape polyfill
  function cssEscape(value) {
    if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(value);
    const str = String(value);
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code === 0) { result += '\\\\uFFFD'; continue; }
      if ((code >= 1 && code <= 31) || code === 127 ||
          (i === 0 && code >= 48 && code <= 57) ||
          (i === 1 && code >= 48 && code <= 57 && str.charCodeAt(0) === 45)) {
        result += '\\\\' + code.toString(16) + ' ';
        continue;
      }
      if (i === 0 && str.length === 1 && code === 45) {
        result += '\\\\' + str.charAt(i);
        continue;
      }
      if (code >= 128 || code === 45 || code === 95 ||
          (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
        result += str.charAt(i);
        continue;
      }
      result += '\\\\' + str.charAt(i);
    }
    return result;
  }

  function isUniqueSelector(selector, doc) {
    try { return doc.querySelectorAll(selector).length === 1; }
    catch { return false; }
  }

  function getElementPosition(el) {
    const parent = el.parentElement;
    if (!parent) return el.tagName.toLowerCase();
    const siblings = Array.from(parent.children);
    const sameTag = siblings.filter(s => s.tagName === el.tagName);
    if (sameTag.length === 1) return el.tagName.toLowerCase();
    return el.tagName.toLowerCase() + ':nth-child(' + (siblings.indexOf(el) + 1) + ')';
  }

  function getElementPath(el, stopAt = null) {
    const path = [];
    let current = el;
    while (current && current !== stopAt &&
           current.tagName.toLowerCase() !== 'body' &&
           current.tagName.toLowerCase() !== 'html') {
      const tag = getElementPosition(current);
      const classes = Array.from(current.classList)
        .filter(c => !c.includes(':') && !c.includes('[') && c.trim())
        .slice(0, 2).join('.');
      path.unshift(classes ? tag + '.' + classes : tag);
      current = current.parentElement;
    }
    return path.join(' > ');
  }

  function findUniqueClassSelector(el, doc) {
    const classes = Array.from(el.classList);
    if (!classes.length) return null;

    for (const cls of classes) {
      if (cls.includes(':') || cls.includes('[') || !cls.trim()) continue;
      if (isUniqueSelector('.' + cls, doc)) return '.' + cls;
    }

    const tag = el.tagName.toLowerCase();
    for (const cls of classes) {
      if (cls.includes(':') || cls.includes('[') || !cls.trim()) continue;
      if (isUniqueSelector(tag + '.' + cls, doc)) return tag + '.' + cls;
    }
    return null;
  }

  function generateSelector(el, relativeTo = null) {
    const doc = el.ownerDocument;
    if (!doc) return null;

    // If relative selector requested
    if (relativeTo) {
      return getElementPath(el, relativeTo);
    }

    // Strategy 1: ID
    if (el.id && el.id.trim()) {
      const idSel = '#' + cssEscape(el.id);
      if (isUniqueSelector(idSel, doc)) return idSel;
    }

    // Strategy 2: Unique class
    const classSel = findUniqueClassSelector(el, doc);
    if (classSel) return classSel;

    // Strategy 3: Path
    return getElementPath(el);
  }

  // Find selector that matches multiple similar elements (for list items)
  function findListSelector(el) {
    const doc = el.ownerDocument;
    const candidates = [];

    // Try class-based selectors
    for (const cls of el.classList) {
      if (cls.includes(':') || cls.includes('[') || !cls.trim()) continue;
      const sel = '.' + cls;
      try {
        const count = doc.querySelectorAll(sel).length;
        if (count >= 2 && count <= 100) {
          candidates.push({ selector: sel, count });
        }
      } catch {}
    }

    // Try tag + class
    const tag = el.tagName.toLowerCase();
    for (const cls of el.classList) {
      if (cls.includes(':') || cls.includes('[') || !cls.trim()) continue;
      const sel = tag + '.' + cls;
      try {
        const count = doc.querySelectorAll(sel).length;
        if (count >= 2 && count <= 100) {
          candidates.push({ selector: sel, count });
        }
      } catch {}
    }

    // Sort by count (prefer more matches, but not too many)
    candidates.sort((a, b) => {
      const aScore = Math.abs(a.count - 10);
      const bScore = Math.abs(b.count - 10);
      return aScore - bScore;
    });

    return candidates[0] || { selector: generateSelector(el), count: 1 };
  }

  // Highlight all similar elements
  function highlightSimilarElements(selector) {
    clearAllHighlights();
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        highlightedSimilar.add(el);
        highlightElement(el, SIMILAR_STYLE, 'rgba(234, 179, 8, 0.1)');
      });
      return elements.length;
    } catch {
      return 0;
    }
  }

  // Find the list item parent of an element
  function findListItemParent(el) {
    if (!LIST_ITEM_SELECTOR) return null;
    let current = el;
    while (current && current !== document.body) {
      if (current.matches && current.matches(LIST_ITEM_SELECTOR)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  // Mouse handlers
  document.addEventListener('mouseover', function(e) {
    const target = e.target;
    if (target === document.body || target === document.documentElement) return;

    // In child selection mode, only allow elements inside list items
    if (MODE !== 'listItem' && LIST_ITEM_SELECTOR) {
      const parent = findListItemParent(target);
      if (!parent) return;
    }

    if (target === selectedElement) return;
    if (hoveredElement && hoveredElement !== selectedElement && !highlightedSimilar.has(hoveredElement)) {
      restoreOriginalStyle(hoveredElement);
    }

    hoveredElement = target;
    if (target !== selectedElement) {
      highlightElement(target, HOVER_STYLE);
    }
  }, true);

  document.addEventListener('mouseout', function(e) {
    const target = e.target;
    if (target === selectedElement) return;
    if (target === hoveredElement && !highlightedSimilar.has(target)) {
      restoreOriginalStyle(target);
      hoveredElement = null;
    }
  }, true);

  // Click handler
  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    if (target === document.body || target === document.documentElement) return;

    let selector, count = 1, relativeSelector = null;
    let listItemParent = null;

    if (MODE === 'listItem') {
      // Find a selector that matches multiple items
      const result = findListSelector(target);
      selector = result.selector;
      count = highlightSimilarElements(selector);
    } else if (LIST_ITEM_SELECTOR) {
      // Find the list item parent
      listItemParent = findListItemParent(target);
      if (!listItemParent) {
        window.parent.postMessage({
          type: 'OCTOPUS_ERROR',
          payload: { message: 'Lütfen liste elemanının içinden bir element seçin.' }
        }, '*');
        return;
      }

      // Generate relative selector (relative to list item)
      relativeSelector = generateSelector(target, listItemParent);
      selector = relativeSelector;

      // For links, also get the href attribute check
      if (MODE === 'link' && target.tagName.toLowerCase() === 'a') {
        selector = relativeSelector || 'a';
      }
    } else {
      selector = generateSelector(target);
    }

    if (selectedElement && !highlightedSimilar.has(selectedElement)) {
      restoreOriginalStyle(selectedElement);
    }
    selectedElement = target;
    highlightElement(target, SELECTED_STYLE);

    window.parent.postMessage({
      type: 'OCTOPUS_ELEMENT_SELECTED',
      payload: {
        mode: MODE,
        selector: selector,
        relativeSelector: relativeSelector,
        tagName: target.tagName.toLowerCase(),
        text: (target.textContent || '').trim().substring(0, 100),
        href: target.getAttribute('href') || null,
        matchCount: count
      }
    }, '*');
  }, true);

  // Disable all links
  document.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
  });

  // Cleanup function
  window.__octopusCleanup = function() {
    clearAllHighlights();
  };

  // Re-highlight similar elements if we have a list selector
  if (MODE !== 'listItem' && LIST_ITEM_SELECTOR) {
    highlightSimilarElements(LIST_ITEM_SELECTOR);
  }

  window.parent.postMessage({ type: 'OCTOPUS_INJECTION_COMPLETE' }, '*');
})();
`;

export function VisualSelector({ onSelectorsConfirmed, initialUrl = "" }: VisualSelectorProps) {
  const [url, setUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [currentStep, setCurrentStep] = useState<SelectionStep>("listItem");
  const [matchCount, setMatchCount] = useState(0);
  const [selectors, setSelectors] = useState<Partial<SelectorsConfig>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);
  const currentStepConfig = STEPS.find(s => s.key === currentStep);

  // Inject script when step changes
  const injectScript = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      const script = iframeDoc.createElement("script");
      script.textContent = createIframeScript(currentStep, selectors.listItem || null);
      iframeDoc.body.appendChild(script);
    } catch (err) {
      console.error("Failed to inject script:", err);
    }
  }, [currentStep, selectors.listItem]);

  // Handle messages from iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "OCTOPUS_ELEMENT_SELECTED") {
        const { mode, selector, matchCount: count } = event.data.payload;

        setSelectors(prev => ({ ...prev, [mode]: selector }));
        setMatchCount(count || 1);

      } else if (event.data?.type === "OCTOPUS_INJECTION_COMPLETE") {
        setIsIframeReady(true);
      } else if (event.data?.type === "OCTOPUS_ERROR") {
        setError(event.data.payload.message);
        setTimeout(() => setError(null), 3000);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Re-inject script when step changes
  useEffect(() => {
    if (htmlContent && isIframeReady) {
      injectScript();
    }
  }, [currentStep, htmlContent, isIframeReady, injectScript]);

  const handleIframeLoad = useCallback(() => {
    injectScript();
  }, [injectScript]);

  // Fetch HTML from proxy
  const handleFetchUrl = async () => {
    if (!url) return;

    setIsLoading(true);
    setError(null);
    setHtmlContent(null);
    setSelectors({});
    setCurrentStep("listItem");
    setMatchCount(0);
    setIsIframeReady(false);

    try {
      new URL(url);
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const html = await response.text();
      setHtmlContent(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].key);
      setMatchCount(0);
    } else {
      setCurrentStep("complete");
    }
  };

  const handleSkipStep = () => {
    handleNextStep();
  };

  const handleReset = () => {
    setSelectors({});
    setCurrentStep("listItem");
    setMatchCount(0);
    injectScript();
  };

  const handleConfirm = () => {
    if (selectors.listItem && selectors.title && selectors.link) {
      onSelectorsConfirmed?.(selectors as SelectorsConfig, url);
    }
  };

  const canProceed = selectors[currentStep as keyof SelectorsConfig];
  const isComplete = currentStep === "complete";

  return (
    <div className="space-y-4">
      {/* URL Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Site URL&apos;si
          </CardTitle>
          <CardDescription>
            Haber toplamak istediğiniz sitenin adresini girin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Web Sitesi Adresi</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/haberler"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
                disabled={isLoading}
              />
              <Button onClick={handleFetchUrl} disabled={!url || isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Getir"}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Visual Selector Section */}
      {htmlContent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Iframe - Takes 2 columns */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointer2 className="h-5 w-5" />
                    Görsel Seçici
                  </CardTitle>
                  {currentStepConfig && (
                    <CardDescription className="mt-1">
                      {currentStepConfig.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Sıfırla
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleFetchUrl}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Yenile
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative rounded-lg border bg-white overflow-hidden">
                {!isIframeReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sayfa yükleniyor...
                    </div>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlContent}
                  onLoad={handleIframeLoad}
                  className="w-full h-[500px] border-0"
                  sandbox="allow-same-origin allow-scripts"
                  title="Sayfa Önizleme"
                />
              </div>
            </CardContent>
          </Card>

          {/* Selection Panel - 1 column */}
          <Card>
            <CardHeader>
              <CardTitle>Seçim Adımları</CardTitle>
              <CardDescription>
                Haber yapısını tanımlamak için adımları takip edin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Steps Progress */}
              <div className="space-y-3">
                {STEPS.map((step, index) => {
                  const isActive = step.key === currentStep;
                  const isCompleted = selectors[step.key as keyof SelectorsConfig];
                  const isPast = index < currentStepIndex;

                  return (
                    <div
                      key={step.key}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        isActive
                          ? "border-primary bg-primary/5"
                          : isCompleted
                          ? "border-green-500 bg-green-50"
                          : "border-muted"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          isCompleted
                            ? "bg-green-500 text-white"
                            : isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? <Check className="h-4 w-4" /> : step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isActive ? "text-primary" : ""}`}>
                            {step.label}
                          </span>
                          {!step.required && (
                            <Badge variant="outline" className="text-xs">
                              Opsiyonel
                            </Badge>
                          )}
                        </div>
                        {isCompleted && selectors[step.key as keyof SelectorsConfig] && (
                          <code className="text-xs text-green-700 bg-green-100 px-1 rounded mt-1 block truncate">
                            {selectors[step.key as keyof SelectorsConfig]}
                          </code>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Match Count */}
              {currentStep === "listItem" && matchCount > 0 && (
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800">
                    {matchCount} adet haber bulundu
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Sarı çerçeveli elementler aynı yapıya sahip
                  </p>
                </div>
              )}

              {/* Current Selection Info */}
              {canProceed && !isComplete && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm font-medium">Seçilen Element</p>
                  <code className="text-xs bg-slate-900 text-green-400 p-2 rounded block mt-2 break-all">
                    {selectors[currentStep as keyof SelectorsConfig]}
                  </code>
                </div>
              )}

              {/* Action Buttons */}
              {!isComplete && (
                <div className="flex gap-2">
                  {!currentStepConfig?.required && (
                    <Button variant="outline" onClick={handleSkipStep} className="flex-1">
                      Atla
                    </Button>
                  )}
                  <Button
                    onClick={handleNextStep}
                    disabled={currentStepConfig?.required && !canProceed}
                    className="flex-1"
                  >
                    {currentStepIndex === STEPS.length - 1 ? "Tamamla" : "Devam"}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Complete State */}
              {isComplete && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Seçim tamamlandı!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Seçilen Kurallar:</p>
                    <div className="text-xs space-y-1 font-mono bg-slate-900 text-slate-100 p-3 rounded">
                      <div><span className="text-blue-400">listItem:</span> {selectors.listItem}</div>
                      <div><span className="text-green-400">title:</span> {selectors.title}</div>
                      <div><span className="text-yellow-400">link:</span> {selectors.link}</div>
                      {selectors.date && (
                        <div><span className="text-purple-400">date:</span> {selectors.date}</div>
                      )}
                    </div>
                  </div>

                  <Button onClick={handleConfirm} className="w-full">
                    <Check className="h-4 w-4 mr-2" />
                    Kuralları Onayla
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default VisualSelector;
