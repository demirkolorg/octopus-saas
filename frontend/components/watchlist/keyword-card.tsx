'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WatchKeyword } from '@/lib/api/watchlist';
import { useDeleteWatchKeyword, useToggleKeywordActive, useReanalyzeKeyword } from '@/hooks/use-watchlist';
import { MoreVertical, Trash2, RefreshCw, Eye, Loader2 } from 'lucide-react';
import { formatRelativeDate } from '@/lib/date-utils';

interface KeywordCardProps {
  keyword: WatchKeyword;
  onViewMatches?: (keyword: WatchKeyword) => void;
}

export function KeywordCard({ keyword, onViewMatches }: KeywordCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteKeyword = useDeleteWatchKeyword();
  const toggleActive = useToggleKeywordActive();
  const reanalyze = useReanalyzeKeyword();

  const handleDelete = async () => {
    await deleteKeyword.mutateAsync(keyword.id);
    setDeleteDialogOpen(false);
  };

  const handleToggleActive = async () => {
    await toggleActive.mutateAsync({ id: keyword.id, isActive: !keyword.isActive });
  };

  const handleReanalyze = async () => {
    await reanalyze.mutateAsync(keyword.id);
  };

  return (
    <>
      <Card className={`p-4 ${!keyword.isActive ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                style={{ backgroundColor: keyword.color }}
                className="text-white font-medium"
              >
                {keyword.keyword}
              </Badge>
              {!keyword.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Pasif
                </Badge>
              )}
            </div>

            {keyword.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {keyword.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {keyword.matchCount || 0} eşleşme
              </span>
              {keyword.lastMatchAt && (
                <span>Son: {formatRelativeDate(keyword.lastMatchAt)}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={keyword.isActive}
              onCheckedChange={handleToggleActive}
              disabled={toggleActive.isPending}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewMatches && (
                  <DropdownMenuItem onClick={() => onViewMatches(keyword)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Eşleşmeleri Gör
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleReanalyze}
                  disabled={reanalyze.isPending}
                >
                  {reanalyze.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Yeniden Analiz Et
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kelimeyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{keyword.keyword}" kelimesini silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz ve tüm eşleşmeler silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteKeyword.isPending}
            >
              {deleteKeyword.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
