'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useArticleStats } from '@/hooks/use-articles';
import { Inbox, CalendarDays, Eye, MailOpen, LucideIcon } from 'lucide-react';

export type ArticleFilterTab = 'all' | 'today' | 'watch' | 'unread';

interface ArticleFilterTabsProps {
  value: ArticleFilterTab;
  onChange: (value: ArticleFilterTab) => void;
}

export function ArticleFilterTabs({ value, onChange }: ArticleFilterTabsProps) {
  const { data: stats, isLoading } = useArticleStats();

  const tabs: { key: ArticleFilterTab; label: string; count: number; icon: LucideIcon }[] = [
    { key: 'all', label: 'Tümü', count: stats?.total || 0, icon: Inbox },
    { key: 'today', label: 'Bugün', count: stats?.todayCount || 0, icon: CalendarDays },
    { key: 'watch', label: 'Takip', count: stats?.watchCount || 0, icon: Eye },
    { key: 'unread', label: 'Okunmamış', count: stats?.unread || 0, icon: MailOpen },
  ];

  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ArticleFilterTab)}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key} className="gap-1.5">
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <Badge
              variant={value === tab.key ? 'secondary' : 'outline'}
              className="h-5 min-w-5 px-1.5 text-[10px] tabular-nums"
            >
              {isLoading ? '...' : tab.count}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
