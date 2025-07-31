'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useRealtimeSubscription } from './useRealtime';
import { useSiteId } from '@/contexts/SiteContext';
import { queryKeys } from '@/src/lib/queries/keys';
import { OrderWithCustomer } from '@/src/lib/queries/domains/orders';
import { toast } from 'sonner';

interface UseOrdersRealtimeOptions {
  enabled?: boolean;
  onOrderCreated?: (order: OrderWithCustomer) => void;
  onOrderUpdated?: (order: OrderWithCustomer, previousStatus?: string) => void;
  onOrderDeleted?: (orderId: string) => void;
  showNotifications?: boolean;
}

/**
 * Real-time subscription hook for orders
 * Subscribes to orders table changes filtered by site_id
 * Automatically invalidates React Query caches on updates
 */
export function useOrdersRealtime({
  enabled = true,
  onOrderCreated,
  onOrderUpdated,
  onOrderDeleted,
  showNotifications = true,
}: UseOrdersRealtimeOptions = {}) {
  const siteId = useSiteId();
  const queryClient = useQueryClient();

  // Subscribe to orders table changes
  const channel = useRealtimeSubscription({
    table: 'orders',
    event: '*',
    enabled: enabled && !!siteId,
    onInsert: (payload: RealtimePostgresChangesPayload<OrderWithCustomer>) => {
      const newOrder = payload.new;
      
      // Invalidate orders list and stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.lists(siteId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.stats(siteId!),
      });
      
      // Show notification
      if (showNotifications) {
        toast.info(`New order #${newOrder.order_number} received!`, {
          description: `From ${newOrder.customer?.name || 'Unknown Customer'}`,
          action: {
            label: 'View',
            onClick: () => {
              // Navigate to order detail - implement navigation based on your routing
              window.location.href = `/dashboard/orders/${newOrder.id}`;
            },
          },
        });
      }
      
      // Call custom handler
      onOrderCreated?.(newOrder);
    },
    onUpdate: (payload: RealtimePostgresChangesPayload<OrderWithCustomer>) => {
      const updatedOrder = payload.new;
      const previousOrder = payload.old as OrderWithCustomer;
      
      // Update the specific order in cache if it exists
      const cachedOrder = queryClient.getQueryData<OrderWithCustomer>(
        queryKeys.orders.detail(siteId!, updatedOrder.id)
      );
      
      if (cachedOrder) {
        queryClient.setQueryData(
          queryKeys.orders.detail(siteId!, updatedOrder.id),
          updatedOrder
        );
      }
      
      // Invalidate lists and stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.lists(siteId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.stats(siteId!),
      });
      
      // Show notification for status changes
      if (showNotifications && previousOrder.status !== updatedOrder.status) {
        const statusMessages: Record<string, string> = {
          pending: 'Order is pending',
          processing: 'Order is being processed',
          shipped: 'Order has been shipped',
          delivered: 'Order has been delivered',
          cancelled: 'Order has been cancelled',
        };
        
        toast.info(`Order #${updatedOrder.order_number} status updated`, {
          description: statusMessages[updatedOrder.status] || `Status: ${updatedOrder.status}`,
        });
      }
      
      // Call custom handler
      onOrderUpdated?.(updatedOrder, previousOrder.status);
    },
    onDelete: (payload: RealtimePostgresChangesPayload<OrderWithCustomer>) => {
      const deletedOrder = payload.old as OrderWithCustomer;
      
      // Remove from cache if exists
      queryClient.removeQueries({
        queryKey: queryKeys.orders.detail(siteId!, deletedOrder.id),
      });
      
      // Invalidate lists and stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.lists(siteId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.stats(siteId!),
      });
      
      // Show notification
      if (showNotifications) {
        toast.warning(`Order #${deletedOrder.order_number} has been deleted`);
      }
      
      // Call custom handler
      onOrderDeleted?.(deletedOrder.id);
    },
  });

  return channel;
}

/**
 * Hook for real-time order status tracking
 * Useful for dashboard widgets that show order status counts
 */
export function useOrderStatusRealtime() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useRealtimeSubscription({
    table: 'orders',
    event: 'UPDATE',
    enabled: !!siteId,
    onUpdate: (payload) => {
      const oldStatus = payload.old?.status;
      const newStatus = payload.new?.status;
      
      // Only invalidate stats if status changed
      if (oldStatus !== newStatus) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.stats(siteId!),
        });
      }
    },
  });
}

/**
 * Hook for real-time order tracking by customer
 * Useful for customer-facing order tracking pages
 */
export function useCustomerOrdersRealtime(
  customerId: string,
  options?: Omit<UseOrdersRealtimeOptions, 'enabled'>
) {
  const queryClient = useQueryClient();
  
  return useRealtimeSubscription({
    table: 'orders',
    event: '*',
    filter: `customer_id=eq.${customerId}`,
    enabled: !!customerId,
    onChange: () => {
      // Invalidate customer orders query
      queryClient.invalidateQueries({
        queryKey: ['customers', customerId, 'orders'],
      });
    },
    ...options,
  });
}