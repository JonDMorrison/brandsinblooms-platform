'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useRealtimeSubscription } from './useRealtime';
import { useSiteId } from '@/src/contexts/SiteContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { queryKeys } from '@/lib/queries/keys';
import { NotificationWithUser } from '@/lib/types/notifications';
import { toast } from 'sonner';

interface UseNotificationsRealtimeOptions {
  enabled?: boolean;
  onNotificationCreated?: (notification: NotificationWithUser) => void;
  onNotificationUpdated?: (notification: NotificationWithUser, previousNotification?: NotificationWithUser) => void;
  onNotificationDeleted?: (notificationId: string) => void;
  showToasts?: boolean;
  soundEnabled?: boolean;
}

/**
 * Real-time subscription hook for notifications
 * Subscribes to notifications table changes filtered by site_id and user_id
 * Automatically invalidates React Query caches on updates
 */
export function useNotificationsRealtime({
  enabled = true,
  onNotificationCreated,
  onNotificationUpdated,
  onNotificationDeleted,
  showToasts = true,
  soundEnabled = false,
}: UseNotificationsRealtimeOptions = {}) {
  const siteId = useSiteId();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Play notification sound (if enabled)
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    try {
      const audio = new Audio('/sounds/notification.mp3'); // You'll need to add this sound file
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors - sound might be blocked by browser
      });
    } catch (error) {
      // Ignore sound errors
    }
  };

  // Subscribe to notifications table changes
  const channel = useRealtimeSubscription({
    table: 'notifications',
    event: '*',
    filter: `site_id=eq.${siteId}&user_id=eq.${user?.id}`,
    enabled: enabled && !!siteId && !!user?.id,
    onInsert: (payload: RealtimePostgresChangesPayload<NotificationWithUser>) => {
      const newNotification = payload.new;
      
      // Type guard to ensure we have a valid notification
      if (!newNotification || typeof newNotification !== 'object' || !('id' in newNotification)) {
        return;
      }
      
      // Invalidate notification lists and counts
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.lists(siteId!, user!.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(siteId!, user!.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.stats(siteId!, user!.id),
      });
      
      // Update unread count optimistically
      const unreadCountKey = queryKeys.notifications.unreadCount(siteId!, user!.id);
      const currentCount = queryClient.getQueryData<number>(unreadCountKey) || 0;
      if (!newNotification.is_read) {
        queryClient.setQueryData(unreadCountKey, currentCount + 1);
      }
      
      // Show toast notification
      if (showToasts) {
        const priorityColors = {
          urgent: 'destructive',
          high: 'warning',
          medium: 'default',
          low: 'secondary',
        };
        
        toast(newNotification.title, {
          description: newNotification.message,
          // @ts-ignore - toast variant type issue
          variant: priorityColors[newNotification.priority as keyof typeof priorityColors] || 'default',
          action: newNotification.action_url ? {
            label: 'View',
            onClick: () => {
              window.location.href = newNotification.action_url!;
            },
          } : undefined,
          duration: newNotification.priority === 'urgent' ? 10000 : 5000,
        });
      }
      
      // Play sound for urgent or high priority notifications
      if ((newNotification.priority === 'urgent' || newNotification.priority === 'high') && soundEnabled) {
        playNotificationSound();
      }
      
      // Call custom handler
      onNotificationCreated?.(newNotification);
    },
    onUpdate: (payload: RealtimePostgresChangesPayload<NotificationWithUser>) => {
      const updatedNotification = payload.new;
      const previousNotification = payload.old as NotificationWithUser;
      
      // Type guard to ensure we have a valid updated notification
      if (!updatedNotification || typeof updatedNotification !== 'object' || !('id' in updatedNotification)) {
        return;
      }
      
      // Update the specific notification in cache if it exists
      const cachedNotification = queryClient.getQueryData<NotificationWithUser>(
        queryKeys.notifications.detail(siteId!, user!.id, updatedNotification.id)
      );
      
      if (cachedNotification) {
        queryClient.setQueryData(
          queryKeys.notifications.detail(siteId!, user!.id, updatedNotification.id),
          updatedNotification
        );
      }
      
      // Update unread count if read status changed
      if (previousNotification.is_read !== updatedNotification.is_read) {
        const unreadCountKey = queryKeys.notifications.unreadCount(siteId!, user!.id);
        const currentCount = queryClient.getQueryData<number>(unreadCountKey) || 0;
        
        if (updatedNotification.is_read && !previousNotification.is_read) {
          // Marked as read
          queryClient.setQueryData(unreadCountKey, Math.max(0, currentCount - 1));
        } else if (!updatedNotification.is_read && previousNotification.is_read) {
          // Marked as unread
          queryClient.setQueryData(unreadCountKey, currentCount + 1);
        }
      }
      
      // Invalidate lists and stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.lists(siteId!, user!.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.stats(siteId!, user!.id),
      });
      
      // Call custom handler
      onNotificationUpdated?.(updatedNotification, previousNotification);
    },
    onDelete: (payload: RealtimePostgresChangesPayload<NotificationWithUser>) => {
      const deletedNotification = payload.old as NotificationWithUser;
      
      // Remove from cache if exists
      queryClient.removeQueries({
        queryKey: queryKeys.notifications.detail(siteId!, user!.id, deletedNotification.id),
      });
      
      // Update unread count if it was an unread notification
      if (!deletedNotification.is_read) {
        const unreadCountKey = queryKeys.notifications.unreadCount(siteId!, user!.id);
        const currentCount = queryClient.getQueryData<number>(unreadCountKey) || 0;
        queryClient.setQueryData(unreadCountKey, Math.max(0, currentCount - 1));
      }
      
      // Invalidate lists and stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.lists(siteId!, user!.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.stats(siteId!, user!.id),
      });
      
      // Call custom handler
      onNotificationDeleted?.(deletedNotification.id);
    },
  });

  return channel;
}

