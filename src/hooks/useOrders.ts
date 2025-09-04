/**
 * Orders hook - Main hook for fetching orders list with infinite pagination
 * Provides filtered orders list with site context integration
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries/keys';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
import {
  getOrders,
  OrderFilters,
  PaginatedOrders,
} from '@/lib/queries/domains/orders';

export interface UseOrdersOptions extends OrderFilters {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
}

/**
 * Hook for paginated orders list with infinite scroll
 */
export function useOrders(options: UseOrdersOptions = {}) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  const {
    enabled = true,
    staleTime = 30 * 1000, // 30 seconds
    refetchInterval,
    ...filters
  } = options;
  
  return useInfiniteQuery({
    queryKey: queryKeys.orders.list(siteId!, filters),
    queryFn: ({ pageParam }) => 
      getOrders(client, siteId!, { 
        ...filters, 
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PaginatedOrders) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    enabled: !!siteId && enabled,
    staleTime,
    refetchInterval,
    // Optimize for better UX
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

/**
 * Get all orders as flat array from infinite query
 */
export function useOrdersFlat(options: UseOrdersOptions = {}) {
  const ordersQuery = useOrders(options);
  
  const orders = ordersQuery.data?.pages.flatMap(page => page.orders) || [];
  
  return {
    ...ordersQuery,
    orders,
    totalCount: ordersQuery.data?.pages[0]?.orders.length || 0,
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
export type { OrderFilters, PaginatedOrders };