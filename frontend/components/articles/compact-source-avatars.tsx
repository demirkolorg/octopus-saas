'use client';

import { ArticleSource } from '@/lib/api/articles';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CompactSourceAvatarsProps {
  sources: ArticleSource[];
  maxVisible?: number;
}

// Generate a consistent color from string
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
}

// Get initials from site name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function CompactSourceAvatars({
  sources,
  maxVisible = 3,
}: CompactSourceAvatarsProps) {
  if (!sources || sources.length <= 1) return null;

  const visibleSources = sources.slice(0, maxVisible);
  const remainingCount = sources.length - maxVisible;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center -space-x-1.5">
        {visibleSources.map((source, index) => {
          const siteName = source.site?.name || source.name;
          const logoUrl = source.site?.logoUrl;
          const categoryColor = source.category?.color;

          return (
            <Tooltip key={source.id}>
              <TooltipTrigger asChild>
                <div
                  className="relative w-5 h-5 rounded-full border border-background cursor-pointer hover:z-10 transition-transform"
                  style={{
                    zIndex: visibleSources.length - index,
                  }}
                >
                  {(() => {
                    const domain = source.site?.domain;
                    const faviconUrl = domain
                      ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
                      : null;
                    const imgSrc = logoUrl || faviconUrl;

                    return imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={siteName}
                        className="w-full h-full rounded-full object-cover bg-muted"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (logoUrl && faviconUrl && target.src !== faviconUrl) {
                            target.src = faviconUrl;
                          } else {
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }
                        }}
                      />
                    ) : null;
                  })()}
                  <div
                    className={`w-full h-full rounded-full flex items-center justify-center text-white text-[8px] font-semibold ${
                      logoUrl || source.site?.domain ? 'hidden' : ''
                    }`}
                    style={{
                      backgroundColor: categoryColor || stringToColor(siteName),
                    }}
                  >
                    {getInitials(siteName)}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {siteName}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="relative w-5 h-5 rounded-full border border-background bg-muted flex items-center justify-center cursor-pointer"
                style={{ zIndex: 0 }}
              >
                <span className="text-[8px] font-medium text-muted-foreground">
                  +{remainingCount}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <div className="space-y-0.5">
                {sources.slice(maxVisible).map((source) => (
                  <div key={source.id}>
                    {source.site?.name || source.name}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
