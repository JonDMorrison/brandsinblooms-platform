/**
 * Order Mutations hook - All mutation hooks for order management
 * Includes optimistic updates and proper cache invalidation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queries/keys';
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
import { handleError } from '@/lib/types/error-handling';

/**
 * Hook for creating new orders
 */
export function useCreateOrder() {
  const client = useSupabase();
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderData: Omit<OrderInsert, 'site_id' | 'order_number'>) =>
      createOrder(client, siteId!, orderData),
    
    onMutate: async () => {
      // Cancel any outgoing refetches for orders list and stats
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: queryKeys.orders.lists(siteId!),
        }),
        queryClient.cancelQueries({
          queryKey: queryKeys.orders.stats(siteId!),
        }),
      ]);
    },
    
    onSuccess: (newOrder) => {
      // Invalidate and refetch orders list and stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.all(siteId!),
      });
      
      // Invalidate dashboard metrics
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.stats(siteId!),
      });
      
      toast.success(`Order ${newOrder.order_number} created successfully`);
    },
    
    onError: (error: unknown) => {
      const errorDetails = handleError(error);
      toast.error(`Failed to create order: ${errorDetails.message}`);
      console.error('Create order error:', errorDetails);
    },
  });
}

/**
 * Hook for updating order details
 */
export function useUpdateOrder() {
  const client = useSupabase();
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, updates }: { orderId: string; updates: OrderUpdate }) =>
      updateOrder(client, siteId!, orderId, updates),
    
    onMutate: async ({ orderId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.orders.detail(siteId!, orderId),
      });
      
      // Snapshot the previous value
      const previousOrder = queryClient.getQueryData<OrderWithDetails | OrderWithCustomer>(
        queryKeys.orders.detail(siteId!, orderId)
      );
      
      // Optimistically update
      if (previousOrder) {
        queryClient.setQueryData(
          queryKeys.orders.detail(siteId!, orderId),
          { ...previousOrder, ...updates, updated_at: new Date().toISOString() }
        );
      }
      
      return { previousOrder };
    },
    
    onError: (error: unknown, { orderId }, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(
          queryKeys.orders.detail(siteId!, orderId),
          context.previousOrder
        );
      }
      
      const errorDetails = handleError(error);
      toast.error(`Failed to update order: ${errorDetails.message}`);
      console.error('Update order error:', errorDetails);
    },
    
    onSuccess: (updatedOrder) => {
      // Update cache for this specific order
      queryClient.setQueryData(
        queryKeys.orders.detail(siteId!, updatedOrder.id),
        updatedOrder
      );
      
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.lists(siteId!),
      });
      
      toast.success('Order updated successfully');
    },
  });
}

/**
 * Hook for updating order status with optimistic updates
 */
export function useUpdateOrderStatus() {
  const client = useSupabase();
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      orderId, 
      status, 
      changedBy, 
      notes 
    }: { 
      orderId: string; 
      status: OrderStatus;
      changedBy?: string;
      notes?: string;
    }) =>
      updateOrderStatus(client, siteId!, orderId, status, changedBy, notes),
    
    onMutate: async ({ orderId, status }) => {
      // Cancel any outgoing refetches
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: queryKeys.orders.detail(siteId!, orderId),
        }),
        queryClient.cancelQueries({
          queryKey: queryKeys.orders.lists(siteId!),
        }),
      ]);
      
      // Snapshot the previous value
      const previousOrder = queryClient.getQueryData<OrderWithDetails | OrderWithCustomer>(
        queryKeys.orders.detail(siteId!, orderId)
      );
      
      // Optimistically update
      if (previousOrder) {
        const optimisticUpdate: Partial<Order> = { 
          status,
          updated_at: new Date().toISOString(),
        };
        
        // Add timestamp fields based on status
        if (status === 'shipped') optimisticUpdate.shipped_at = new Date().toISOString();
        if (status === 'delivered') {
          optimisticUpdate.delivered_at = new Date().toISOString();
          optimisticUpdate.completed_at = new Date().toISOString();
        }
        if (status === 'cancelled') optimisticUpdate.cancelled_at = new Date().toISOString();
        
        queryClient.setQueryData(
          queryKeys.orders.detail(siteId!, orderId),
          { ...previousOrder, ...optimisticUpdate }
        );
      }
      
      return { previousOrder };
    },
    
    onError: (error: unknown, { orderId }, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(
          queryKeys.orders.detail(siteId!, orderId),
          context.previousOrder
        );
      }
      
      const errorDetails = handleError(error);
      toast.error(`Failed to update order status: ${errorDetails.message}`);
      console.error('Update order status error:', errorDetails);
    },
    
    onSuccess: (updatedOrder, { status }) => {
      // Invalidate stats and lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.stats(siteId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.lists(siteId!),
      });
      
      // Invalidate status history for this order
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.orders.detail(siteId!, updatedOrder.id), 'status-history'],
      });
      
      const statusMessages: Record<OrderStatus, string> = {
        processing: 'Order marked as processing',
        shipped: 'Order marked as shipped',
        delivered: 'Order marked as delivered',
        cancelled: 'Order cancelled',
      };
      
      toast.success(statusMessages[status] || 'Order status updated');
    },
  });
}

