"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Loader2,
  Check,
  RefreshCw,
  List,
  Type,
  Calendar,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  FileText,
  Image,
  AlignLeft
} from "lucide-react";

// Selector types for the wizard
export interface SelectorsConfig {
  listItem: string;   // Liste sayfasında tekrar eden haber kartları
  title: string;      // Detay sayfasında başlık
  date: string;       // Detay sayfasında tarih
  content: string;    // Detay sayfasında içerik
  summary: string;    // Detay sayfasında özet
  image: string;      // Detay sayfasında görsel
}

interface VisualSelectorProps {
  onSelectorsConfirmed?: (selectors: SelectorsConfig, url: string) => void;
  initialUrl?: string;
}

type Phase = "list" | "detail";
type ListStep = "listItem";
type DetailStep = "title" | "date" | "content" | "summary" | "image";
type SelectionStep = ListStep | DetailStep | "complete";

interface StepConfig {
  key: SelectionStep;
  label: string;
  description: string;
  icon: React.ReactNode;
  phase: Phase;
}

const STEPS: StepConfig[] = [
  // Liste sayfası - sadece 1 adım
  {
    key: "listItem",
    label: "Haber Kartı",
    description: "Bir haber kartına tıklayın (link otomatik bulunacak)",
    icon: <List className="h-4 w-4" />,
    phase: "list"
  },
  // Detay sayfası - 5 adım (hepsi zorunlu)
  {
    key: "title",
    label: "Başlık",
    description: "Haber başlığına tıklayın",
    icon: <Type className="h-4 w-4" />,
    phase: "detail"
  },
  {
    key: "date",
    label: "Tarih",
    description: "Yayın tarihine tıklayın",
    icon: <Calendar className="h-4 w-4" />,
    phase: "detail"
  },
  {
    key: "content",
    label: "İçerik",
    description: "Haber içeriğine tıklayın",
    icon: <FileText className="h-4 w-4" />,
    phase: "detail"
  },
  {
    key: "summary",
    label: "Özet",
    description: "Haber özetine/spot'una tıklayın",
    icon: <AlignLeft className="h-4 w-4" />,
    phase: "detail"
  },
  {
    key: "image",
    label: "Görsel",
    description: "Ana görsele tıklayın",
    icon: <Image className="h-4 w-4" />,
    phase: "detail"
  },
];

