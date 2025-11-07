/**
 * Order Statistics hook - Hook for dashboard metrics and performance data
 * Provides total orders, revenue, average order value, and status breakdowns
 */

import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
import {
  getOrderStats,
  OrderStats,
} from '@/lib/queries/domains/orders';

export interface UseOrderStatsOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface OrderTrendData {
  date: string;
  orders: number;
  revenue: number;
}

export interface OrderMetrics extends OrderStats {
  trends?: OrderTrendData[];
  growthRate?: {
    orders: number;
    revenue: number;
  };
  conversionRate?: number;
}

/**
 * Hook for fetching order statistics for dashboard
 */
export function useOrderStats(options: UseOrderStatsOptions = {}) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  const {
    enabled = true,
    staleTime = 60 * 1000, // 1 minute
    refetchInterval = 5 * 60 * 1000, // 5 minutes
  } = options;
  
  return useSupabaseQuery<OrderStats>(
    (signal) => getOrderStats(client, siteId!),
    {
      enabled: !!siteId && enabled,
      staleTime,
      refetchInterval,
      persistKey: siteId ? `order-stats-${siteId}` : undefined,
    }
  );
}

/**
 * Hook for order trends over time
 */
export function useOrderTrends(
  days: number = 30,
  options: UseOrderStatsOptions = {}
) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    refetchInterval = 10 * 60 * 1000, // 10 minutes
  } = options;
  
  return useSupabaseQuery(
    async (signal) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const { data, error } = await client
        .from('orders')
        .select('created_at, total_amount, status')
        .eq('site_id', siteId!)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Group by date
      const trendsMap = new Map<string, { orders: number; revenue: number }>();
      
      data?.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        const existing = trendsMap.get(date) || { orders: 0, revenue: 0 };
        
        existing.orders += 1;
        if (order.status !== 'cancelled') {
          existing.revenue += Number(order.total_amount);
        }
        
        trendsMap.set(date, existing);
      });
      
      // Convert to array and fill missing dates
      const trends: OrderTrendData[] = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(endDate.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const data = trendsMap.get(dateStr) || { orders: 0, revenue: 0 };
        trends.unshift({
          date: dateStr,
          orders: data.orders,
          revenue: data.revenue,
        });
      }
      
      return trends;
    },
    {
      enabled: !!siteId && enabled,
      staleTime,
      refetchInterval,
    }
  );
}

/**
 * Hook for order performance metrics with comparisons
 */
export function useOrderMetrics(options: UseOrderStatsOptions = {}) {
  const stats = useOrderStats(options);
  const trends = useOrderTrends(60, options); // Need 60 days for monthly comparison
  
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000,
  } = options;
  
  // Calculate growth rates and additional metrics
  const metricsQuery = useSupabaseQuery(
    async (signal) => {
      if (!stats.data || !trends.data) return null;
      
      // Use monthly periods (last 30 days vs previous 30 days)
      const currentPeriodTrends = trends.data.slice(-30); // Last 30 days (current month)
      const previousPeriodTrends = trends.data.slice(-60, -30); // Previous 30 days (last month)
      
      const currentOrders = currentPeriodTrends.reduce((sum, day) => sum + day.orders, 0);
      const previousOrders = previousPeriodTrends.reduce((sum, day) => sum + day.orders, 0);
      const currentRevenue = currentPeriodTrends.reduce((sum, day) => sum + day.revenue, 0);
      const previousRevenue = previousPeriodTrends.reduce((sum, day) => sum + day.revenue, 0);
      
      const orderGrowth = previousOrders > 0 
        ? ((currentOrders - previousOrders) / previousOrders) * 100
        : 0;
      const revenueGrowth = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;
      
      const metrics: OrderMetrics = {
        ...stats.data,
        trends: trends.data,
        growthRate: {
          orders: Math.round(orderGrowth * 100) / 100,
          revenue: Math.round(revenueGrowth * 100) / 100,
        },
        // Simplified conversion rate calculation
        conversionRate: stats.data.totalOrders > 0 
          ? (stats.data.deliveredOrders / stats.data.totalOrders) * 100
          : 0,
      };
      
      return metrics;
    },
    {
      enabled: !!stats.data && !!trends.data && enabled,
      staleTime,
    }
  );
  
  return {
    ...metricsQuery,
    loading: stats.loading || trends.loading || metricsQuery.loading,
    error: stats.error || trends.error || metricsQuery.error,
  };
}

/**
 * Hook for order status distribution
 */
export function useOrderStatusDistribution(options: UseOrderStatsOptions = {}) {
  const stats = useOrderStats(options);
  
  return useSupabaseQuery(
    (signal) => {
      if (!stats.data) return null;
      
      const total = stats.data.totalOrders;
      if (total === 0) return [];
      
      return [
        {
          status: 'processing',
          count: stats.data.processingOrders,
          percentage: Math.round((stats.data.processingOrders / total) * 100),
          color: '#f59e0b', // amber
        },
        {
          status: 'shipped',
          count: stats.data.shippedOrders,
          percentage: Math.round((stats.data.shippedOrders / total) * 100),
          color: '#3b82f6', // blue
        },
        {
          status: 'delivered',
          count: stats.data.deliveredOrders,
          percentage: Math.round((stats.data.deliveredOrders / total) * 100),
          color: '#10b981', // green
        },
        {
          status: 'cancelled',
          count: stats.data.cancelledOrders,
          percentage: Math.round((stats.data.cancelledOrders / total) * 100),
          color: '#ef4444', // red
        },
      ].filter(item => item.count > 0);
    },
    {
      enabled: !!stats.data,
      staleTime: 60 * 1000,
    }
  );
}

/**
 * Hook for recent order activity
 */
export function useRecentOrderActivity(limit: number = 10) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    async (signal) => {
      const { data, error } = await client
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          total_amount,
          status,
          created_at,
          updated_at
        `)
        .eq('site_id', siteId!)
        .order('updated_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!siteId,
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // 1 minute
    }
  );
}

// Export types for consumers
export type { 
  OrderStats 
};