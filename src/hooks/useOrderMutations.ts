/**
 * Order Mutations hook - All mutation hooks for order management
 * Migrated to use Supabase-only base hooks with localStorage caching
 */

import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
import {
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  bulkUpdateOrderStatus,
  OrderWithCustomer,
  OrderWithDetails,
} from '@/lib/queries/domains/orders';
import { 
  OrderInsert, 
  OrderUpdate, 
  OrderStatus, 
  Order 
} from '@/lib/database/aliases';

/**
 * Hook for creating new orders
 */
export function useCreateOrder() {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseMutation<Order, Omit<OrderInsert, 'site_id' | 'order_number'>>(
    async (orderData, signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return createOrder(client, siteId, orderData);
    },
    {
      showSuccessToast: true,
      onSuccess: (newOrder) => {
        // Clear localStorage caches for orders
        if (typeof window !== 'undefined' && siteId) {
          const keysToRemove = [
            `orders-${siteId}`,
            `order-stats-${siteId}`,
            `dashboard-stats-${siteId}`,
          ];
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
      },
    }
  );
}

/**
 * Hook for updating order details
 */
export function useUpdateOrder() {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseMutation<Order, { orderId: string; updates: OrderUpdate }>(
    async ({ orderId, updates }, signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return updateOrder(client, siteId, orderId, updates);
    },
    {
      showSuccessToast: 'Order updated successfully',
      onSuccess: (updatedOrder, { orderId }) => {
        // Clear localStorage caches
        if (typeof window !== 'undefined' && siteId) {
          const keysToRemove = [
            `orders-${siteId}`,
            `order-${siteId}-${orderId}`,
            `order-stats-${siteId}`,
          ];
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
      },
    }
  );
}

/**
 * Hook for updating order status with optimistic updates
 */
export function useUpdateOrderStatus() {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseMutation<Order, {
    orderId: string; 
    status: OrderStatus;
    changedBy?: string;
    notes?: string;
  }>(
    async ({ orderId, status, changedBy, notes }, signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return updateOrderStatus(client, siteId, orderId, status, changedBy, notes);
    },
    {
      onSuccess: (updatedOrder, { status, orderId }) => {
        const statusMessages: Record<OrderStatus, string> = {
          pending: 'Order marked as pending',
          processing: 'Order marked as processing',
          shipped: 'Order marked as shipped',
          delivered: 'Order marked as delivered',
          cancelled: 'Order cancelled',
          refunded: 'Order refunded',
        };

        // Clear localStorage caches (including all order-related cache keys)
        if (typeof window !== 'undefined' && siteId) {
          const keysToRemove = [
            `orders-${siteId}`,
            `order-${siteId}-${orderId}`,
            `order-details-${orderId}`, // Used by useOrderDetails hook
            `order-items-${orderId}`,
            `order-status-history-${orderId}`, // Status history changes on status update
            `order-payments-${orderId}`,
            `order-shipments-${orderId}`,
            `order-stats-${siteId}`,
            `order-trends-${siteId}-60`, // Trends cache (useOrderMetrics uses 60 days)
            `dashboard-stats-${siteId}`,
          ];
          keysToRemove.forEach(key => localStorage.removeItem(key));

          // Dispatch custom event to trigger refetch of all cached queries
          window.dispatchEvent(new CustomEvent('orderStatusChanged', {
            detail: { orderId, status, siteId }
          }));
        }
      },
      showSuccessToast: false, // We handle success toast in onSuccess
    }
  );
}

/**
 * Hook for bulk updating order status
 */
export function useBulkUpdateOrders() {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseMutation<Order[], {
    orderIds: string[]; 
    status: OrderStatus;
    changedBy?: string;
  }>(
    async ({ orderIds, status, changedBy }, signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return bulkUpdateOrderStatus(client, siteId, orderIds, status, changedBy);
    },
    {
      showSuccessToast: false, // We handle success toast in onSuccess
      onSuccess: (updatedOrders, { status }) => {
        const statusMessages: Record<OrderStatus, string> = {
          processing: 'marked as processing',
          shipped: 'marked as shipped',
          delivered: 'marked as delivered',
          cancelled: 'cancelled',
        };
        
        // Clear localStorage caches
        if (typeof window !== 'undefined' && siteId) {
          const keysToRemove = [
            `orders-${siteId}`,
            `order-stats-${siteId}`,
            `dashboard-stats-${siteId}`,
          ];
          // Also clear individual order caches
          updatedOrders.forEach(order => {
            localStorage.removeItem(`order-${siteId}-${order.id}`);
          });
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
      },
    }
  );
}

/**
 * Hook for bulk deleting orders
 */
export function useDeleteOrders() {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseMutation<Order[], string[]>(
    async (orderIds, signal) => {
      if (!siteId) throw new Error('Site ID is required');
      const promises = orderIds.map(orderId => 
        deleteOrder(client, siteId, orderId)
      );
      return Promise.all(promises);
    },
    {
      showSuccessToast: false, // We handle success toast in onSuccess
      onSuccess: (deletedOrders) => {
        // Clear localStorage caches
        if (typeof window !== 'undefined' && siteId) {
          const keysToRemove = [
            `orders-${siteId}`,
            `order-stats-${siteId}`,
            `dashboard-stats-${siteId}`,
          ];
          // Also clear individual order caches
          deletedOrders.forEach(order => {
            localStorage.removeItem(`order-${siteId}-${order.id}`);
          });
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
      },
    }
  );
}

/**
 * Hook for deleting orders (soft delete)
 */
export function useDeleteOrder() {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseMutation<Order, { orderId: string; deletedBy?: string }>(
    async ({ orderId, deletedBy }, signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return deleteOrder(client, siteId, orderId, deletedBy);
    },
    {
      showSuccessToast: 'Order deleted successfully',
      onSuccess: (deletedOrder, { orderId }) => {
        // Clear localStorage caches
        if (typeof window !== 'undefined' && siteId) {
          const keysToRemove = [
            `orders-${siteId}`,
            `order-${siteId}-${orderId}`,
            `order-stats-${siteId}`,
          ];
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
      },
    }
  );
}

/**
 * Composite hook that provides all order mutation operations
 */
export function useOrderMutations() {
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const updateStatus = useUpdateOrderStatus();
  const bulkUpdate = useBulkUpdateOrders();
  const deleteOrder = useDeleteOrder();
  
  return {
    createOrder,
    updateOrder,
    updateStatus,
    bulkUpdate,
    deleteOrder,
    
    // Convenience methods
    isLoading: createOrder.loading || updateOrder.loading || updateStatus.loading || 
               bulkUpdate.loading || deleteOrder.loading,
    
    // Status-specific methods
    markAsProcessing: (orderId: string, changedBy?: string) => 
      updateStatus.mutate({ orderId, status: 'processing', changedBy }),
    markAsShipped: (orderId: string, changedBy?: string) => 
      updateStatus.mutate({ orderId, status: 'shipped', changedBy }),
    markAsDelivered: (orderId: string, changedBy?: string) => 
      updateStatus.mutate({ orderId, status: 'delivered', changedBy }),
    cancelOrder: (orderId: string, changedBy?: string) => 
      updateStatus.mutate({ orderId, status: 'cancelled', changedBy }),
  };
}

// Export types for consumers
export type { OrderInsert, OrderUpdate, OrderStatus };