/**
 * Order Details hook - Hook for fetching single order with full details
 * Includes related data (items, status history, payments, shipments)
 */

import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
import {
  getOrderById,
  getOrder,
  getOrderItems,
  OrderWithDetails,
  OrderWithCustomer,
} from '@/src/lib/queries/domains/orders';

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
  
  return useSupabaseQuery<OrderWithDetails>(
    async (signal) => {
      if (!siteId || !orderId) throw new Error('Site ID and Order ID are required');
      
      if (includeFullDetails) {
        return await getOrderById(client, siteId, orderId);
      } else {
        // Cast OrderWithCustomer to OrderWithDetails for type consistency
        const order = await getOrder(client, siteId, orderId);
        return order as unknown as OrderWithDetails;
      }
    },
    {
      enabled: !!siteId && !!orderId && enabled,
      staleTime,
      refetchInterval,
      persistKey: `order-details-${orderId}`,
    }
  );
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
  });
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
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId || !orderId) throw new Error('Site ID and Order ID are required');
      return getOrderItems(client, siteId, orderId);
    },
    {
      enabled: !!siteId && !!orderId && enabled,
      staleTime,
      refetchInterval,
      persistKey: `order-items-${orderId}`,
    }
  );
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
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId || !orderId) throw new Error('Site ID and Order ID are required');
      
      const { data, error } = await client
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!siteId && !!orderId && enabled,
      staleTime,
      refetchInterval,
      persistKey: `order-status-history-${orderId}`,
    }
  );
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
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId || !orderId) throw new Error('Site ID and Order ID are required');
      
      const { data, error } = await client
        .from('order_payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!siteId && !!orderId && enabled,
      staleTime,
      refetchInterval,
      persistKey: `order-payments-${orderId}`,
    }
  );
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
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId || !orderId) throw new Error('Site ID and Order ID are required');
      
      const { data, error } = await client
        .from('order_shipments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!siteId && !!orderId && enabled,
      staleTime,
      refetchInterval,
      persistKey: `order-shipments-${orderId}`,
    }
  );
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
    isLoading: orderDetails.loading || statusHistory.loading || payments.loading || shipments.loading,
    isError: !!(orderDetails.error || statusHistory.error || payments.error || shipments.error),
    error: orderDetails.error || statusHistory.error || payments.error || shipments.error,
  };
}

// Export types for consumers
export type { 
  OrderWithDetails, 
  OrderWithCustomer 
};