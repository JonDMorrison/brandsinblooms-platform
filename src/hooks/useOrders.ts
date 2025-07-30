import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries/keys';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/contexts/SiteContext';
import {
  getOrders,
  getOrder,
  getOrderStats,
  createOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  searchOrders,
  bulkUpdateOrderStatus,
  OrderFilters,
  OrderWithCustomer,
  OrderStats,
} from '@/lib/queries/domains/orders';
import { OrderInsert, OrderUpdate, OrderStatus } from '@/lib/database/types';
import { toast } from 'sonner';

// Hook for paginated orders list
export function useOrders(filters?: OrderFilters) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useInfiniteQuery({
    queryKey: [...queryKeys.orders.list(siteId!, filters)],
    queryFn: ({ pageParam }) => 
      getOrders(client, siteId!, { 
        ...filters, 
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!siteId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook for single order
export function useOrder(orderId: string) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.orders.detail(siteId!, orderId),
    queryFn: () => getOrder(client, siteId!, orderId),
    enabled: !!siteId && !!orderId,
  });
}

// Hook for order statistics
export function useOrderStats() {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useQuery<OrderStats>({
    queryKey: queryKeys.orders.stats(siteId!),
    queryFn: () => getOrderStats(client, siteId!),
    enabled: !!siteId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Hook for creating orders
export function useCreateOrder() {
  const client = useSupabase();
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderData: Omit<OrderInsert, 'site_id' | 'order_number'>) =>
      createOrder(client, siteId!, orderData),
    onSuccess: (newOrder) => {
      // Invalidate orders list and stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.all(siteId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.stats(siteId!),
      });
      
      toast.success(`Order ${newOrder.order_number} created successfully`);
    },
    onError: (error) => {
      toast.error('Failed to create order');
      console.error('Create order error:', error);
    },
  });
}

// Hook for updating orders
export function useUpdateOrder() {
  const client = useSupabase();
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, updates }: { orderId: string; updates: OrderUpdate }) =>
      updateOrder(client, siteId!, orderId, updates),
    onSuccess: (updatedOrder) => {
      // Update cache for this specific order
      queryClient.setQueryData(
        queryKeys.orders.detail(siteId!, updatedOrder.id),
        updatedOrder
      );
      
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.lists(siteId!),
      });
      
      toast.success('Order updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update order');
      console.error('Update order error:', error);
    },
  });
}

// Hook for updating order status
export function useUpdateOrderStatus() {
  const client = useSupabase();
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(client, siteId!, orderId, status),
    onMutate: async ({ orderId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.orders.detail(siteId!, orderId),
      });
      
      // Snapshot the previous value
      const previousOrder = queryClient.getQueryData<OrderWithCustomer>(
        queryKeys.orders.detail(siteId!, orderId)
      );
      
      // Optimistically update
      if (previousOrder) {
        queryClient.setQueryData(
          queryKeys.orders.detail(siteId!, orderId),
          { ...previousOrder, status }
        );
      }
      
      return { previousOrder };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(
          queryKeys.orders.detail(siteId!, variables.orderId),
          context.previousOrder
        );
      }
      toast.error('Failed to update order status');
    },
    onSuccess: (updatedOrder) => {
      // Invalidate stats and lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.stats(siteId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.lists(siteId!),
      });
      
      const statusMessages = {
        processing: 'Order marked as processing',
        shipped: 'Order marked as shipped',
        delivered: 'Order marked as delivered',
        cancelled: 'Order cancelled',
      };
      
      toast.success(statusMessages[updatedOrder.status as OrderStatus]);
    },
  });
}

// Hook for cancelling orders
export function useCancelOrder() {
  const updateStatus = useUpdateOrderStatus();
  
  return useMutation({
    mutationFn: (orderId: string) =>
      updateStatus.mutateAsync({ orderId, status: 'cancelled' }),
  });
}

// Hook for searching orders
export function useSearchOrders(searchTerm: string, enabled: boolean = true) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.orders.all(siteId!), 'search', searchTerm],
    queryFn: () => searchOrders(client, siteId!, searchTerm),
    enabled: !!siteId && !!searchTerm && enabled,
    staleTime: 30 * 1000,
  });
}

// Hook for bulk status updates
export function useBulkUpdateOrderStatus() {
  const client = useSupabase();
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderIds, status }: { orderIds: string[]; status: OrderStatus }) =>
      bulkUpdateOrderStatus(client, siteId!, orderIds, status),
    onSuccess: (updatedOrders, { status }) => {
      // Invalidate all order queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.all(siteId!),
      });
      
      const statusMessages = {
        processing: 'marked as processing',
        shipped: 'marked as shipped',
        delivered: 'marked as delivered',
        cancelled: 'cancelled',
      };
      
      toast.success(
        `${updatedOrders.length} orders ${statusMessages[status]}`
      );
    },
    onError: (error) => {
      toast.error('Failed to update orders');
      console.error('Bulk update error:', error);
    },
  });
}

// Hook for order actions (composite hook)
export function useOrderActions() {
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();
  const bulkUpdateStatus = useBulkUpdateOrderStatus();
  
  return {
    createOrder,
    updateOrder,
    updateStatus,
    cancelOrder,
    bulkUpdateStatus,
  };
}