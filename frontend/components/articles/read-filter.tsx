'use client';

import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

export type ReadFilter = 'all' | 'unread' | 'read' | 'watch';

interface ReadFilterProps {
  value: ReadFilter;
  onChange: (value: ReadFilter) => void;
}

export function ReadFilterToggle({ value, onChange }: ReadFilterProps) {
  return (
    <div className="flex gap-1">
      <Button
        variant={value === 'all' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onChange('all')}
      >
        Tümü
      </Button>
      <Button
        variant={value === 'watch' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2 text-xs gap-1"
        onClick={() => onChange('watch')}
      >
        <Eye className="h-3 w-3" />
        Takip
      </Button>
      <Button
        variant={value === 'unread' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onChange('unread')}
      >
        Okunmamış
      </Button>
      <Button
        variant={value === 'read' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onChange('read')}
      >
        Okunmuş
      </Button>
    </div>
  );
}
