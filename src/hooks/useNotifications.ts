'use client';

import { useCallback } from 'react';
import { useInfiniteSupabase } from '@/hooks/base/useInfiniteSupabase';
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  getNotifications,
  getEntityNotifications,
  getNotificationStats,
  getUnreadNotificationCount,
  NotificationFilters,
  NotificationWithUser,
  NotificationStats,
  PaginatedNotifications,
} from '@/lib/queries/domains/notifications';
import type { PageData } from '@/hooks/base/useInfiniteSupabase';

// Hook for paginated notifications with infinite scroll
export function useNotifications(filters?: NotificationFilters) {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();

  const queryFn = useCallback(async (
    cursor: string | null, 
    pageSize: number, 
    signal: AbortSignal
  ): Promise<PageData<NotificationWithUser>> => {
    if (!siteId || !user?.id) {
      throw new Error('Site ID and User ID are required');
    }

    const result = await getNotifications(client, siteId, user.id, {
      ...filters,
      cursor,
      limit: pageSize
    });

    return {
      items: result.notifications,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore
    };
  }, [client, siteId, user?.id, filters]);

  const persistKey = siteId && user?.id ? `notifications-${siteId}-${user.id}-${JSON.stringify(filters || {})}` : undefined;

  return useInfiniteSupabase(queryFn, {
    enabled: !!siteId && !!user?.id,
    pageSize: 20,
    persistKey
  });
}

// Hook for unread notifications only
export function useUnreadNotifications(limit?: number) {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();

  const queryFn = useCallback(async (signal: AbortSignal): Promise<NotificationWithUser[]> => {
    if (!siteId || !user?.id) {
      throw new Error('Site ID and User ID are required');
    }

    const result = await getNotifications(client, siteId, user.id, {
      isRead: false,
      isArchived: false,
      limit: limit || 10
    });
    return result.notifications;
  }, [client, siteId, user?.id, limit]);

  const persistKey = siteId && user?.id ? `unread-notifications-${siteId}-${user.id}-${limit || 10}` : undefined;

  return useSupabaseQuery(queryFn, {
    enabled: !!siteId && !!user?.id,
    staleTime: 15 * 1000, // 15 seconds for more frequent updates
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    persistKey
  });
}

// Hook for notifications by category
export function useNotificationsByCategory(category: string, limit?: number) {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();

  const queryFn = useCallback(async (signal: AbortSignal): Promise<NotificationWithUser[]> => {
    if (!siteId || !user?.id) {
      throw new Error('Site ID and User ID are required');
    }

    const result = await getNotifications(client, siteId, user.id, {
      category,
      isArchived: false,
      limit: limit || 20
    });
    return result.notifications;
  }, [client, siteId, user?.id, category, limit]);

  const persistKey = siteId && user?.id ? `notifications-category-${siteId}-${user.id}-${category}-${limit || 20}` : undefined;

  return useSupabaseQuery(queryFn, {
    enabled: !!siteId && !!user?.id && !!category,
    staleTime: 60 * 1000, // 1 minute
    persistKey
  });
}

