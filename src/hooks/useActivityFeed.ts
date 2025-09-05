import { useInfiniteSupabase } from '@/hooks/base/useInfiniteSupabase';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
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
  
  return useInfiniteSupabase<ActivityLogWithUser>(
    async (cursor, pageSize, signal) => {
      if (!siteId) throw new Error('Site ID is required');
      
      const result = await getActivityLogs(client, siteId, { 
        ...filters, 
        cursor,
        limit: pageSize,
      });
      
      return {
        items: result.data || [],
        nextCursor: result.nextCursor,
        hasMore: !!result.nextCursor,
      };
    },
    {
      enabled: !!siteId,
      pageSize: 20,
      persistKey: siteId ? `activity-feed-${siteId}` : undefined,
    }
  );
}

// Hook for entity-specific activity
export function useEntityActivity(
  entityType: string,
  entityId: string,
  limit: number = 10
) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseQuery<ActivityLogWithUser[]>(
    async (signal) => {
      if (!siteId || !entityType || !entityId) {
        throw new Error('Site ID, entity type, and entity ID are required');
      }
      return getEntityActivityLogs(client, siteId, entityType, entityId, limit);
    },
    {
      enabled: !!siteId && !!entityType && !!entityId,
      persistKey: `entity-activity-${entityType}-${entityId}`,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

// Hook for recent activity (dashboard widget)
export function useRecentActivity(limit: number = 10) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseQuery<ActivityLogWithUser[]>(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return getRecentActivity(client, siteId, limit);
    },
    {
      enabled: !!siteId,
      staleTime: 60 * 1000, // 1 minute
      refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
      persistKey: siteId ? `recent-activity-${siteId}-${limit}` : undefined,
    }
  );
}

// Hook for creating activity logs
export function useCreateActivity() {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseMutation<any, Omit<ActivityLogInsert, 'site_id'>>(
    async (activity: Omit<ActivityLogInsert, 'site_id'>, signal: AbortSignal) => {
      if (!siteId) throw new Error('Site ID is required');
      return createActivityLog(client, { ...activity, site_id: siteId });
    },
    {
      showSuccessToast: false,
      showErrorToast: true
    }
  );
}

// Hook for activity summary/analytics
export function useActivitySummary(days: number = 7) {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return getActivitySummary(client, siteId, days);
    },
    {
      enabled: !!siteId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      persistKey: siteId ? `activity-summary-${siteId}-${days}` : undefined,
    }
  );
}

// Hook for user activity timeline
export function useUserActivityTimeline(userId: string, limit: number = 50) {
  const client = useSupabase();
  
  return useSupabaseQuery<ActivityLogWithUser[]>(
    async (signal) => {
      if (!userId) throw new Error('User ID is required');
      return getUserActivityTimeline(client, userId, limit);
    },
    {
      enabled: !!userId,
      persistKey: `user-activity-${userId}-${limit}`,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

// Composite hook for activity dashboard
export function useActivityDashboard() {
  const recentActivity = useRecentActivity(20);
  const summary = useActivitySummary(7);
  
  return {
    recentActivity: recentActivity.data || [],
    summary: summary.data,
    isLoading: recentActivity.loading || summary.loading,
    error: recentActivity.error || summary.error,
  };
}