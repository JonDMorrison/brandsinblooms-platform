'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries/keys';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  getNotifications,
  getEntityNotifications,
  getNotificationStats,
  NotificationFilters,
  NotificationWithUser,
  NotificationStats,
} from '@/lib/queries/domains/notifications';

// Hook for paginated notifications with infinite scroll
export function useNotifications(filters?: NotificationFilters) {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(siteId!, user?.id!, filters),
    queryFn: ({ pageParam }) => 
      getNotifications(client, siteId!, user?.id!, { 
        ...filters, 
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!siteId && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

// Hook for unread notifications only
export function useUnreadNotifications(limit?: number) {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useQuery<NotificationWithUser[]>({
    queryKey: queryKeys.notifications.list(siteId!, user?.id!, { 
      isRead: false, 
      isArchived: false,
      limit 
    }),
    queryFn: async () => {
      const result = await getNotifications(client, siteId!, user?.id!, { 
        isRead: false, 
        isArchived: false,
        limit: limit || 10
      });
      return result.notifications;
    },
    enabled: !!siteId && !!user?.id,
    staleTime: 15 * 1000, // 15 seconds for more frequent updates
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

// Hook for notifications by category
export function useNotificationsByCategory(category: string, limit?: number) {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useQuery<NotificationWithUser[]>({
    queryKey: queryKeys.notifications.byCategory(siteId!, user?.id!, category),
    queryFn: async () => {
      const result = await getNotifications(client, siteId!, user?.id!, { 
        category,
        isArchived: false,
        limit: limit || 20
      });
      return result.notifications;
    },
    enabled: !!siteId && !!user?.id && !!category,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Hook for notifications by type
export function useNotificationsByType(type: string, limit?: number) {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useQuery<NotificationWithUser[]>({
    queryKey: queryKeys.notifications.byType(siteId!, user?.id!, type),
    queryFn: async () => {
      const result = await getNotifications(client, siteId!, user?.id!, { 
        type,
        isArchived: false,
        limit: limit || 20
      });
      return result.notifications;
    },
    enabled: !!siteId && !!user?.id && !!type,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Hook for entity-specific notifications
export function useEntityNotifications(
  entityType: string,
  entityId: string,
  limit: number = 10
) {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useQuery<NotificationWithUser[]>({
    queryKey: queryKeys.notifications.byEntity(siteId!, user?.id!, entityType, entityId),
    queryFn: () => getEntityNotifications(client, siteId!, user?.id!, entityType, entityId, limit),
    enabled: !!siteId && !!user?.id && !!entityType && !!entityId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook for notification statistics
export function useNotificationStats() {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useQuery<NotificationStats>({
    queryKey: queryKeys.notifications.stats(siteId!, user?.id!),
    queryFn: () => getNotificationStats(client, siteId!, user?.id!),
    enabled: !!siteId && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Hook for recent notifications (dashboard widget)
export function useRecentNotifications(limit: number = 5) {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useQuery<NotificationWithUser[]>({
    queryKey: [...queryKeys.notifications.all(siteId!, user?.id!), 'recent', limit],
    queryFn: async () => {
      const result = await getNotifications(client, siteId!, user?.id!, { 
        isArchived: false,
        limit
      });
      return result.notifications;
    },
    enabled: !!siteId && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Hook for archived notifications
export function useArchivedNotifications(filters?: Omit<NotificationFilters, 'isArchived'>) {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(siteId!, user?.id!, { 
      ...filters, 
      isArchived: true 
    }),
    queryFn: ({ pageParam }) => 
      getNotifications(client, siteId!, user?.id!, { 
        ...filters, 
        isArchived: true,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!siteId && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes (archived content changes less frequently)
  });
}

// Hook for high priority notifications
export function useHighPriorityNotifications() {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useQuery<NotificationWithUser[]>({
    queryKey: [...queryKeys.notifications.all(siteId!, user?.id!), 'high-priority'],
    queryFn: async () => {
      const result = await getNotifications(client, siteId!, user?.id!, { 
        priority: 'high',
        isRead: false,
        isArchived: false,
        limit: 20
      });
      return result.notifications;
    },
    enabled: !!siteId && !!user?.id,
    staleTime: 15 * 1000, // 15 seconds for urgent notifications
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

// Hook for urgent notifications
export function useUrgentNotifications() {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useQuery<NotificationWithUser[]>({
    queryKey: [...queryKeys.notifications.all(siteId!, user?.id!), 'urgent'],
    queryFn: async () => {
      const result = await getNotifications(client, siteId!, user?.id!, { 
        priority: 'urgent',
        isRead: false,
        isArchived: false,
        limit: 10
      });
      return result.notifications;
    },
    enabled: !!siteId && !!user?.id,
    staleTime: 10 * 1000, // 10 seconds for urgent notifications
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
  });
}

// Composite hook for notification dashboard
export function useNotificationDashboard() {
  const stats = useNotificationStats();
  const recent = useRecentNotifications(10);
  const urgent = useUrgentNotifications();
  const highPriority = useHighPriorityNotifications();
  
  return {
    stats: stats.data,
    recent: recent.data || [],
    urgent: urgent.data || [],
    highPriority: highPriority.data || [],
    isLoading: stats.isLoading || recent.isLoading || urgent.isLoading || highPriority.isLoading,
    error: stats.error || recent.error || urgent.error || highPriority.error,
  };
}