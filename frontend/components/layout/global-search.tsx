'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';

export function GlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSearch = searchParams.get('search') || '';
  const [inputValue, setInputValue] = useState(currentSearch);
  const [isSearching, setIsSearching] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Sync input value with URL params when they change (but not when clearing)
  useEffect(() => {
    if (!isClearing) {
      setInputValue(currentSearch);
    }
  }, [currentSearch, isClearing]);

  // Debounced search effect
  useEffect(() => {
    // Don't run if we're in clearing mode
    if (isClearing) return;

    const timer = setTimeout(() => {
      if (inputValue !== currentSearch) {
        setIsSearching(true);
        const params = new URLSearchParams(searchParams.toString());

        if (inputValue) {
          params.set('search', inputValue);
        } else {
          params.delete('search');
        }

        // If not on dashboard, navigate to dashboard with search
        if (!pathname.startsWith('/dashboard') || pathname !== '/dashboard') {
          router.push(`/dashboard?${params.toString()}`);
        } else {
          router.replace(`${pathname}?${params.toString()}`);
        }

        setTimeout(() => setIsSearching(false), 300);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [inputValue, currentSearch, pathname, router, searchParams, isClearing]);

  const clearSearch = useCallback(() => {
    setIsClearing(true);
    setInputValue('');
    setIsSearching(false);

    // Navigate to clean dashboard
    router.push('/dashboard');

    // Reset clearing flag after navigation
    setTimeout(() => {
      setIsClearing(false);
    }, 100);

    inputRef.current?.focus();
  }, [router]);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      // Escape to clear
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        clearSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearSearch]);

  return (
    <div className="relative w-full max-w-lg">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder="Haberlerde ara... (⌘K)"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="pl-9 pr-8 h-9 bg-muted/50 border-0 focus-visible:bg-background focus-visible:ring-1"
      />
      {isSearching ? (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
      ) : inputValue ? (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={clearSearch}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
