import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries/keys';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/contexts/SiteContext';
import {
  getActivityLogs,
  getEntityActivityLogs,
  getRecentActivity,
  createActivityLog,
  getActivitySummary,
  getUserActivityTimeline,
  ActivityFilters,
  ActivityLogWithUser,
} from '@/lib/queries/domains/activity';
import { ActivityLogInsert } from '@/lib/database/aliases';

// Hook for paginated activity feed
export function useActivityFeed(filters?: ActivityFilters) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useInfiniteQuery({
    queryKey: queryKeys.activity.list(siteId!, filters),
    queryFn: ({ pageParam }) => 
      getActivityLogs(client, siteId!, { 
        ...filters, 
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!siteId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook for entity-specific activity
export function useEntityActivity(
  entityType: string,
  entityId: string,
  limit: number = 10
) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useQuery<ActivityLogWithUser[]>({
    queryKey: queryKeys.activity.byEntity(siteId!, entityType, entityId),
    queryFn: () => getEntityActivityLogs(client, siteId!, entityType, entityId, limit),
    enabled: !!siteId && !!entityType && !!entityId,
  });
}

// Hook for recent activity (dashboard widget)
export function useRecentActivity(limit: number = 10) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useQuery<ActivityLogWithUser[]>({
    queryKey: [...queryKeys.activity.all(siteId!), 'recent', limit],
    queryFn: () => getRecentActivity(client, siteId!, limit),
    enabled: !!siteId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

// Hook for creating activity logs
export function useCreateActivity() {
  const client = useSupabase();
  const queryClient = useQueryClient();
  const siteId = useSiteId();
  
  return useMutation({
    mutationFn: (activity: Omit<ActivityLogInsert, 'site_id'>) =>
      createActivityLog(client, { ...activity, site_id: siteId! }),
    onSuccess: () => {
      // Invalidate all activity queries for this site
      queryClient.invalidateQueries({
        queryKey: queryKeys.activity.all(siteId!),
      });
    },
  });
}

// Hook for activity summary/analytics
export function useActivitySummary(days: number = 7) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.activity.all(siteId!), 'summary', days],
    queryFn: () => getActivitySummary(client, siteId!, days),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for user activity timeline
export function useUserActivityTimeline(userId: string, limit: number = 50) {
  const client = useSupabase();
  
  return useQuery<ActivityLogWithUser[]>({
    queryKey: ['users', userId, 'activity', limit],
    queryFn: () => getUserActivityTimeline(client, userId, limit),
    enabled: !!userId,
  });
}

// Composite hook for activity dashboard
export function useActivityDashboard() {
  const recentActivity = useRecentActivity(20);
  const summary = useActivitySummary(7);
  
  return {
    recentActivity: recentActivity.data || [],
    summary: summary.data,
    isLoading: recentActivity.isLoading || summary.isLoading,
    error: recentActivity.error || summary.error,
  };
}