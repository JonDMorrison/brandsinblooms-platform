/**
 * Orders hook - Main hook for fetching orders list with infinite pagination
 * Provides filtered orders list with site context integration
 * Migrated to use Supabase-only base hooks
 */

import { useInfiniteSupabase } from '@/hooks/base/useInfiniteSupabase';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
import {
  getOrdersInfinite,
  OrderFilters,
  OrderWithCustomer,
} from '@/lib/queries/domains/orders';

export interface UseOrdersOptions extends Omit<OrderFilters, 'cursor' | 'limit'> {
  enabled?: boolean;
  pageSize?: number;
  persistKey?: string;
}

/**
 * Hook for paginated orders list with infinite scroll
 */
export function useOrders(options: UseOrdersOptions = {}) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  const {
    enabled = true,
    pageSize = 20,
    persistKey,
    ...filters
  } = options;
  
  // Create the query function for useInfiniteSupabase
  const queryFn = siteId ? getOrdersInfinite(client, siteId, filters) : null;
  
  return useInfiniteSupabase<OrderWithCustomer>(
    queryFn!,
    {
      enabled: !!siteId && !!queryFn && enabled,
      pageSize,
      persistKey: persistKey || (siteId ? `orders-${siteId}` : undefined),
    }
  );
}

/**
 * Get all orders as flat array from infinite query
 */
export function useOrdersFlat(options: UseOrdersOptions = {}) {
  const ordersQuery = useOrders(options);
  
  return {
    ...ordersQuery,
    orders: ordersQuery.data,
    totalCount: ordersQuery.data.length,
  };
}

/**
 * Hook for orders with specific status
 */
export function useOrdersByStatus(
  status: OrderFilters['status'],
  options: Omit<UseOrdersOptions, 'status'> = {}
) {
  return useOrders({
    ...options,
    status,
  });
}

/**
 * Hook for customer's orders
 */
export function useCustomerOrders(
  customerId: string,
  options: Omit<UseOrdersOptions, 'customerId'> = {}
) {
  return useOrders({
    ...options,
    customerId,
    enabled: !!customerId && (options.enabled !== false),
  });
}

/**
 * Hook for searching orders
 */
export function useSearchOrders(
  searchTerm: string,
  options: Omit<UseOrdersOptions, 'search'> = {}
) {
  return useOrders({
    ...options,
    search: searchTerm,
    enabled: !!searchTerm.trim() && (options.enabled !== false),
    staleTime: 10 * 1000, // 10 seconds for search results
  });
}

// Export types for consumers
export type { OrderFilters, OrderWithCustomer };