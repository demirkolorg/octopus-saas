import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  watchlistApi,
  watchGroupApi,
  WatchKeyword,
  WatchGroup,
  CreateWatchKeywordDto,
  UpdateWatchKeywordDto,
  CreateWatchGroupDto,
  UpdateWatchGroupDto,
  BulkCreateKeywordsDto,
} from '@/lib/api/watchlist';
import { toast } from 'sonner';

// Query keys
export const watchlistKeys = {
  all: ['watchlist'] as const,
  lists: () => [...watchlistKeys.all, 'list'] as const,
  list: () => [...watchlistKeys.lists()] as const,
  detail: (id: string) => [...watchlistKeys.all, 'detail', id] as const,
  matches: () => [...watchlistKeys.all, 'matches'] as const,
  keywordMatches: (id: string) => [...watchlistKeys.all, 'matches', id] as const,
  // Watch Groups
  groups: () => [...watchlistKeys.all, 'groups'] as const,
  groupDetail: (id: string) => [...watchlistKeys.all, 'group', id] as const,
};

// Get all watch keywords
export function useWatchKeywords() {
  return useQuery({
    queryKey: watchlistKeys.list(),
    queryFn: () => watchlistApi.getAll(),
  });
}

// Get a single watch keyword
export function useWatchKeyword(id: string) {
  return useQuery({
    queryKey: watchlistKeys.detail(id),
    queryFn: () => watchlistApi.getOne(id),
    enabled: !!id,
  });
}

// Create a new watch keyword
export function useCreateWatchKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWatchKeywordDto) => watchlistApi.create(data),
    onSuccess: (newKeyword) => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.lists() });
      toast.success(`"${newKeyword.keyword}" takip listesine eklendi`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Kelime eklenirken hata oluştu';
      toast.error(message);
    },
  });
}

// Update a watch keyword
export function useUpdateWatchKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWatchKeywordDto }) =>
      watchlistApi.update(id, data),
    onSuccess: (updatedKeyword) => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.lists() });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.detail(updatedKeyword.id) });
      toast.success('Kelime güncellendi');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Kelime güncellenirken hata oluştu';
      toast.error(message);
    },
  });
}

// Delete a watch keyword
export function useDeleteWatchKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => watchlistApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.lists() });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.matches() });
      toast.success('Kelime silindi');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Kelime silinirken hata oluştu';
      toast.error(message);
    },
  });
}

// Get all matched articles
export function useWatchMatches(page: number = 1, limit: number = 20, keywordId?: string) {
  return useQuery({
    queryKey: [...watchlistKeys.matches(), { page, limit, keywordId }],
    queryFn: () => watchlistApi.getAllMatches(page, limit, keywordId),
  });
}

// Get matches for a specific keyword
export function useKeywordMatches(id: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: [...watchlistKeys.keywordMatches(id), { page, limit }],
    queryFn: () => watchlistApi.getKeywordMatches(id, page, limit),
    enabled: !!id,
  });
}

// Re-analyze articles for a keyword
export function useReanalyzeKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => watchlistApi.reanalyze(id),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.lists() });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.matches() });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.keywordMatches(id) });
      toast.success(`Analiz tamamlandı: ${result.matchCount} eşleşme bulundu`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Analiz sırasında hata oluştu';
      toast.error(message);
    },
  });
}

// Toggle keyword active status
export function useToggleKeywordActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      watchlistApi.update(id, { isActive }),
    onSuccess: (updatedKeyword) => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.lists() });
      const status = updatedKeyword.isActive ? 'aktif' : 'pasif';
      toast.success(`"${updatedKeyword.keyword}" ${status} yapıldı`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Durum değiştirilirken hata oluştu';
      toast.error(message);
    },
  });
}

// ========================================
// WATCH GROUP HOOKS
// ========================================

// Get all watch groups
export function useWatchGroups() {
  return useQuery({
    queryKey: watchlistKeys.groups(),
    queryFn: () => watchGroupApi.getAll(),
  });
}

// Get a single watch group
export function useWatchGroup(id: string) {
  return useQuery({
    queryKey: watchlistKeys.groupDetail(id),
    queryFn: () => watchGroupApi.getOne(id),
    enabled: !!id,
  });
}

// Create a new watch group
export function useCreateWatchGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWatchGroupDto) => watchGroupApi.create(data),
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.groups() });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.lists() });
      toast.success(`"${newGroup.name}" konusu oluşturuldu`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Konu oluşturulurken hata oluştu';
      toast.error(message);
    },
  });
}

// Update a watch group
export function useUpdateWatchGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWatchGroupDto }) =>
      watchGroupApi.update(id, data),
    onSuccess: (updatedGroup) => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.groups() });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.groupDetail(updatedGroup.id) });
      toast.success('Konu güncellendi');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Konu güncellenirken hata oluştu';
      toast.error(message);
    },
  });
}

// Delete a watch group
export function useDeleteWatchGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => watchGroupApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.groups() });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.lists() });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.matches() });
      toast.success('Konu silindi');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Konu silinirken hata oluştu';
      toast.error(message);
    },
  });
}

// Add keyword to a group
export function useAddKeywordToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: CreateWatchKeywordDto }) =>
      watchGroupApi.addKeyword(groupId, data),
    onSuccess: (newKeyword) => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.groups() });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.lists() });
      toast.success(`"${newKeyword.keyword}" konuya eklendi`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Kelime eklenirken hata oluştu';
      toast.error(message);
    },
  });
}

// Remove keyword from a group
export function useRemoveKeywordFromGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, keywordId }: { groupId: string; keywordId: string }) =>
      watchGroupApi.removeKeyword(groupId, keywordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.groups() });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.lists() });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.matches() });
      toast.success('Kelime konudan çıkarıldı');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Kelime çıkarılırken hata oluştu';
      toast.error(message);
    },
  });
}

// Add bulk keywords to a group
export function useAddBulkKeywordsToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: BulkCreateKeywordsDto }) =>
      watchGroupApi.addBulkKeywords(groupId, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.groups() });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.lists() });

      if (result.added.length > 0 && result.skipped.length > 0) {
        toast.success(`${result.added.length} kelime eklendi, ${result.skipped.length} kelime zaten mevcut`);
      } else if (result.added.length > 0) {
        toast.success(`${result.added.length} kelime başarıyla eklendi`);
      } else {
        toast.info('Tüm kelimeler zaten takip listesinde mevcut');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Kelimeler eklenirken hata oluştu';
      toast.error(message);
    },
  });
}

// Toggle group active status
export function useToggleGroupActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      watchGroupApi.update(id, { isActive }),
    onSuccess: (updatedGroup) => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.groups() });
      const status = updatedGroup.isActive ? 'aktif' : 'pasif';
      toast.success(`"${updatedGroup.name}" konusu ${status} yapıldı`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Durum değiştirilirken hata oluştu';
      toast.error(message);
    },
  });
}
