'use client';

import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useRealtimeSubscription } from './useRealtime';
import { useSiteId } from '@/src/contexts/SiteContext';
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
 * Clears localStorage caches on updates instead of using React Query
 */
export function useOrdersRealtime({
  enabled = true,
  onOrderCreated,
  onOrderUpdated,
  onOrderDeleted,
  showNotifications = true,
}: UseOrdersRealtimeOptions = {}) {
  const siteId = useSiteId();

  // Subscribe to orders table changes
  const channel = useRealtimeSubscription({
    table: 'orders',
    event: '*',
    enabled: enabled && !!siteId,
    onInsert: (payload: RealtimePostgresChangesPayload<OrderWithCustomer>) => {
      const newOrder = payload.new;
      
      // Type guard to ensure we have a valid order
      if (!newOrder || typeof newOrder !== 'object' || !('id' in newOrder)) {
        return;
      }
      
      // Clear localStorage caches for orders
      if (typeof window !== 'undefined' && siteId) {
        const keysToRemove = [
          `orders-${siteId}`,
          `order-stats-${siteId}`,
          `dashboard-stats-${siteId}`,
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      // Show notification
      if (showNotifications) {
        toast.info(`New order #${newOrder.order_number} received!`, {
          description: `From ${newOrder.customer?.full_name || 'Unknown Customer'}`,
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
      
      // Type guard to ensure we have a valid updated order
      if (!updatedOrder || typeof updatedOrder !== 'object' || !('id' in updatedOrder)) {
        return;
      }
      
      // Clear localStorage caches
      if (typeof window !== 'undefined' && siteId) {
        const keysToRemove = [
          `orders-${siteId}`,
          `order-${siteId}-${updatedOrder.id}`,
          `order-stats-${siteId}`,
          `dashboard-stats-${siteId}`,
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
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
      
      // Clear localStorage caches
      if (typeof window !== 'undefined' && siteId) {
        const keysToRemove = [
          `orders-${siteId}`,
          `order-${siteId}-${deletedOrder.id}`,
          `order-stats-${siteId}`,
          `dashboard-stats-${siteId}`,
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
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
  
  return useRealtimeSubscription({
    table: 'orders',
    event: 'UPDATE',
    enabled: !!siteId,
    onUpdate: (payload) => {
      const oldStatus = (payload.old as any)?.status;
      const newStatus = (payload.new as any)?.status;
      
      // Only clear cache if status changed
      if (oldStatus !== newStatus && typeof window !== 'undefined' && siteId) {
        const keysToRemove = [
          `order-stats-${siteId}`,
          `dashboard-stats-${siteId}`,
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
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
  return useRealtimeSubscription({
    table: 'orders',
    event: '*',
    filter: `customer_id=eq.${customerId}`,
    enabled: !!customerId,
    onChange: () => {
      // Clear customer orders cache
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`customer-orders-${customerId}`);
      }
    },
    ...options,
  });
}