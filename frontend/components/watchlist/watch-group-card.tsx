'use client';

import { useState } from 'react';
import { WatchGroup, WatchKeyword } from '@/lib/api/watchlist';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  useDeleteWatchGroup,
  useToggleGroupActive,
  useRemoveKeywordFromGroup,
} from '@/hooks/use-watchlist';
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Edit,
  FolderOpen,
  Plus,
  X,
} from 'lucide-react';
import { AddGroupKeywordDialog } from './add-group-keyword-dialog';
import { EditGroupDialog } from './edit-group-dialog';

interface WatchGroupCardProps {
  group: WatchGroup;
}

export function WatchGroupCard({ group }: WatchGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const deleteGroup = useDeleteWatchGroup();
  const toggleActive = useToggleGroupActive();
  const removeKeyword = useRemoveKeywordFromGroup();

  const handleDelete = async () => {
    try {
      await deleteGroup.mutateAsync(group.id);
      setDeleteDialogOpen(false);
    } catch {
      // Error handled in hook
    }
  };

  const handleToggleActive = () => {
    toggleActive.mutate({ id: group.id, isActive: !group.isActive });
  };

  const handleRemoveKeyword = (keywordId: string) => {
    removeKeyword.mutate({ groupId: group.id, keywordId });
  };

  return (
    <>
      <Card className={`transition-opacity ${!group.isActive ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <span className="font-semibold">{group.name}</span>
              <Badge variant="secondary" className="ml-2">
                {group.keywords.length} kelime
              </Badge>
              {(group.matchCount ?? 0) > 0 && (
                <Badge variant="outline">{group.matchCount} eşleşme</Badge>
              )}
            </button>

            <div className="flex items-center gap-2">
              <Switch
                checked={group.isActive}
                onCheckedChange={handleToggleActive}
                disabled={toggleActive.isPending}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Düzenle
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {group.description && (
            <p className="text-sm text-muted-foreground ml-9">{group.description}</p>
          )}
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="ml-9 space-y-2">
              {group.keywords.length === 0 ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2 py-2">
                  <FolderOpen className="h-4 w-4" />
                  <span>Henüz kelime eklenmemiş</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {group.keywords.map((keyword) => (
                    <KeywordBadge
                      key={keyword.id}
                      keyword={keyword}
                      groupColor={group.color}
                      onRemove={() => handleRemoveKeyword(keyword.id)}
                    />
                  ))}
                </div>
              )}

              <AddGroupKeywordDialog
                groupId={group.id}
                trigger={
                  <Button variant="ghost" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Kelime Ekle
                  </Button>
                }
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konuyu sil?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{group.name}&quot; konusu ve içindeki {group.keywords.length} kelime
              silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <EditGroupDialog
        group={group}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </>
  );
}

// Keyword Badge Component
function KeywordBadge({
  keyword,
  groupColor,
  onRemove,
}: {
  keyword: WatchKeyword;
  groupColor: string;
  onRemove: () => void;
}) {
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm"
      style={{
        backgroundColor: `${groupColor}20`,
        border: `1px solid ${groupColor}`,
      }}
    >
      <span className="font-medium">{keyword.keyword}</span>
      {keyword.matchCount !== undefined && keyword.matchCount > 0 && (
        <span className="text-xs opacity-70">({keyword.matchCount})</span>
      )}
      {keyword.description && (
        <span className="text-xs opacity-60 max-w-[100px] truncate" title={keyword.description}>
          - {keyword.description}
        </span>
      )}
      <button
        onClick={onRemove}
        className="ml-1 hover:opacity-100 opacity-60 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
