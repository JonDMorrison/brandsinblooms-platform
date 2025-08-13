'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries/keys';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/contexts/SiteContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { getUnreadNotificationCount } from '@/lib/queries/domains/notifications';
import { useEffect, useCallback } from 'react';

// Hook for unread notification count with aggressive caching
export function useUnreadNotificationCount() {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(siteId!, user?.id!),
    queryFn: () => getUnreadNotificationCount(client, siteId!, user?.id!),
    enabled: !!siteId && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds stale time for aggressive caching
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    placeholderData: 0, // Show 0 while loading
  });
}

// Hook for unread count by category
export function useUnreadCountByCategory() {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...queryKeys.notifications.unreadCount(siteId!, user?.id!), 'by-category'],
    queryFn: async () => {
      // Get unread notifications grouped by category
      const { data, error } = await client
        .from('notifications')
        .select('category')
        .eq('site_id', siteId!)
        .eq('user_id', user?.id!)
        .eq('is_read', false)
        .eq('is_archived', false);
      
      if (error) throw error;
      
      const countsByCategory: Record<string, number> = {};
      data.forEach(notification => {
        countsByCategory[notification.category] = (countsByCategory[notification.category] || 0) + 1;
      });
      
      return countsByCategory;
    },
    enabled: !!siteId && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Hook for unread count by priority
export function useUnreadCountByPriority() {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...queryKeys.notifications.unreadCount(siteId!, user?.id!), 'by-priority'],
    queryFn: async () => {
      // Get unread notifications grouped by priority
      const { data, error } = await client
        .from('notifications')
        .select('priority')
        .eq('site_id', siteId!)
        .eq('user_id', user?.id!)
        .eq('is_read', false)
        .eq('is_archived', false);
      
      if (error) throw error;
      
      const countsByPriority: Record<string, number> = {};
      data.forEach(notification => {
        countsByPriority[notification.priority] = (countsByPriority[notification.priority] || 0) + 1;
      });
      
      return countsByPriority;
    },
    enabled: !!siteId && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Hook for urgent notification count (higher priority)
export function useUrgentNotificationCount() {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...queryKeys.notifications.unreadCount(siteId!, user?.id!), 'urgent'],
    queryFn: async () => {
      const { count, error } = await client
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId!)
        .eq('user_id', user?.id!)
        .eq('is_read', false)
        .eq('is_archived', false)
        .eq('priority', 'urgent');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!siteId && !!user?.id,
    staleTime: 15 * 1000, // 15 seconds for urgent notifications
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
}

// Hook for high priority notification count
export function useHighPriorityNotificationCount() {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...queryKeys.notifications.unreadCount(siteId!, user?.id!), 'high-priority'],
    queryFn: async () => {
      const { count, error } = await client
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId!)
        .eq('user_id', user?.id!)
        .eq('is_read', false)
        .eq('is_archived', false)
        .in('priority', ['high', 'urgent']);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!siteId && !!user?.id,
    staleTime: 20 * 1000, // 20 seconds
    refetchInterval: 45 * 1000, // Refetch every 45 seconds
  });
}

// Hook that provides optimistic updates for unread count
export function useUnreadNotificationCountWithOptimistic() {
  const queryClient = useQueryClient();
  const siteId = useSiteId();
  const { user } = useAuth();
  const query = useUnreadNotificationCount();
  
  const incrementCount = useCallback((amount: number = 1) => {
    if (!siteId || !user?.id) return;
    
    const queryKey = queryKeys.notifications.unreadCount(siteId, user.id);
    queryClient.setQueryData(queryKey, (oldCount: number = 0) => Math.max(0, oldCount + amount));
  }, [queryClient, siteId, user?.id]);
  
  const decrementCount = useCallback((amount: number = 1) => {
    if (!siteId || !user?.id) return;
    
    const queryKey = queryKeys.notifications.unreadCount(siteId, user.id);
    queryClient.setQueryData(queryKey, (oldCount: number = 0) => Math.max(0, oldCount - amount));
  }, [queryClient, siteId, user?.id]);
  
  const resetCount = useCallback(() => {
    if (!siteId || !user?.id) return;
    
    const queryKey = queryKeys.notifications.unreadCount(siteId, user.id);
    queryClient.setQueryData(queryKey, 0);
  }, [queryClient, siteId, user?.id]);
  
  const invalidateCount = useCallback(() => {
    if (!siteId || !user?.id) return;
    
    const queryKey = queryKeys.notifications.unreadCount(siteId, user.id);
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, siteId, user?.id]);
  
  return {
    ...query,
    incrementCount,
    decrementCount,
    resetCount,
    invalidateCount,
  };
}

// Hook for notification badge data
export function useNotificationBadge() {
  const unreadCount = useUnreadNotificationCount();
  const urgentCount = useUrgentNotificationCount();
  const highPriorityCount = useHighPriorityNotificationCount();
  
  return {
    unreadCount: unreadCount.data || 0,
    urgentCount: urgentCount.data || 0,
    highPriorityCount: highPriorityCount.data || 0,
    hasUnread: (unreadCount.data || 0) > 0,
    hasUrgent: (urgentCount.data || 0) > 0,
    hasHighPriority: (highPriorityCount.data || 0) > 0,
    isLoading: unreadCount.isLoading || urgentCount.isLoading || highPriorityCount.isLoading,
    error: unreadCount.error || urgentCount.error || highPriorityCount.error,
  };
}

// Custom hook that watches for changes and provides live updates
export function useLiveUnreadNotificationCount() {
  const queryClient = useQueryClient();
  const siteId = useSiteId();
  const { user } = useAuth();
  const query = useUnreadNotificationCount();
  
  // Set up periodic background refetch
  useEffect(() => {
    if (!siteId || !user?.id) return;
    
    const interval = setInterval(() => {
      const queryKey = queryKeys.notifications.unreadCount(siteId, user.id);
      queryClient.invalidateQueries({ queryKey });
    }, 30 * 1000); // Invalidate every 30 seconds
    
    return () => clearInterval(interval);
  }, [queryClient, siteId, user?.id]);
  
  // Refetch when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (!siteId || !user?.id) return;
      
      const queryKey = queryKeys.notifications.unreadCount(siteId, user.id);
      queryClient.invalidateQueries({ queryKey });
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [queryClient, siteId, user?.id]);
  
  return query;
}