/**
 * Hook for bulk updating order status
 */
export function useBulkUpdateOrders() {
  const client = useSupabase();
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      orderIds, 
      status, 
      changedBy 
    }: { 
      orderIds: string[]; 
      status: OrderStatus;
      changedBy?: string;
    }) =>
      bulkUpdateOrderStatus(client, siteId!, orderIds, status, changedBy),
    
    onMutate: async () => {
      // Cancel any outgoing refetches for orders
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: queryKeys.orders.lists(siteId!),
        }),
        queryClient.cancelQueries({
          queryKey: queryKeys.orders.stats(siteId!),
        }),
      ]);
    },
    
    onSuccess: (updatedOrders, { status }) => {
      // Invalidate all order queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.all(siteId!),
      });
      
      // Invalidate dashboard stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.stats(siteId!),
      });
      
      const statusMessages: Record<OrderStatus, string> = {
        processing: 'marked as processing',
        shipped: 'marked as shipped',
        delivered: 'marked as delivered',
        cancelled: 'cancelled',
      };
      
      toast.success(
        `${updatedOrders.length} order${updatedOrders.length !== 1 ? 's' : ''} ${statusMessages[status]}`
      );
    },
    
    onError: (error: unknown) => {
      const errorDetails = handleError(error);
      toast.error(`Failed to update orders: ${errorDetails.message}`);
      console.error('Bulk update error:', errorDetails);
    },
  });
}

/**
 * Hook for bulk deleting orders
 */
export function useDeleteOrders() {
  const client = useSupabase();
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderIds: string[]) => {
      const promises = orderIds.map(orderId => 
        deleteOrder(client, siteId!, orderId)
      );
      return Promise.all(promises);
    },
    
    onSuccess: (deletedOrders) => {
      // Invalidate all order-related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.all(siteId!),
      });
      
      // Invalidate dashboard stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.stats(siteId!),
      });
      
      toast.success(`Successfully deleted ${deletedOrders.length} order${deletedOrders.length !== 1 ? 's' : ''}`);
    },
    
    onError: (error: unknown) => {
      const errorDetails = handleError(error);
      toast.error(`Failed to delete orders: ${errorDetails.message}`);
      console.error('Bulk delete orders error:', errorDetails);
    },
  });
}

/**
 * Hook for deleting orders (soft delete)
 */
export function useDeleteOrder() {
  const client = useSupabase();
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, deletedBy }: { orderId: string; deletedBy?: string }) =>
      deleteOrder(client, siteId!, orderId, deletedBy),
    
    onMutate: async ({ orderId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.orders.detail(siteId!, orderId),
      });
      
      // Snapshot the previous value
      const previousOrder = queryClient.getQueryData<OrderWithDetails | OrderWithCustomer>(
        queryKeys.orders.detail(siteId!, orderId)
      );
      
      return { previousOrder };
    },
    
    onError: (error: unknown, { orderId }, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(
          queryKeys.orders.detail(siteId!, orderId),
          context.previousOrder
        );
      }
      
      const errorDetails = handleError(error);
      toast.error(`Failed to delete order: ${errorDetails.message}`);
      console.error('Delete order error:', errorDetails);
    },
    
    onSuccess: (deletedOrder) => {
      // Remove from cache or mark as cancelled
      queryClient.setQueryData(
        queryKeys.orders.detail(siteId!, deletedOrder.id),
        deletedOrder
      );
      
      // Invalidate lists and stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.lists(siteId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.stats(siteId!),
      });
      
      toast.success('Order deleted successfully');
    },
  });
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
    isLoading: createOrder.isPending || updateOrder.isPending || updateStatus.isPending || 
               bulkUpdate.isPending || deleteOrder.isPending,
    
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