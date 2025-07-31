'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries/keys';
import { 
  getSiteStatistics,
  getDashboardMetrics,
  getRevenueAnalytics,
  getContentAnalytics,
  getProductAnalytics,
  getCustomerAnalytics
} from '@/lib/queries/domains/sites';
import { useSiteId } from '@/contexts/SiteContext';
import { supabase } from '@/lib/supabase/client';

// Main dashboard metrics
export function useDashboardMetrics() {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.dashboard.metrics(siteId!),
    queryFn: () => getDashboardMetrics(supabase, siteId!),
    enabled: !!siteId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Site statistics (overall stats)
export function useSiteStats() {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.siteStatistics(siteId!),
    queryFn: () => getSiteStatistics(supabase, siteId!),
    enabled: !!siteId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Revenue analytics
export function useRevenueAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.dashboard.revenue(siteId!, period),
    queryFn: () => getRevenueAnalytics(supabase, siteId!, period),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Content analytics
export function useContentAnalytics() {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.dashboard.contentAnalytics(siteId!),
    queryFn: () => getContentAnalytics(supabase, siteId!),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000,
  });
}

// Product analytics
export function useProductAnalytics() {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.dashboard.productAnalytics(siteId!),
    queryFn: () => getProductAnalytics(supabase, siteId!),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000,
  });
}

// Customer analytics
export function useCustomerAnalytics() {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.dashboard.customerAnalytics(siteId!),
    queryFn: () => getCustomerAnalytics(supabase, siteId!),
    enabled: !!siteId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Combined dashboard data hook for easy consumption
export function useDashboardData() {
  const metrics = useDashboardMetrics();
  const revenue = useRevenueAnalytics();
  const content = useContentAnalytics();
  const products = useProductAnalytics();
  
  const isLoading = metrics.isLoading || revenue.isLoading || content.isLoading || products.isLoading;
  const isError = metrics.isError || revenue.isError || content.isError || products.isError;
  
  return {
    metrics: metrics.data,
    revenue: revenue.data,
    content: content.data,
    products: products.data,
    isLoading,
    isError,
    refetch: () => {
      metrics.refetch();
      revenue.refetch();
      content.refetch();
      products.refetch();
    }
  };
}

// Activity feed hook
export function useActivityFeed(limit: number = 10) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.dashboard.activity(siteId!), { limit }],
    queryFn: async () => {
      // This would be implemented as a dedicated activity query
      // For now, returning empty array as placeholder
      return [];
    },
    enabled: !!siteId,
    staleTime: 30 * 1000, // 30 seconds for activity feed
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

// Quick stats for header/sidebar
export function useQuickStats() {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.dashboard.metrics(siteId!), 'quick'],
    queryFn: async () => {
      const stats = await getSiteStatistics(supabase, siteId!);
      return {
        totalProducts: stats.totalProducts,
        totalContent: stats.totalContent,
        activeCustomers: stats.activeCustomers || 0,
        monthlyRevenue: stats.monthlyRevenue || 0,
      };
    },
    enabled: !!siteId,
    staleTime: 2 * 60 * 1000,
  });
}