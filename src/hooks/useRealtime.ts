'use client';

import { useEffect, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useSiteId } from '@/contexts/SiteContext';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeSubscriptionOptions {
  table: string;
  event?: RealtimeEvent;
  filter?: string;
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
  enabled?: boolean;
}

// Generic real-time subscription hook
export function useRealtimeSubscription({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  const siteId = useSiteId();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !siteId) return;

    // Create unique channel name
    const channelName = `${table}-${siteId}-${Date.now()}`;
    
    // Build filter with site_id if not already included
    const finalFilter = filter || `site_id=eq.${siteId}`;

    // Create channel and subscription
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          filter: finalFilter,
        } as any,
        (payload: any) => {
          // Call appropriate handler based on event type
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload);
              break;
            case 'UPDATE':
              onUpdate?.(payload);
              break;
            case 'DELETE':
              onDelete?.(payload);
              break;
          }
          
          // Always call onChange if provided
          onChange?.(payload);
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, event, filter, siteId, enabled, onInsert, onUpdate, onDelete, onChange]);

  return channelRef.current;
}

// Specialized hook for content real-time updates
export function useContentRealtime(
  options: Omit<UseRealtimeSubscriptionOptions, 'table'> = {}
) {
  return useRealtimeSubscription({
    table: 'content',
    ...options,
  });
}

// Specialized hook for product real-time updates
export function useProductsRealtime(
  options: Omit<UseRealtimeSubscriptionOptions, 'table'> = {}
) {
  return useRealtimeSubscription({
    table: 'products',
    ...options,
  });
}

// Specialized hook for inventory-specific updates
export function useInventoryRealtime(
  productId?: string,
  onInventoryChange?: (oldCount: number, newCount: number, productId: string) => void
) {
  const siteId = useSiteId();

  return useRealtimeSubscription({
    table: 'products',
    event: 'UPDATE',
    filter: productId 
      ? `id=eq.${productId}` 
      : `site_id=eq.${siteId}`,
    onUpdate: (payload: any) => {
      const oldInventory = payload.old?.inventory_count;
      const newInventory = payload.new?.inventory_count;
      
      if (oldInventory !== newInventory && onInventoryChange) {
        onInventoryChange(oldInventory || 0, newInventory || 0, payload.new.id);
      }
    },
  });
}

// Hook for activity feed real-time updates
export function useActivityFeedRealtime(
  onNewActivity?: (activity: any) => void
) {
  const siteId = useSiteId();

  // Listen to multiple tables for activity
  useRealtimeSubscription({
    table: 'content',
    event: '*',
    onChange: (payload) => {
      if (onNewActivity) {
        onNewActivity({
          type: 'content',
          action: payload.eventType.toLowerCase(),
          data: payload.new || payload.old,
          timestamp: new Date().toISOString(),
        });
      }
    },
  });

  useRealtimeSubscription({
    table: 'products',
    event: '*',
    onChange: (payload) => {
      if (onNewActivity) {
        onNewActivity({
          type: 'product',
          action: payload.eventType.toLowerCase(),
          data: payload.new || payload.old,
          timestamp: new Date().toISOString(),
        });
      }
    },
  });
}

// Hook for collaborative editing indicators
export function useCollaborativeEditing(
  resourceType: 'content' | 'product',
  resourceId: string,
  userId: string
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!resourceId || !userId) return;

    const channelName = `editing-${resourceType}-${resourceId}`;

    channelRef.current = supabase
      .channel(channelName, {
        config: {
          presence: {
            key: userId,
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channelRef.current?.presenceState();
        console.log('Presence state:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && channelRef.current) {
          await channelRef.current.track({
            user_id: userId,
            editing_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [resourceType, resourceId, userId]);

  return channelRef.current;
}