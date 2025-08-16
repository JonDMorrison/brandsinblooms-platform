/**
 * Order Details hook - Hook for fetching single order with full details
 * Includes related data (items, status history, payments, shipments)
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries/keys';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/contexts/SiteContext';
import {
  getOrderById,
  getOrder,
  getOrderItems,
  OrderWithDetails,
  OrderWithCustomer,
} from '@/lib/queries/domains/orders';

export interface UseOrderDetailsOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
  includeFullDetails?: boolean;
}

/**
 * Hook for fetching single order with full details
 * Includes items, status history, payments, and shipments
 */
export function useOrderDetails(
  orderId: string,
  options: UseOrderDetailsOptions = {}
) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  const {
    enabled = true,
    staleTime = 60 * 1000, // 1 minute
    refetchInterval,
    includeFullDetails = true,
  } = options;
  
  return useQuery<OrderWithDetails>({
    queryKey: queryKeys.orders.detail(siteId!, orderId),
    queryFn: async () => {
      if (includeFullDetails) {
        return await getOrderById(client, siteId!, orderId);
      } else {
        // Cast OrderWithCustomer to OrderWithDetails for type consistency
        const order = await getOrder(client, siteId!, orderId);
        return order as unknown as OrderWithDetails;
      }
    },
    enabled: !!siteId && !!orderId && enabled,
    staleTime,
    refetchInterval,
    retry: (failureCount, error) => {
      // Don't retry if order not found
      if ((error as any)?.message?.includes('not found')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook for fetching order with basic details (no full relations)
 */
export function useOrder(
  orderId: string,
  options: Omit<UseOrderDetailsOptions, 'includeFullDetails'> = {}
) {
  return useOrderDetails(orderId, {
    ...options,
    includeFullDetails: false,
  }) as ReturnType<typeof useQuery<OrderWithCustomer>>;
}

/**
 * Hook for fetching order items separately
 */
export function useOrderItems(
  orderId: string,
  options: Omit<UseOrderDetailsOptions, 'includeFullDetails'> = {}
) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  const {
    enabled = true,
    staleTime = 60 * 1000,
    refetchInterval,
  } = options;
  
  return useQuery({
    queryKey: [...queryKeys.orders.detail(siteId!, orderId), 'items'],
    queryFn: () => getOrderItems(client, siteId!, orderId),
    enabled: !!siteId && !!orderId && enabled,
    staleTime,
    refetchInterval,
  });
}

/**
 * Hook for order status history
 */
export function useOrderStatusHistory(
  orderId: string,
  options: Omit<UseOrderDetailsOptions, 'includeFullDetails'> = {}
) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  const {
    enabled = true,
    staleTime = 60 * 1000,
    refetchInterval,
  } = options;
  
  return useQuery({
    queryKey: [...queryKeys.orders.detail(siteId!, orderId), 'status-history'],
    queryFn: async () => {
      const { data, error } = await client
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!siteId && !!orderId && enabled,
    staleTime,
    refetchInterval,
  });
}

/**
 * Hook for order payments
 */
export function useOrderPayments(
  orderId: string,
  options: Omit<UseOrderDetailsOptions, 'includeFullDetails'> = {}
) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  const {
    enabled = true,
    staleTime = 60 * 1000,
    refetchInterval,
  } = options;
  
  return useQuery({
    queryKey: [...queryKeys.orders.detail(siteId!, orderId), 'payments'],
    queryFn: async () => {
      const { data, error } = await client
        .from('order_payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!siteId && !!orderId && enabled,
    staleTime,
    refetchInterval,
  });
}

/**
 * Hook for order shipments
 */
export function useOrderShipments(
  orderId: string,
  options: Omit<UseOrderDetailsOptions, 'includeFullDetails'> = {}
) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  const {
    enabled = true,
    staleTime = 60 * 1000,
    refetchInterval,
  } = options;
  
  return useQuery({
    queryKey: [...queryKeys.orders.detail(siteId!, orderId), 'shipments'],
    queryFn: async () => {
      const { data, error } = await client
        .from('order_shipments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!siteId && !!orderId && enabled,
    staleTime,
    refetchInterval,
  });
}

/**
 * Composite hook that provides all order-related data
 */
export function useOrderFullDetails(
  orderId: string,
  options: UseOrderDetailsOptions = {}
) {
  const orderDetails = useOrderDetails(orderId, options);
  const statusHistory = useOrderStatusHistory(orderId, options);
  const payments = useOrderPayments(orderId, options);
  const shipments = useOrderShipments(orderId, options);
  
  return {
    order: orderDetails,
    statusHistory,
    payments,
    shipments,
    isLoading: orderDetails.isLoading || statusHistory.isLoading || payments.isLoading || shipments.isLoading,
    isError: orderDetails.isError || statusHistory.isError || payments.isError || shipments.isError,
    error: orderDetails.error || statusHistory.error || payments.error || shipments.error,
  };
}

// Export types for consumers
export type { 
  OrderWithDetails, 
  OrderWithCustomer 
};