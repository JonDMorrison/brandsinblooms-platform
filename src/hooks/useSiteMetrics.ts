import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/lib/queries/keys';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/contexts/SiteContext';
import {
  getCurrentMetrics,
  getMetricsHistory,
  getMetricsByDate,
  saveMetrics,
  getMetricsSummary,
  compareMetrics,
  batchUpdateMetrics,
  generateSampleMetrics,
  SiteMetricsData,
  MetricsHistory,
} from '@/src/lib/queries/domains/metrics';
import { toast } from 'sonner';

// Hook for current metrics
export function useSiteMetrics() {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useQuery<SiteMetricsData | null>({
    queryKey: queryKeys.metrics.current(siteId!),
    queryFn: () => getCurrentMetrics(client, siteId!),
    enabled: !!siteId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Hook for metrics history
export function useMetricsHistory(days: number = 30) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useQuery<MetricsHistory[]>({
    queryKey: queryKeys.metrics.history(siteId!, days),
    queryFn: () => getMetricsHistory(client, siteId!, days),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for metrics by specific date
export function useMetricsByDate(date: string) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useQuery<SiteMetricsData | null>({
    queryKey: queryKeys.metrics.byDate(siteId!, date),
    queryFn: () => getMetricsByDate(client, siteId!, date),
    enabled: !!siteId && !!date,
  });
}

// Hook for saving metrics
export function useSaveMetrics() {
  const client = useSupabase();
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ metrics, date }: { metrics: SiteMetricsData; date?: string }) =>
      saveMetrics(client, siteId!, metrics, date),
    onSuccess: (_, variables) => {
      // Invalidate current metrics
      queryClient.invalidateQueries({
        queryKey: queryKeys.metrics.current(siteId!),
      });
      
      // Invalidate history
      queryClient.invalidateQueries({
        queryKey: queryKeys.metrics.all(siteId!),
      });
      
      // If a specific date was saved, invalidate that too
      if (variables.date) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.metrics.byDate(siteId!, variables.date),
        });
      }
      
      toast.success('Metrics saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save metrics');
      console.error('Save metrics error:', error);
    },
  });
}

// Hook for metrics summary
export function useMetricsSummary(days: number = 30) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.metrics.all(siteId!), 'summary', days],
    queryFn: () => getMetricsSummary(client, siteId!, days),
    enabled: !!siteId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for comparing metrics between dates
export function useCompareMetrics(date1: string, date2: string) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.metrics.all(siteId!), 'compare', date1, date2],
    queryFn: () => compareMetrics(client, siteId!, date1, date2),
    enabled: !!siteId && !!date1 && !!date2,
  });
}

// Hook for batch updating metrics
export function useBatchUpdateMetrics() {
  const client = useSupabase();
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (metricsData: Array<{ date: string; metrics: SiteMetricsData }>) =>
      batchUpdateMetrics(client, siteId!, metricsData),
    onSuccess: () => {
      // Invalidate all metrics queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.metrics.all(siteId!),
      });
      
      toast.success('Metrics batch updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to batch update metrics');
      console.error('Batch update error:', error);
    },
  });
}

// Hook for generating sample metrics (development)
export function useGenerateSampleMetrics() {
  const saveMetrics = useSaveMetrics();
  
  return useMutation({
    mutationFn: async (days: number = 30) => {
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
    onSuccess: () => {
      toast.success('Sample metrics generated successfully');
    },
    onError: (error) => {
      toast.error('Failed to generate sample metrics');
      console.error('Generate sample metrics error:', error);
    },
  });
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
    isLoading: currentMetrics.isLoading || history.isLoading || summary.isLoading,
    error: currentMetrics.error || history.error || summary.error,
  };
}