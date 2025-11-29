"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Loader2, MousePointer2, Check, RefreshCw } from "lucide-react";

interface SelectedElement {
  selector: string;
  tagName: string;
  text: string;
}

interface VisualSelectorProps {
  onSelectorSelected?: (selector: string, url: string) => void;
  initialUrl?: string;
}

// Script to inject into iframe for element selection
const IFRAME_INJECTION_SCRIPT = `
(function() {
  // Prevent multiple injections
  if (window.__octopusInjected) return;
  window.__octopusInjected = true;

  let hoveredElement = null;
  let selectedElement = null;
  const HOVER_STYLE = '2px solid #3b82f6'; // blue-500
  const SELECTED_STYLE = '2px solid #ef4444'; // red-500

  // Store original styles
  const originalStyles = new WeakMap();

  function saveOriginalStyle(el) {
    if (!originalStyles.has(el)) {
      originalStyles.set(el, {
        outline: el.style.outline,
        outlineOffset: el.style.outlineOffset,
        cursor: el.style.cursor
      });
    }
  }

  function restoreOriginalStyle(el) {
    const original = originalStyles.get(el);
    if (original) {
      el.style.outline = original.outline;
      el.style.outlineOffset = original.outlineOffset;
      el.style.cursor = original.cursor;
    }
  }

  function highlightElement(el, style) {
    saveOriginalStyle(el);
    el.style.outline = style;
    el.style.outlineOffset = '2px';
    el.style.cursor = 'pointer';
  }

  // CSS Escape polyfill
  function cssEscape(value) {
    if (typeof CSS !== 'undefined' && CSS.escape) {
      return CSS.escape(value);
    }
    const string = String(value);
    const length = string.length;
    let result = '';
    for (let index = 0; index < length; index++) {
      const codeUnit = string.charCodeAt(index);
      if (codeUnit === 0x0000) { result += '\\\\uFFFD'; continue; }
      if ((codeUnit >= 0x0001 && codeUnit <= 0x001f) || codeUnit === 0x007f ||
          (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
          (index === 1 && codeUnit >= 0x0030 && codeUnit <= 0x0039 && string.charCodeAt(0) === 0x002d)) {
        result += '\\\\' + codeUnit.toString(16) + ' ';
        continue;
      }
      if (index === 0 && length === 1 && codeUnit === 0x002d) {
        result += '\\\\' + string.charAt(index);
        continue;
      }
      if (codeUnit >= 0x0080 || codeUnit === 0x002d || codeUnit === 0x005f ||
          (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
          (codeUnit >= 0x0041 && codeUnit <= 0x005a) ||
          (codeUnit >= 0x0061 && codeUnit <= 0x007a)) {
        result += string.charAt(index);
        continue;
      }
      result += '\\\\' + string.charAt(index);
    }
    return result;
  }

  // Selector generation (simplified version for iframe)
  function isUniqueSelector(selector, doc) {
    try {
      return doc.querySelectorAll(selector).length === 1;
    } catch { return false; }
  }

  function getElementPosition(el) {
    const parent = el.parentElement;
    if (!parent) return el.tagName.toLowerCase();
    const siblings = Array.from(parent.children);
    const sameTagSiblings = siblings.filter(s => s.tagName === el.tagName);
    if (sameTagSiblings.length === 1) return el.tagName.toLowerCase();
    const index = siblings.indexOf(el) + 1;
    return el.tagName.toLowerCase() + ':nth-child(' + index + ')';
  }

  function getElementPath(el) {
    const path = [];
    let current = el;
    while (current && current.tagName.toLowerCase() !== 'body' && current.tagName.toLowerCase() !== 'html') {
      const tagWithPosition = getElementPosition(current);
      const classes = Array.from(current.classList)
        .filter(cls => !cls.includes(':') && !cls.includes('[') && cls.trim() !== '')
        .slice(0, 2)
        .join('.');
      path.unshift(classes ? tagWithPosition + '.' + classes : tagWithPosition);
      current = current.parentElement;
    }
    return path.join(' > ');
  }

  function findUniqueClassSelector(el, doc) {
    const classes = Array.from(el.classList);
    if (classes.length === 0) return null;
    for (const cls of classes) {
      if (cls.includes(':') || cls.includes('[') || cls.trim() === '') continue;
      const selector = '.' + cls;
      if (isUniqueSelector(selector, doc)) return selector;
    }
    const tagName = el.tagName.toLowerCase();
    for (const cls of classes) {
      if (cls.includes(':') || cls.includes('[') || cls.trim() === '') continue;
      const selector = tagName + '.' + cls;
      if (isUniqueSelector(selector, doc)) return selector;
    }
    return null;
  }

  function generateSelectorInFrame(el) {
    const doc = el.ownerDocument;
    if (!doc) return null;

    // Strategy 1: ID
    if (el.id && el.id.trim() !== '') {
      const idSelector = '#' + cssEscape(el.id);
      if (isUniqueSelector(idSelector, doc)) return idSelector;
    }

    // Strategy 2: Unique class
    const classSelector = findUniqueClassSelector(el, doc);
    if (classSelector) return classSelector;

    // Strategy 3: Path
    return getElementPath(el);
  }

  // Mouse over handler
  document.addEventListener('mouseover', function(e) {
    const target = e.target;
    if (target === document.body || target === document.documentElement) return;
    if (target === selectedElement) return;

    // Remove highlight from previous hovered element
    if (hoveredElement && hoveredElement !== selectedElement) {
      restoreOriginalStyle(hoveredElement);
    }

    hoveredElement = target;
    if (target !== selectedElement) {
      highlightElement(target, HOVER_STYLE);
    }
  }, true);

  // Mouse out handler
  document.addEventListener('mouseout', function(e) {
    const target = e.target;
    if (target === selectedElement) return;
    if (target === hoveredElement) {
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

    // Remove highlight from previous selected element
    if (selectedElement) {
      restoreOriginalStyle(selectedElement);
    }

    selectedElement = target;
    highlightElement(target, SELECTED_STYLE);

    // Generate selector
    const selector = generateSelectorInFrame(target);

    // Send message to parent
    window.parent.postMessage({
      type: 'OCTOPUS_ELEMENT_SELECTED',
      payload: {
        selector: selector,
        tagName: target.tagName.toLowerCase(),
        text: (target.textContent || '').trim().substring(0, 100),
        classList: Array.from(target.classList),
        id: target.id || null
      }
    }, '*');
  }, true);

  // Disable all links
  document.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  // Notify parent that injection is complete
  window.parent.postMessage({ type: 'OCTOPUS_INJECTION_COMPLETE' }, '*');
})();
`;

