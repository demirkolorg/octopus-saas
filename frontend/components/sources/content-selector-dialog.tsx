"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Check,
  RefreshCw,
  FileText,
  MousePointerClick,
} from "lucide-react";

interface ContentSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detailUrl: string;
  onSelectorConfirmed: (selector: string) => void;
}

// Simplified script for content-only selection
const createContentSelectorScript = () => `
(function() {
  // Cleanup previous instance
  if (window.__octopusCleanup) {
    window.__octopusCleanup();
  }

  // State
  let currentHoveredElement = null;
  let currentHoveredOriginalOutline = '';
  let currentHoveredOriginalOutlineOffset = '';
  let selectedElement = null;

  // Styles
  const HOVER_STYLE = '2px dashed #3b82f6';
  const SELECTED_STYLE = '3px solid #22c55e';

  // CSS escape helper
  function cssEscape(value) {
    if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(value);
    return value.replace(/([!"#$%&'()*+,./:;<=>?@[\\\\]^{|}~])/g, '\\\\$1');
  }

  // Generate unique selector for content element
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

  // Mouse over handler
  function handleMouseOver(e) {
    const target = e.target;
    if (!target || target === document.body || target === document.documentElement) return;
    if (target === selectedElement) return;
    if (target === currentHoveredElement) return;

    // Clear previous hover
    if (currentHoveredElement && currentHoveredElement !== selectedElement) {
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
    if (target === selectedElement) return;

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

    // Clear previous selection
    if (selectedElement) {
      selectedElement.style.outline = '';
      selectedElement.style.outlineOffset = '';
    }

    // Generate selector
    const selector = generateSelector(target);

    // Mark as selected
    selectedElement = target;
    target.style.outline = SELECTED_STYLE;
    target.style.outlineOffset = '2px';

    // Clear hover state
    currentHoveredElement = null;

    // Get text preview
    const textPreview = (target.textContent || '').trim().substring(0, 200);

    // Send message to parent
    window.parent.postMessage({
      type: 'OCTOPUS_CONTENT_SELECTED',
      payload: {
        selector: selector,
        tagName: target.tagName.toLowerCase(),
        textPreview: textPreview
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

    if (currentHoveredElement) {
      currentHoveredElement.style.outline = currentHoveredOriginalOutline;
      currentHoveredElement.style.outlineOffset = currentHoveredOriginalOutlineOffset;
    }

    if (selectedElement) {
      selectedElement.style.outline = '';
      selectedElement.style.outlineOffset = '';
    }
  };

  // Notify parent that injection is complete
  window.parent.postMessage({ type: 'OCTOPUS_INJECTION_COMPLETE' }, '*');
})();
`;

export function ContentSelectorDialog({
  open,
  onOpenChange,
  detailUrl,
  onSelectorConfirmed,
}: ContentSelectorDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [selectedSelector, setSelectedSelector] = useState<string | null>(null);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const injectScript = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      const script = iframeDoc.createElement("script");
      script.textContent = createContentSelectorScript();
      iframeDoc.body.appendChild(script);
    } catch (err) {
      console.error("Failed to inject script:", err);
    }
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "OCTOPUS_CONTENT_SELECTED") {
        const { selector, textPreview: preview } = event.data.payload;
        setSelectedSelector(selector);
        setTextPreview(preview);
      } else if (event.data?.type === "OCTOPUS_INJECTION_COMPLETE") {
        setIsIframeReady(true);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const fetchPage = useCallback(async (targetUrl: string) => {
    setIsLoading(true);
    setError(null);
    setHtmlContent(null);
    setIsIframeReady(false);
    setSelectedSelector(null);
    setTextPreview(null);

    try {
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(targetUrl)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      const html = await response.text();
      setHtmlContent(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sayfa yuklenemedi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch page when dialog opens
  useEffect(() => {
    if (open && detailUrl) {
      fetchPage(detailUrl);
    }
  }, [open, detailUrl, fetchPage]);

  const handleIframeLoad = useCallback(() => {
    injectScript();
  }, [injectScript]);

  const handleConfirm = () => {
    if (selectedSelector) {
      onSelectorConfirmed(selectedSelector);
      onOpenChange(false);
    }
  };

  const handleRefresh = () => {
    if (detailUrl) {
      fetchPage(detailUrl);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[100vw] !w-[100vw] !h-[100vh] !rounded-none !m-0 !p-4 flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MousePointerClick className="h-5 w-5" />
            Icerik Alani Secin
          </DialogTitle>
          <DialogDescription>
            Haber iceriginin bulundugu alana tiklayin
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left Panel - Instructions & Selection */}
          <div className="w-[280px] flex flex-col gap-3 flex-shrink-0">
            {/* Instructions */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Icerik Secimi
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Sayfadaki ana haber icerigini (makale metni) iceren alana tiklayin.
                Bu alan genellikle paragraflar, basliklar ve gorseller icerir.
              </p>
            </div>

            {/* Selected Selector */}
            {selectedSelector && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 space-y-2">
                <p className="text-xs font-medium text-green-800 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Secilen Alan
                </p>
                <code className="text-[10px] bg-slate-900 text-green-400 p-2 rounded block break-all">
                  {selectedSelector}
                </code>
                {textPreview && (
                  <p className="text-[10px] text-green-700 line-clamp-3">
                    {textPreview}...
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Yenile
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedSelector}
                size="sm"
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Secimi Onayla
              </Button>
            </div>
          </div>

          {/* Right Panel - Browser */}
          <div className="flex-1 flex flex-col min-w-0 border rounded-lg overflow-hidden">
            {/* URL Bar */}
            <div className="px-3 py-2 bg-muted border-b flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">Detay Sayfasi</Badge>
              <span className="text-[10px] text-muted-foreground font-mono truncate flex-1">
                {detailUrl}
              </span>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 relative bg-white">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!htmlContent && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                  <p className="text-sm text-muted-foreground">Sayfa yukleniyor...</p>
                </div>
              )}
              {htmlContent && (
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlContent}
                  onLoad={handleIframeLoad}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts"
                  title="Detay Sayfa Onizleme"
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