// Improved iframe script with proper hover handling
const createIframeScript = (mode: SelectionStep, phase: Phase) => `
(function() {
  // Cleanup previous instance
  if (window.__octopusCleanup) {
    window.__octopusCleanup();
  }

  const MODE = '${mode}';
  const PHASE = '${phase}';

  // State
  let currentHoveredElement = null;
  let currentHoveredOriginalOutline = '';
  let currentHoveredOriginalOutlineOffset = '';
  const permanentlySelected = new Set();

  // Styles
  const HOVER_STYLE = '2px dashed #3b82f6';
  const SELECTED_STYLE = '3px solid #22c55e';
  const SIMILAR_STYLE = '2px solid #eab308';

  // CSS escape helper
  function cssEscape(value) {
    if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(value);
    return value.replace(/([!"#$%&'()*+,./:;<=>?@[\\\\]^{|}~])/g, '\\\\$1');
  }

  // Find best selector for list items (finds similar elements)
  function findListSelector(el) {
    const doc = el.ownerDocument;
    const candidates = [];

    // Try each class
    for (const cls of (el.classList || [])) {
      if (!cls || cls.includes(':') || cls.includes('[') || cls.match(/^[0-9]/)) continue;
      const sel = '.' + cssEscape(cls);
      try {
        const matches = doc.querySelectorAll(sel);
        if (matches.length >= 3 && matches.length <= 100) {
          candidates.push({ selector: sel, count: matches.length, element: el });
        }
      } catch {}
    }

    // Try tag + class combinations
    const tag = el.tagName.toLowerCase();
    for (const cls of (el.classList || [])) {
      if (!cls || cls.includes(':') || cls.includes('[') || cls.match(/^[0-9]/)) continue;
      const sel = tag + '.' + cssEscape(cls);
      try {
        const matches = doc.querySelectorAll(sel);
        if (matches.length >= 3 && matches.length <= 100) {
          candidates.push({ selector: sel, count: matches.length, element: el });
        }
      } catch {}
    }

    // Sort by count closest to 10-20 (typical news list size)
    candidates.sort((a, b) => {
      const aScore = Math.abs(a.count - 15);
      const bScore = Math.abs(b.count - 15);
      return aScore - bScore;
    });

    if (candidates.length > 0) {
      return candidates[0];
    }

    // Fallback: try parent element classes
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      for (const cls of (parent.classList || [])) {
        if (!cls || cls.includes(':') || cls.includes('[') || cls.match(/^[0-9]/)) continue;
        const sel = '.' + cssEscape(cls) + ' > ' + tag;
        try {
          const matches = doc.querySelectorAll(sel);
          if (matches.length >= 3 && matches.length <= 100) {
            return { selector: sel, count: matches.length, element: el };
          }
        } catch {}
      }
      parent = parent.parentElement;
    }

    // Ultimate fallback
    return { selector: tag, count: 1, element: el };
  }

  // Find link within an element
  function findLinkInElement(el) {
    // Check if element itself is a link
    if (el.tagName.toLowerCase() === 'a' && el.href) {
      return el.href;
    }
    // Find first link inside
    const link = el.querySelector('a[href]');
    if (link && link.href) {
      return link.href;
    }
    // Check parent
    const parentLink = el.closest('a[href]');
    if (parentLink && parentLink.href) {
      return parentLink.href;
    }
    return null;
  }

  // Generate unique selector for detail page elements
  function generateSelector(el) {
    const doc = el.ownerDocument;
    if (!doc) return null;

    // Try ID
    if (el.id && el.id.trim() && !el.id.match(/^[0-9]/)) {
      const idSel = '#' + cssEscape(el.id);
      try {
        if (doc.querySelectorAll(idSel).length === 1) return idSel;
      } catch {}
    }

    // Try unique class
    for (const cls of (el.classList || [])) {
      if (!cls || cls.includes(':') || cls.includes('[') || cls.match(/^[0-9]/)) continue;
      const sel = '.' + cssEscape(cls);
      try {
        if (doc.querySelectorAll(sel).length === 1) return sel;
      } catch {}
    }

    // Try tag + class
    const tag = el.tagName.toLowerCase();
    for (const cls of (el.classList || [])) {
      if (!cls || cls.includes(':') || cls.includes('[') || cls.match(/^[0-9]/)) continue;
      const sel = tag + '.' + cssEscape(cls);
      try {
        if (doc.querySelectorAll(sel).length === 1) return sel;
      } catch {}
    }

    // Build path from ancestors
    const path = [];
    let current = el;
    while (current && current !== document.body && current !== document.documentElement) {
      let segment = current.tagName.toLowerCase();

      // Add first meaningful class
      for (const cls of (current.classList || [])) {
        if (cls && !cls.includes(':') && !cls.includes('[') && !cls.match(/^[0-9]/)) {
          segment += '.' + cssEscape(cls);
          break;
        }
      }

      path.unshift(segment);
      current = current.parentElement;

      // Check if current path is unique
      const testSel = path.join(' > ');
      try {
        if (doc.querySelectorAll(testSel).length === 1) {
          return testSel;
        }
      } catch {}

      if (path.length > 5) break;
    }

    return path.join(' > ');
  }

  // Highlight similar elements (for list items)
  function highlightSimilarElements(selector) {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (!permanentlySelected.has(el)) {
          el.style.outline = SIMILAR_STYLE;
          el.style.outlineOffset = '2px';
        }
      });
      return elements.length;
    } catch {
      return 0;
    }
  }

  // Clear similar highlights
  function clearSimilarHighlights() {
    document.querySelectorAll('*').forEach(el => {
      if (!permanentlySelected.has(el) && el.style.outline === SIMILAR_STYLE) {
        el.style.outline = '';
        el.style.outlineOffset = '';
      }
    });
  }

  // Mouse over handler
  function handleMouseOver(e) {
    const target = e.target;
    if (!target || target === document.body || target === document.documentElement) return;
    if (permanentlySelected.has(target)) return;
    if (target === currentHoveredElement) return;

    // Clear previous hover
    if (currentHoveredElement && !permanentlySelected.has(currentHoveredElement)) {
      currentHoveredElement.style.outline = currentHoveredOriginalOutline;
      currentHoveredElement.style.outlineOffset = currentHoveredOriginalOutlineOffset;
    }

    // Save original and apply hover
    currentHoveredOriginalOutline = target.style.outline || '';
    currentHoveredOriginalOutlineOffset = target.style.outlineOffset || '';
    currentHoveredElement = target;
    target.style.outline = HOVER_STYLE;
    target.style.outlineOffset = '2px';
  }

  // Mouse out handler
  function handleMouseOut(e) {
    const target = e.target;
    if (!target) return;
    if (permanentlySelected.has(target)) return;

    // Only clear if this is the currently hovered element
    if (target === currentHoveredElement) {
      target.style.outline = currentHoveredOriginalOutline;
      target.style.outlineOffset = currentHoveredOriginalOutlineOffset;
      currentHoveredElement = null;
      currentHoveredOriginalOutline = '';
      currentHoveredOriginalOutlineOffset = '';
    }
  }

  // Click handler
  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    if (!target || target === document.body || target === document.documentElement) return;

    let selector, count = 1, extractedHref = null;

    if (MODE === 'listItem') {
      // Find best list selector
      const result = findListSelector(target);
      selector = result.selector;

      // Clear previous similar highlights
      clearSimilarHighlights();

      // Highlight all similar elements
      count = highlightSimilarElements(selector);

      // Find link in the clicked element
      extractedHref = findLinkInElement(target);

      // Mark as selected
      permanentlySelected.add(target);
      target.style.outline = SELECTED_STYLE;
      target.style.outlineOffset = '2px';

    } else if (PHASE === 'detail') {
      // Generate unique selector for detail page
      selector = generateSelector(target);

      // For image, get src attribute
      if (MODE === 'image') {
        const img = target.tagName.toLowerCase() === 'img' ? target : target.querySelector('img');
        if (img) {
          extractedHref = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
        }
      }

      // Mark as selected
      permanentlySelected.add(target);
      target.style.outline = SELECTED_STYLE;
      target.style.outlineOffset = '2px';
    }

    // Clear hover state
    currentHoveredElement = null;

    // Send message to parent
    window.parent.postMessage({
      type: 'OCTOPUS_ELEMENT_SELECTED',
      payload: {
        mode: MODE,
        phase: PHASE,
        selector: selector,
        tagName: target.tagName.toLowerCase(),
        text: (target.textContent || '').trim().substring(0, 200),
        href: extractedHref,
        matchCount: count
      }
    }, '*');
  }

  // Add event listeners
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('click', handleClick, true);

  // Disable all links
  document.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); }, true);
  });

  // Cleanup function
  window.__octopusCleanup = function() {
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('click', handleClick, true);

    // Clear hover
    if (currentHoveredElement) {
      currentHoveredElement.style.outline = currentHoveredOriginalOutline;
      currentHoveredElement.style.outlineOffset = currentHoveredOriginalOutlineOffset;
    }

    // Clear all highlights
    permanentlySelected.forEach(el => {
      el.style.outline = '';
      el.style.outlineOffset = '';
    });
    permanentlySelected.clear();
    clearSimilarHighlights();
  };

  // Notify parent that injection is complete
  window.parent.postMessage({ type: 'OCTOPUS_INJECTION_COMPLETE' }, '*');
})();
`;