export function VisualSelector({ onSelectorSelected, initialUrl = "" }: VisualSelectorProps) {
  const [url, setUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle messages from iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "OCTOPUS_ELEMENT_SELECTED") {
        const { selector, tagName, text } = event.data.payload;
        setSelectedElement({ selector, tagName, text });
      } else if (event.data?.type === "OCTOPUS_INJECTION_COMPLETE") {
        setIsIframeReady(true);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSelectorSelected]);

  // Inject script when iframe loads
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      // Inject our selection script
      const script = iframeDoc.createElement("script");
      script.textContent = IFRAME_INJECTION_SCRIPT;
      iframeDoc.body.appendChild(script);
    } catch (err) {
      console.error("Failed to inject script into iframe:", err);
      setError("Iframe içine script enjekte edilemedi. CORS hatası olabilir.");
    }
  }, []);

  // Fetch HTML from proxy
  const handleFetchUrl = async () => {
    if (!url) return;

    setIsLoading(true);
    setError(null);
    setHtmlContent(null);
    setSelectedElement(null);
    setIsIframeReady(false);

    try {
      // Validate URL format
      try {
        new URL(url);
      } catch {
        throw new Error("Geçersiz URL formatı");
      }

      const response = await fetch(
        `/api/proxy?url=${encodeURIComponent(url)}`
      );

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

  const handleRefresh = () => {
    setHtmlContent(null);
    setSelectedElement(null);
    setIsIframeReady(false);
    handleFetchUrl();
  };

  const handleConfirmSelector = () => {
    if (selectedElement) {
      onSelectorSelected?.(selectedElement.selector, url);
    }
  };

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
              <Button
                onClick={handleFetchUrl}
                disabled={!url || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Getir"
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visual Selector Section */}
      {htmlContent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer2 className="h-5 w-5" />
                  Görsel Seçici
                </CardTitle>
                <CardDescription>
                  Haber başlıklarını seçmek için sayfadaki elemanlara tıklayın
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Iframe Container */}
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

            {/* Selected Element Info */}
            {selectedElement && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Seçilen Element</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono bg-muted px-1 rounded">
                        &lt;{selectedElement.tagName}&gt;
                      </span>
                    </p>
                  </div>
                  <Button size="sm" onClick={handleConfirmSelector}>
                    <Check className="h-4 w-4 mr-2" />
                    Onayla
                  </Button>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">CSS Seçici</p>
                  <code className="block text-xs bg-slate-900 text-green-400 p-2 rounded font-mono break-all">
                    {selectedElement.selector}
                  </code>
                </div>

                {selectedElement.text && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">İçerik Önizleme</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedElement.text}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Help Text */}
            {!selectedElement && isIframeReady && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <MousePointer2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Sayfadaki bir elemente tıklayarak seçin</p>
                <p className="text-xs mt-1">
                  Mavi çerçeve: Üzerine gelinen element • Kırmızı çerçeve: Seçilen element
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VisualSelector;
