'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';

export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  user: (id: string) => [...adminKeys.users(), id] as const,
  systemStatus: () => [...adminKeys.all, 'system', 'status'] as const,
  systemSources: () => [...adminKeys.all, 'system', 'sources'] as const,
};

// Users
export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: () => adminApi.getUsers(),
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: () => adminApi.getUser(id),
    enabled: !!id,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'USER' | 'ADMIN' }) =>
      adminApi.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

// System
export function useSystemStatus() {
  return useQuery({
    queryKey: adminKeys.systemStatus(),
    queryFn: () => adminApi.getSystemStatus(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useSystemSources() {
  return useQuery({
    queryKey: adminKeys.systemSources(),
    queryFn: () => adminApi.getSystemSources(),
  });
}