export function VisualSelector({ onSelectorsConfirmed, initialUrl = "" }: VisualSelectorProps) {
  const [url, setUrl] = useState(initialUrl);
  const [listPageUrl, setListPageUrl] = useState("");
  const [detailPageUrl, setDetailPageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [currentStep, setCurrentStep] = useState<SelectionStep>("listItem");
  const [currentPhase, setCurrentPhase] = useState<Phase>("list");
  const [matchCount, setMatchCount] = useState(0);
  const [selectors, setSelectors] = useState<Partial<SelectorsConfig>>({});
  const [extractedLink, setExtractedLink] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);
  const currentStepConfig = STEPS.find(s => s.key === currentStep);

  const injectScript = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      const script = iframeDoc.createElement("script");
      script.textContent = createIframeScript(currentStep, currentPhase);
      iframeDoc.body.appendChild(script);
    } catch (err) {
      console.error("Failed to inject script:", err);
    }
  }, [currentStep, currentPhase]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "OCTOPUS_ELEMENT_SELECTED") {
        const { mode, selector, href, matchCount: count } = event.data.payload;
        setSelectors(prev => ({ ...prev, [mode]: selector }));
        setMatchCount(count || 1);

        // For listItem, extract link automatically
        if (mode === "listItem" && href) {
          setExtractedLink(href);
        }
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

  useEffect(() => {
    if (htmlContent && isIframeReady) {
      injectScript();
    }
  }, [currentStep, htmlContent, isIframeReady, injectScript]);

  const handleIframeLoad = useCallback(() => {
    injectScript();
  }, [injectScript]);

  const fetchPage = async (targetUrl: string) => {
    setIsLoading(true);
    setError(null);
    setHtmlContent(null);
    setIsIframeReady(false);

    try {
      new URL(targetUrl);
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(targetUrl)}`);
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

  const handleFetchUrl = async () => {
    if (!url) return;
    setListPageUrl(url);
    setSelectors({});
    setCurrentStep("listItem");
    setCurrentPhase("list");
    setMatchCount(0);
    setExtractedLink(null);
    setDetailPageUrl(null);
    await fetchPage(url);
  };

  const handleNavigateToDetail = async () => {
    if (!extractedLink) {
      setError("Link bulunamadı. Lütfen link içeren bir haber kartı seçin.");
      return;
    }
    setDetailPageUrl(extractedLink);
    setCurrentPhase("detail");
    setCurrentStep("title");
    setMatchCount(0);
    await fetchPage(extractedLink);
  };

  const handleBackToList = async () => {
    if (!listPageUrl) return;
    setCurrentPhase("list");
    setCurrentStep("listItem");
    setDetailPageUrl(null);
    setMatchCount(0);
    // Keep listItem selector, clear detail selectors
    setSelectors(prev => ({ listItem: prev.listItem }));
    await fetchPage(listPageUrl);
  };

  const handleNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      const nextStep = STEPS[nextIndex];
      setCurrentStep(nextStep.key);
      setMatchCount(0);

      // If moving from list to detail phase, navigate to detail page
      if (nextStep.phase === "detail" && currentPhase === "list") {
        handleNavigateToDetail();
      }
    } else {
      setCurrentStep("complete");
    }
  };

  const handleReset = () => {
    setSelectors({});
    setCurrentStep("listItem");
    setCurrentPhase("list");
    setMatchCount(0);
    setExtractedLink(null);
    setDetailPageUrl(null);
    if (listPageUrl) fetchPage(listPageUrl);
  };

  const handleConfirm = () => {
    const requiredFields: (keyof SelectorsConfig)[] = ['listItem', 'title', 'date', 'content', 'summary', 'image'];
    const allFilled = requiredFields.every(field => selectors[field]);

    if (allFilled) {
      onSelectorsConfirmed?.(selectors as SelectorsConfig, listPageUrl);
    }
  };

  const canProceed = selectors[currentStep as keyof SelectorsConfig];
  const isComplete = currentStep === "complete";
  const listStepComplete = currentStep === "listItem" && selectors.listItem && extractedLink;

  // Check if all required fields are filled
  const allSelectorsComplete = selectors.listItem && selectors.title && selectors.date &&
                               selectors.content && selectors.summary && selectors.image;

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[600px]">
      {/* Left Panel - 30% - Controls */}
      <div className="w-[30%] flex flex-col gap-4 overflow-y-auto">
        {/* URL Input */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Site URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://example.com/haberler"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
                disabled={isLoading}
                className="text-sm"
              />
              <Button onClick={handleFetchUrl} disabled={!url || isLoading} size="sm">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Git"}
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </CardContent>
        </Card>

        {/* Selection Steps */}
        {htmlContent && (
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Seçim Adımları</CardTitle>
              {/* Phase Indicator */}
              <div className="flex gap-1 mt-2">
                <div className={`flex-1 text-center text-xs py-1 rounded ${currentPhase === "list" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  1. Liste Sayfası
                </div>
                <div className={`flex-1 text-center text-xs py-1 rounded ${currentPhase === "detail" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  2. Detay Sayfası
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Steps */}
              <div className="space-y-2">
                {STEPS.filter(step => step.phase === currentPhase).map((step) => {
                  const isActive = step.key === currentStep;
                  const isCompleted = selectors[step.key as keyof SelectorsConfig];

                  return (
                    <div
                      key={step.key}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${
                        isActive ? "border-primary bg-primary/5" : isCompleted ? "border-green-500 bg-green-50" : "border-muted"
                      }`}
                    >
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                        isCompleted ? "bg-green-500 text-white" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {isCompleted ? <Check className="h-3 w-3" /> : step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`font-medium text-xs ${isActive ? "text-primary" : ""}`}>{step.label}</span>
                        {isCompleted && (
                          <code className="text-[10px] text-green-700 bg-green-100 px-1 rounded block truncate mt-0.5">
                            {selectors[step.key as keyof SelectorsConfig]}
                          </code>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info boxes */}
              {currentStep === "listItem" && matchCount > 0 && (
                <div className="p-2 rounded bg-yellow-50 border border-yellow-200">
                  <p className="text-xs font-medium text-yellow-800">{matchCount} benzer haber kartı bulundu</p>
                  {extractedLink && (
                    <p className="text-[10px] text-yellow-700 mt-1">Link: {extractedLink.substring(0, 50)}...</p>
                  )}
                </div>
              )}

              {currentStep === "listItem" && selectors.listItem && !extractedLink && (
                <div className="p-2 rounded bg-red-50 border border-red-200">
                  <p className="text-xs font-medium text-red-800">⚠️ Seçilen kartta link bulunamadı</p>
                  <p className="text-[10px] text-red-600">Link içeren bir kart seçin</p>
                </div>
              )}

              {/* Current selection */}
              {canProceed && !isComplete && currentStep !== "listItem" && (
                <div className="p-2 rounded bg-muted/50 border">
                  <p className="text-xs font-medium">Seçilen:</p>
                  <code className="text-[10px] bg-slate-900 text-green-400 p-1 rounded block mt-1 break-all">
                    {selectors[currentStep as keyof SelectorsConfig]}
                  </code>
                </div>
              )}

              {/* Action Buttons */}
              {!isComplete && (
                <div className="flex gap-2">
                  {listStepComplete ? (
                    <Button onClick={handleNavigateToDetail} size="sm" className="flex-1 text-xs">
                      Detay Sayfasına Git <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  ) : currentPhase === "detail" && canProceed ? (
                    <Button onClick={handleNextStep} size="sm" className="flex-1 text-xs">
                      {currentStepIndex === STEPS.length - 1 ? "Tamamla" : "Sonraki"} <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  ) : null}
                </div>
              )}

              {/* Complete State */}
              {isComplete && allSelectorsComplete && (
                <div className="space-y-3">
                  <div className="p-2 rounded bg-green-50 border border-green-200">
                    <p className="text-xs font-medium text-green-800 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Tüm seçimler tamamlandı!
                    </p>
                  </div>
                  <div className="text-[10px] font-mono bg-slate-900 text-slate-100 p-2 rounded space-y-0.5">
                    <div className="text-muted-foreground">-- Liste --</div>
                    <div><span className="text-blue-400">listItem:</span> {selectors.listItem}</div>
                    <div className="text-muted-foreground mt-1">-- Detay --</div>
                    <div><span className="text-green-400">title:</span> {selectors.title}</div>
                    <div><span className="text-purple-400">date:</span> {selectors.date}</div>
                    <div><span className="text-yellow-400">content:</span> {selectors.content}</div>
                    <div><span className="text-cyan-400">summary:</span> {selectors.summary}</div>
                    <div><span className="text-pink-400">image:</span> {selectors.image}</div>
                  </div>
                  <Button onClick={handleConfirm} size="sm" className="w-full text-xs">
                    <Check className="h-3 w-3 mr-1" /> Kuralları Onayla
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Panel - 70% - Browser */}
      <div className="w-[70%] flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={currentPhase === "list" ? "default" : "secondary"} className="text-xs">
                  {currentPhase === "list" ? "Liste Sayfası" : "Detay Sayfası"}
                </Badge>
                {currentStepConfig && (
                  <span className="text-xs text-muted-foreground">{currentStepConfig.description}</span>
                )}
              </div>
              <div className="flex gap-1">
                {currentPhase === "detail" && (
                  <Button variant="outline" size="sm" onClick={handleBackToList} className="text-xs h-7">
                    <ArrowLeft className="h-3 w-3 mr-1" /> Liste
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleReset} className="text-xs h-7">
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => fetchPage(currentPhase === "list" ? listPageUrl : detailPageUrl!)} className="text-xs h-7">
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {(listPageUrl || detailPageUrl) && (
              <div className="text-[10px] text-muted-foreground font-mono truncate mt-1 bg-muted px-2 py-1 rounded">
                {currentPhase === "list" ? listPageUrl : detailPageUrl}
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 p-2">
            <div className="relative h-full rounded-lg border bg-white overflow-hidden">
              {!htmlContent ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                  <p className="text-sm text-muted-foreground">URL girin ve Git butonuna tıklayın</p>
                </div>
              ) : !isIframeReady ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : null}
              {htmlContent && (
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlContent}
                  onLoad={handleIframeLoad}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts"
                  title="Sayfa Önizleme"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default VisualSelector;
