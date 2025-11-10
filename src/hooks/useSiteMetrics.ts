import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
import {
  getCurrentMetrics,
  getMetricsHistory,
  getMetricsByDate,
  saveMetrics,
  getMetricsSummary,
  compareMetrics,
  batchUpdateMetrics,
  generateSampleMetrics,
} from '@/src/lib/queries/domains/metrics';
import type { SiteMetrics } from '@/src/lib/database/aliases';
import type { MetricsHistory as MetricsHistoryType } from '@/src/lib/queries/domains/metrics';
import { toast } from 'sonner';

// Hook for current metrics
export function useSiteMetrics() {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseQuery<SiteMetrics | null>(
    async (signal: AbortSignal) => {
      if (!siteId) return null;
      return getCurrentMetrics(client, siteId);
    },
    {
      enabled: !!siteId,
      staleTime: 60 * 1000, // 1 minute
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );
}

// Hook for metrics history
export function useMetricsHistory(days: number = 30) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseQuery<MetricsHistoryType[]>(
    async (signal: AbortSignal) => {
      if (!siteId) return [];
      return getMetricsHistory(client, siteId, days);
    },
    {
      enabled: !!siteId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

// Hook for metrics by specific date
export function useMetricsByDate(date: string) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseQuery<SiteMetrics | null>(
    async (signal: AbortSignal) => {
      if (!siteId || !date) return null;
      return getMetricsByDate(client, siteId, date);
    },
    {
      enabled: !!siteId && !!date,
    }
  );
}

// Hook for saving metrics
export function useSaveMetrics() {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async ({ metrics, date }: { metrics: Partial<SiteMetrics>; date?: string }, signal: AbortSignal) => {
      if (!siteId) throw new Error('Site ID is required');
      
      // Convert nulls to undefined for saveMetrics
      const metricsData = {
        unique_visitors: metrics.unique_visitors ?? undefined,
        page_views: metrics.page_views ?? undefined,
        content_count: metrics.content_count ?? undefined,
        product_count: metrics.product_count ?? undefined,
        inquiry_count: metrics.inquiry_count ?? undefined,
      }
      return saveMetrics(client, siteId, metricsData, date);
    },
    {
      showSuccessToast: 'Metrics saved successfully'
    }
  );
}

// Hook for metrics summary
export function useMetricsSummary(days: number = 30) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    async (signal: AbortSignal) => {
      if (!siteId) return null;
      return getMetricsSummary(client, siteId, days);
    },
    {
      enabled: !!siteId,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

// Hook for comparing metrics between dates
export function useCompareMetrics(date1: string, date2: string) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    async (signal: AbortSignal) => {
      if (!siteId || !date1 || !date2) return null;
      return compareMetrics(client, siteId, date1, date2);
    },
    {
      enabled: !!siteId && !!date1 && !!date2,
    }
  );
}

// Hook for batch updating metrics
export function useBatchUpdateMetrics() {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async (metricsData: Array<{ date: string; metrics: Partial<SiteMetrics> }>, signal: AbortSignal) => {
      if (!siteId) throw new Error('Site ID is required');
      return batchUpdateMetrics(client, siteId, metricsData as any);
    },
    {
      showSuccessToast: 'Metrics batch updated successfully'
    }
  );
}

// Hook for generating sample metrics (development)
export function useGenerateSampleMetrics() {
  const saveMetrics = useSaveMetrics();
  
  return useSupabaseMutation(
    async (days: number = 30, signal: AbortSignal) => {
      const metricsData = [];
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        metricsData.push({
          date: dateStr,
          metrics: generateSampleMetrics(),
        });
      }
      
      // Save each day's metrics
      for (const { date, metrics } of metricsData) {
        await saveMetrics.mutateAsync({ metrics, date });
      }
      
      return metricsData;
    },
    {
      showSuccessToast: 'Sample metrics generated successfully'
    }
  );
}

// Composite hook for metrics dashboard
export function useMetricsDashboard() {
  const currentMetrics = useSiteMetrics();
  const history = useMetricsHistory(30);
  const summary = useMetricsSummary(30);
  
  return {
    current: currentMetrics.data,
    history: history.data || [],
    summary: summary.data,
    isLoading: currentMetrics.loading || history.loading || summary.loading,
    error: currentMetrics.error || history.error || summary.error,
  };
}