// Hook for notifications by type
export function useNotificationsByType(type: string, limit?: number) {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();

  const queryFn = useCallback(async (signal: AbortSignal): Promise<NotificationWithUser[]> => {
    if (!siteId || !user?.id) {
      throw new Error('Site ID and User ID are required');
    }

    const result = await getNotifications(client, siteId, user.id, {
      type,
      isArchived: false,
      limit: limit || 20
    });
    return result.notifications;
  }, [client, siteId, user?.id, type, limit]);

  const persistKey = siteId && user?.id ? `notifications-type-${siteId}-${user.id}-${type}-${limit || 20}` : undefined;

  return useSupabaseQuery(queryFn, {
    enabled: !!siteId && !!user?.id && !!type,
    staleTime: 60 * 1000, // 1 minute
    persistKey
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

  const queryFn = useCallback(async (signal: AbortSignal): Promise<NotificationWithUser[]> => {
    if (!siteId || !user?.id) {
      throw new Error('Site ID and User ID are required');
    }

    return getEntityNotifications(client, siteId, user.id, entityType, entityId, limit);
  }, [client, siteId, user?.id, entityType, entityId, limit]);

  const persistKey = siteId && user?.id ? `notifications-entity-${siteId}-${user.id}-${entityType}-${entityId}-${limit}` : undefined;

  return useSupabaseQuery(queryFn, {
    enabled: !!siteId && !!user?.id && !!entityType && !!entityId,
    staleTime: 30 * 1000, // 30 seconds
    persistKey
  });
}

// Hook for notification statistics
export function useNotificationStats() {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();

  const queryFn = useCallback(async (signal: AbortSignal): Promise<NotificationStats> => {
    if (!siteId || !user?.id) {
      throw new Error('Site ID and User ID are required');
    }

    return getNotificationStats(client, siteId, user.id);
  }, [client, siteId, user?.id]);

  const persistKey = siteId && user?.id ? `notification-stats-${siteId}-${user.id}` : undefined;

  return useSupabaseQuery(queryFn, {
    enabled: !!siteId && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    persistKey
  });
}

// Hook for recent notifications (dashboard widget)
export function useRecentNotifications(limit: number = 5) {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();

  const queryFn = useCallback(async (signal: AbortSignal): Promise<NotificationWithUser[]> => {
    if (!siteId || !user?.id) {
      throw new Error('Site ID and User ID are required');
    }

    const result = await getNotifications(client, siteId, user.id, {
      isArchived: false,
      limit
    });
    return result.notifications;
  }, [client, siteId, user?.id, limit]);

  const persistKey = siteId && user?.id ? `recent-notifications-${siteId}-${user.id}-${limit}` : undefined;

  return useSupabaseQuery(queryFn, {
    enabled: !!siteId && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    persistKey
  });
}

// Hook for archived notifications
export function useArchivedNotifications(filters?: Omit<NotificationFilters, 'isArchived'>) {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();

  const queryFn = useCallback(async (
    cursor: string | null, 
    pageSize: number, 
    signal: AbortSignal
  ): Promise<PageData<NotificationWithUser>> => {
    if (!siteId || !user?.id) {
      throw new Error('Site ID and User ID are required');
    }

    const result = await getNotifications(client, siteId, user.id, {
      ...filters,
      isArchived: true,
      cursor,
      limit: pageSize
    });

    return {
      items: result.notifications,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore
    };
  }, [client, siteId, user?.id, filters]);

  const persistKey = siteId && user?.id ? `archived-notifications-${siteId}-${user.id}-${JSON.stringify(filters || {})}` : undefined;

  return useInfiniteSupabase(queryFn, {
    enabled: !!siteId && !!user?.id,
    pageSize: 20,
    persistKey
  });
}

// Hook for high priority notifications
export function useHighPriorityNotifications() {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();

  const queryFn = useCallback(async (signal: AbortSignal): Promise<NotificationWithUser[]> => {
    if (!siteId || !user?.id) {
      throw new Error('Site ID and User ID are required');
    }

    const result = await getNotifications(client, siteId, user.id, {
      priority: 'high',
      isRead: false,
      isArchived: false,
      limit: 20
    });
    return result.notifications;
  }, [client, siteId, user?.id]);

  const persistKey = siteId && user?.id ? `high-priority-notifications-${siteId}-${user.id}` : undefined;

  return useSupabaseQuery(queryFn, {
    enabled: !!siteId && !!user?.id,
    staleTime: 15 * 1000, // 15 seconds for urgent notifications
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    persistKey
  });
}

// Hook for urgent notifications
export function useUrgentNotifications() {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();

  const queryFn = useCallback(async (signal: AbortSignal): Promise<NotificationWithUser[]> => {
    if (!siteId || !user?.id) {
      throw new Error('Site ID and User ID are required');
    }

    const result = await getNotifications(client, siteId, user.id, {
      priority: 'urgent',
      isRead: false,
      isArchived: false,
      limit: 10
    });
    return result.notifications;
  }, [client, siteId, user?.id]);

  const persistKey = siteId && user?.id ? `urgent-notifications-${siteId}-${user.id}` : undefined;

  return useSupabaseQuery(queryFn, {
    enabled: !!siteId && !!user?.id,
    staleTime: 10 * 1000, // 10 seconds for urgent notifications
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
    persistKey
  });
}

// Hook for unread notification count
export function useUnreadNotificationCount() {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();

  const queryFn = useCallback(async (signal: AbortSignal): Promise<number> => {
    if (!siteId || !user?.id) {
      throw new Error('Site ID and User ID are required');
    }

    return getUnreadNotificationCount(client, siteId, user.id);
  }, [client, siteId, user?.id]);

  const persistKey = siteId && user?.id ? `unread-count-${siteId}-${user.id}` : undefined;

  return useSupabaseQuery(queryFn, {
    enabled: !!siteId && !!user?.id,
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    persistKey
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
    loading: stats.loading || recent.loading || urgent.loading || highPriority.loading,
    error: stats.error || recent.error || urgent.error || highPriority.error,
  };
}