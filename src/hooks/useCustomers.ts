import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries/keys';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/contexts/SiteContext';
import {
  getCustomers,
  getCustomer,
  getTopCustomers,
  getCustomerStatistics,
  searchCustomers,
  getCustomerOrderHistory,
  getCustomerInsights,
  CustomerFilters,
  CustomerWithStats,
} from '@/lib/queries/domains/customers';

// Hook for paginated customers list
export function useCustomers(filters?: CustomerFilters) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.customers.list(siteId!, filters),
    queryFn: () => getCustomers(client, siteId!, filters),
    enabled: !!siteId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Hook for single customer with stats
export function useCustomer(customerId: string) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useQuery<CustomerWithStats>({
    queryKey: queryKeys.customers.detail(siteId!, customerId),
    queryFn: () => getCustomer(client, customerId),
    enabled: !!siteId && !!customerId,
  });
}

// Hook for top customers
export function useTopCustomers(limit: number = 10) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.customers.all(siteId!), 'top', limit],
    queryFn: () => getTopCustomers(client, siteId!, limit),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for customer statistics
export function useCustomerStatistics() {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.customers.stats(siteId!),
    queryFn: () => getCustomerStatistics(client, siteId!),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for searching customers
export function useSearchCustomers(searchTerm: string, enabled: boolean = true) {
  const client = useSupabase();
  
  return useQuery({
    queryKey: ['customers', 'search', searchTerm],
    queryFn: () => searchCustomers(client, searchTerm),
    enabled: !!searchTerm && enabled,
    staleTime: 30 * 1000,
  });
}

// Hook for customer order history
export function useCustomerOrderHistory(
  customerId: string,
  page: number = 1,
  limit: number = 20
) {
  const client = useSupabase();
  
  return useQuery({
    queryKey: ['customers', customerId, 'orders', { page, limit }],
    queryFn: () => getCustomerOrderHistory(client, customerId, page, limit),
    enabled: !!customerId,
  });
}

// Hook for customer insights
export function useCustomerInsights(customerId: string) {
  const client = useSupabase();
  
  return useQuery({
    queryKey: ['customers', customerId, 'insights'],
    queryFn: () => getCustomerInsights(client, customerId),
    enabled: !!customerId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Composite hook for customer details page
export function useCustomerDetails(customerId: string) {
  const customer = useCustomer(customerId);
  const orderHistory = useCustomerOrderHistory(customerId);
  const insights = useCustomerInsights(customerId);
  
  return {
    customer,
    orderHistory,
    insights,
    isLoading: customer.isLoading || orderHistory.isLoading || insights.isLoading,
    error: customer.error || orderHistory.error || insights.error,
  };
}