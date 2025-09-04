'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useRealtimeSubscription } from './useRealtime';
import { useSiteId } from '@/src/contexts/SiteContext';
import { queryKeys } from '@/lib/queries/keys';
import { ActivityLogWithUser } from '@/lib/queries/domains/activity';
import { toast } from 'sonner';

interface UseActivityRealtimeOptions {
  enabled?: boolean;
  onNewActivity?: (activity: ActivityLogWithUser) => void;
  showNotifications?: boolean;
  notificationFilter?: (activity: ActivityLogWithUser) => boolean;
}

/**
 * Real-time subscription hook for activity logs
 * Subscribes to activity_logs table changes
 * Automatically prepends new activities to the feed
 */
export function useActivityRealtime({
  enabled = true,
  onNewActivity,
  showNotifications = false,
  notificationFilter,
}: UseActivityRealtimeOptions = {}) {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  const processedActivities = useRef(new Set<string>());

  // Subscribe to activity_logs table changes
  const channel = useRealtimeSubscription({
    table: 'activity_logs',
    event: 'INSERT', // Only listen for new activities
    enabled: enabled && !!siteId,
    onInsert: (payload: RealtimePostgresChangesPayload<ActivityLogWithUser>) => {
      const newActivity = payload.new;
      
      // Type guard to ensure we have a valid activity
      if (!newActivity || typeof newActivity !== 'object' || !('id' in newActivity)) {
        return;
      }
      
      // Prevent duplicate processing
      if (processedActivities.current.has(newActivity.id)) {
        return;
      }
      processedActivities.current.add(newActivity.id);
      
      // Update infinite query cache by prepending new activity
      queryClient.setQueriesData(
        { queryKey: queryKeys.activity.lists(siteId!) },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          
          // Clone the pages array
          const newPages = [...oldData.pages];
          
          // Prepend to first page
          if (newPages[0]) {
            newPages[0] = {
              ...newPages[0],
              data: [newActivity, ...newPages[0].data],
            };
          }
          
          return {
            ...oldData,
            pages: newPages,
          };
        }
      );
      
      // Invalidate recent activity query
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.activity.all(siteId!), 'recent'],
      });
      
      // Show notification if enabled
      if (showNotifications && (!notificationFilter || notificationFilter(newActivity))) {
        const activityMessages: Record<string, string> = {
          'content.created': 'New content created',
          'content.updated': 'Content updated',
          'content.deleted': 'Content deleted',
          'product.created': 'New product added',
          'product.updated': 'Product updated',
          'product.deleted': 'Product removed',
          'order.created': 'New order received',
          'order.updated': 'Order updated',
          'order.status_changed': 'Order status changed',
          'customer.created': 'New customer registered',
          'theme.updated': 'Theme settings updated',
          'settings.updated': 'Settings updated',
        };
        
        const entityType = newActivity.entity_type || 'unknown';
        const activityType = newActivity.activity_type || 'unknown';
        const message = activityMessages[`${entityType}.${activityType}`] 
          || `${entityType} ${activityType}`;
        
        toast.info(message, {
          description: newActivity.description || `By ${newActivity.user?.full_name || 'System'}`,
        });
      }
      
      // Call custom handler
      onNewActivity?.(newActivity);
    },
  });

  // Cleanup processed activities set periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (processedActivities.current.size > 100) {
        processedActivities.current.clear();
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, []);

  return channel;
}

/**
 * Hook for real-time entity-specific activity tracking
 * Useful for showing activity on specific resources (products, content, etc.)
 */
export function useEntityActivityRealtime(
  entityType: string,
  entityId: string,
  options?: Omit<UseActivityRealtimeOptions, 'enabled'>
) {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useRealtimeSubscription({
    table: 'activity_logs',
    event: 'INSERT',
    filter: `entity_type=eq.${entityType},entity_id=eq.${entityId}`,
    enabled: !!entityType && !!entityId && !!siteId,
    onInsert: () => {
      // Invalidate entity activity query
      queryClient.invalidateQueries({
        queryKey: queryKeys.activity.byEntity(siteId!, entityType, entityId),
      });
    },
    ...options,
  });
}

/**
 * Hook for real-time user activity tracking
 * Useful for showing what a specific user is doing
 */
export function useUserActivityRealtime(
  userId: string,
  options?: UseActivityRealtimeOptions
) {
  const queryClient = useQueryClient();
  
  return useRealtimeSubscription({
    table: 'activity_logs',
    event: 'INSERT',
    filter: `user_id=eq.${userId}`,
    enabled: !!userId && (options?.enabled ?? true),
    onInsert: (payload) => {
      // Invalidate user activity timeline
      queryClient.invalidateQueries({
        queryKey: ['users', userId, 'activity'],
      });
      
      options?.onNewActivity?.(payload.new);
    },
  });
}

/**
 * Hook for real-time activity summary updates
 * Useful for dashboard widgets showing activity metrics
 */
export function useActivitySummaryRealtime(days: number = 7) {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useRealtimeSubscription({
    table: 'activity_logs',
    event: 'INSERT',
    enabled: !!siteId,
    onInsert: () => {
      // Debounce summary invalidation
      clearTimeout((window as any).__activitySummaryTimeout);
      (window as any).__activitySummaryTimeout = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.activity.all(siteId!), 'summary', days],
        });
      }, 1000); // Wait 1 second before invalidating
    },
  });
}