/**
 * Hook for real-time urgent notifications only
 * Useful for critical alerts that need immediate attention
 */
export function useUrgentNotificationsRealtime(options?: Omit<UseNotificationsRealtimeOptions, 'enabled'>) {
  const siteId = useSiteId();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useRealtimeSubscription({
    table: 'notifications',
    event: 'INSERT',
    filter: `site_id=eq.${siteId}&user_id=eq.${user?.id}&priority=eq.urgent`,
    enabled: !!siteId && !!user?.id,
    onInsert: (payload) => {
      const urgentNotification = payload.new as NotificationWithUser;
      
      // Invalidate urgent notification queries
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.notifications.all(siteId!, user!.id), 'urgent'],
      });
      
      // Show prominent urgent notification
      if (options?.showToasts !== false) {
        toast.error(`🚨 URGENT: ${urgentNotification.title}`, {
          description: urgentNotification.message,
          duration: 15000, // 15 seconds for urgent notifications
          action: urgentNotification.action_url ? {
            label: 'Handle Now',
            onClick: () => {
              window.location.href = urgentNotification.action_url!;
            },
          } : undefined,
        });
      }
      
      // Always play sound for urgent notifications
      if (options?.soundEnabled !== false) {
        try {
          const audio = new Audio('/sounds/urgent-notification.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch (error) {
          // Ignore sound errors
        }
      }
      
      options?.onNotificationCreated?.(urgentNotification);
    },
  });
}

/**
 * Hook for real-time notification counts
 * Useful for badge updates without fetching full notification lists
 */
export function useNotificationCountsRealtime() {
  const siteId = useSiteId();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useRealtimeSubscription({
    table: 'notifications',
    event: '*',
    filter: `site_id=eq.${siteId}&user_id=eq.${user?.id}`,
    enabled: !!siteId && !!user?.id,
    onChange: () => {
      // Invalidate count queries on any notification change
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(siteId!, user!.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.stats(siteId!, user!.id),
      });
    },
  });
}

/**
 * Hook for real-time notifications by category
 * Useful for specific notification types (e.g., orders, messages)
 */
export function useCategoryNotificationsRealtime(
  category: string,
  options?: UseNotificationsRealtimeOptions
) {
  const siteId = useSiteId();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useRealtimeSubscription({
    table: 'notifications',
    event: '*',
    filter: `site_id=eq.${siteId}&user_id=eq.${user?.id}&category=eq.${category}`,
    enabled: !!siteId && !!user?.id && !!category,
    onChange: () => {
      // Invalidate category-specific queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.byCategory(siteId!, user!.id, category),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.lists(siteId!, user!.id),
      });
    },
    onInsert: (payload) => {
      const notification = payload.new as NotificationWithUser;
      options?.onNotificationCreated?.(notification);
    },
    onUpdate: (payload) => {
      const notification = payload.new as NotificationWithUser;
      const previous = payload.old as NotificationWithUser;
      options?.onNotificationUpdated?.(notification, previous);
    },
    onDelete: (payload) => {
      const notification = payload.old as NotificationWithUser;
      options?.onNotificationDeleted?.(notification.id);
    },
  });
}

/**
 * Hook that sets up comprehensive real-time notification handling
 * Includes all types of real-time updates and optimizations
 */
export function useComprehensiveNotificationsRealtime(options?: UseNotificationsRealtimeOptions) {
  // Main notifications real-time subscription
  const mainChannel = useNotificationsRealtime(options);
  
  // Urgent notifications subscription
  const urgentChannel = useUrgentNotificationsRealtime({
    showToasts: options?.showToasts,
    soundEnabled: options?.soundEnabled,
    onNotificationCreated: options?.onNotificationCreated,
  });
  
  // Count updates subscription
  const countsChannel = useNotificationCountsRealtime();
  
  return {
    mainChannel,
    urgentChannel,
    countsChannel,
    isConnected: !!mainChannel,
  };
}