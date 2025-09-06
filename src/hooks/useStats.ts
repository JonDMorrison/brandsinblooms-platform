'use client';

import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { 
  getSiteStatistics,
  getDashboardMetrics,
  getRevenueAnalytics,
  getContentAnalytics,
  getProductAnalytics,
  getCustomerAnalytics
} from '@/lib/queries/domains/sites';
import { useSiteId } from '@/src/contexts/SiteContext';
import { supabase } from '@/lib/supabase/client';

// Main dashboard metrics
export function useDashboardMetrics() {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return getDashboardMetrics(supabase, siteId);
    },
    {
      enabled: !!siteId,
      staleTime: 60 * 1000, // 1 minute
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
      persistKey: siteId ? `dashboard-metrics-${siteId}` : undefined,
    },
    [siteId] // Re-fetch when siteId changes
  );
}

// Site statistics (overall stats)
export function useSiteStats() {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return getSiteStatistics(supabase, siteId);
    },
    {
      enabled: !!siteId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      persistKey: siteId ? `site-stats-${siteId}` : undefined,
    },
    [siteId] // Re-fetch when siteId changes
  );
}

// Revenue analytics
export function useRevenueAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return getRevenueAnalytics(supabase, siteId, period);
    },
    {
      enabled: !!siteId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      persistKey: siteId ? `revenue-analytics-${siteId}-${period}` : undefined,
    },
    [siteId, period] // Re-fetch when siteId or period changes
  );
}

// Content analytics
export function useContentAnalytics() {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return getContentAnalytics(supabase, siteId);
    },
    {
      enabled: !!siteId,
      staleTime: 5 * 60 * 1000,
      persistKey: siteId ? `content-analytics-${siteId}` : undefined,
    },
    [siteId] // Re-fetch when siteId changes
  );
}

// Product analytics
export function useProductAnalytics() {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return getProductAnalytics(supabase, siteId);
    },
    {
      enabled: !!siteId,
      staleTime: 5 * 60 * 1000,
      persistKey: siteId ? `product-analytics-${siteId}` : undefined,
    },
    [siteId] // Re-fetch when siteId changes
  );
}

// Customer analytics
export function useCustomerAnalytics() {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return getCustomerAnalytics(supabase, siteId);
    },
    {
      enabled: !!siteId,
      staleTime: 10 * 60 * 1000, // 10 minutes
      persistKey: siteId ? `customer-analytics-${siteId}` : undefined,
    },
    [siteId] // Re-fetch when siteId changes
  );
}

// Combined dashboard data hook for easy consumption
export function useDashboardData() {
  const metrics = useDashboardMetrics();
  const revenue = useRevenueAnalytics();
  const content = useContentAnalytics();
  const products = useProductAnalytics();
  
  const isLoading = metrics.loading || revenue.loading || content.loading || products.loading;
  const isError = !!(metrics.error || revenue.error || content.error || products.error);
  
  return {
    metrics: metrics.data,
    revenue: revenue.data,
    content: content.data,
    products: products.data,
    isLoading,
    isError,
    refetch: () => {
      metrics.refresh();
      revenue.refresh();
      content.refresh();
      products.refresh();
    }
  };
}

// Activity feed hook
export function useActivityFeed(limit: number = 10) {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');
      // This would be implemented as a dedicated activity query
      // For now, returning empty array as placeholder
      return [];
    },
    {
      enabled: !!siteId,
      staleTime: 30 * 1000, // 30 seconds for activity feed
      refetchInterval: 60 * 1000, // Auto-refresh every minute
      persistKey: siteId ? `activity-feed-${siteId}-${limit}` : undefined,
    },
    [siteId, limit] // Re-fetch when siteId or limit changes
  );
}

// Quick stats for header/sidebar
export function useQuickStats() {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');
      const stats = await getSiteStatistics(supabase, siteId);
      return {
        totalProducts: stats.totalProducts,
        totalContent: stats.totalContent,
        activeCustomers: stats.activeCustomers || 0,
        monthlyRevenue: stats.monthlyRevenue || 0,
      };
    },
    {
      enabled: !!siteId,
      staleTime: 2 * 60 * 1000,
      persistKey: siteId ? `quick-stats-${siteId}` : undefined,
    },
    [siteId] // Re-fetch when siteId changes
  );
}