import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/src/lib/database/types';
import { ActivityLog, ActivityLogInsert } from '@/src/lib/database/aliases';
import { executeQuery } from '@/src/lib/queries/utils/execute-query';
import { SupabaseError } from '../errors';

export interface ActivityFilters {
  type?: string;
  entityType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}

export interface ActivityLogWithUser extends ActivityLog {
  user?: {
    user_id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface PaginatedActivities {
  activities: ActivityLogWithUser[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Get paginated activity logs
export async function getActivityLogs(
  client: SupabaseClient<Database>,
  siteId: string,
  filters: ActivityFilters = {}
): Promise<PaginatedActivities> {
  const { 
    type, 
    entityType, 
    userId, 
    dateFrom, 
    dateTo, 
    cursor, 
    limit = 20 
  } = filters;
  
  let query = client
    .from('activity_logs')
    .select(`
      *,
      user:profiles!user_id(
        user_id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check if there are more
  
  // Apply cursor-based pagination
  if (cursor) {
    query = query.lt('created_at', cursor);
  }
  
  // Apply filters
  if (type) {
    query = query.eq('activity_type', type);
  }
  
  if (entityType) {
    query = query.eq('entity_type', entityType);
  }
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }
  
  const { data, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  if (!data) return { activities: [], nextCursor: null, hasMore: false };
  
  const hasMore = data.length > limit;
  const activities = hasMore ? data.slice(0, -1) : data;
  const nextCursor = hasMore ? activities[activities.length - 1]?.created_at : null;
  
  return {
    activities: activities.map(activity => ({
      ...activity,
      user: activity.user && !('error' in activity.user) ? activity.user : undefined
    })) as ActivityLogWithUser[],
    nextCursor,
    hasMore,
  };
}

// Get activity logs for a specific entity
export async function getEntityActivityLogs(
  client: SupabaseClient<Database>,
  siteId: string,
  entityType: string,
  entityId: string,
  limit: number = 10
): Promise<ActivityLogWithUser[]> {
  const query = client
    .from('activity_logs')
    .select(`
      *,
      user:profiles!user_id(
        user_id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('site_id', siteId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  const { data, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  
  return (data || []).map(activity => ({
    ...activity,
    user: activity.user && !('error' in activity.user) ? activity.user : undefined
  })) as ActivityLogWithUser[];
}

// Get recent activity for dashboard
export async function getRecentActivity(
  client: SupabaseClient<Database>,
  siteId: string,
  limit: number = 10
): Promise<ActivityLogWithUser[]> {
  const query = client
    .from('activity_logs')
    .select(`
      *,
      user:profiles!user_id(
        user_id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  const { data, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  
  return (data || []).map(activity => ({
    ...activity,
    user: activity.user && !('error' in activity.user) ? activity.user : undefined
  })) as ActivityLogWithUser[];
}

// Create activity log
export async function createActivityLog(
  client: SupabaseClient<Database>,
  activity: ActivityLogInsert
): Promise<ActivityLog> {
  const query = client
    .from('activity_logs')
    .insert(activity)
    .select()
    .single();
  
  const { data, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  if (!data) throw new SupabaseError('Activity log not created', 'INSERT_FAILED');
  return data;
}

// Get activity summary by type
export async function getActivitySummary(
  client: SupabaseClient<Database>,
  siteId: string,
  days: number = 7
): Promise<{
  byType: Record<string, number>;
  byEntityType: Record<string, number>;
  byDay: Array<{ date: string; count: number }>;
  totalActivities: number;
}> {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);
  
  const query = client
    .from('activity_logs')
    .select('activity_type, entity_type, created_at')
    .eq('site_id', siteId)
    .gte('created_at', dateFrom.toISOString());
  
  const { data: activities, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  
  // Group by type
  const byType: Record<string, number> = {};
  const byEntityType: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  
  activities.forEach(activity => {
    // Count by activity type
    byType[activity.activity_type] = (byType[activity.activity_type] || 0) + 1;
    
    // Count by entity type
    byEntityType[activity.entity_type] = (byEntityType[activity.entity_type] || 0) + 1;
    
    // Count by day
    const date = new Date(activity.created_at).toISOString().split('T')[0];
    byDay[date] = (byDay[date] || 0) + 1;
  });
  
  // Convert byDay to array and fill missing days
  const dayArray = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dayArray.unshift({
      date: dateStr,
      count: byDay[dateStr] || 0,
    });
  }
  
  return {
    byType,
    byEntityType,
    byDay: dayArray,
    totalActivities: activities.length,
  };
}

// Get user activity timeline
export async function getUserActivityTimeline(
  client: SupabaseClient<Database>,
  userId: string,
  limit: number = 50
): Promise<ActivityLogWithUser[]> {
  const query = client
    .from('activity_logs')
    .select(`
      *,
      user:profiles!user_id(
        user_id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  const { data, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  
  return (data || []).map(activity => ({
    ...activity,
    user: activity.user && !('error' in activity.user) ? activity.user : undefined
  })) as ActivityLogWithUser[];
}

// Group activities by date for UI display
export function groupActivitiesByDate(
  activities: ActivityLogWithUser[]
): Record<string, ActivityLogWithUser[]> {
  const grouped: Record<string, ActivityLogWithUser[]> = {};
  
  activities.forEach(activity => {
    const date = new Date(activity.created_at).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(activity);
  });
  
  return grouped;
}

// Format activity date for display
export function formatActivityDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

// Helper to create activity log entries for common actions
export const activityHelpers = {
  orderCreated: (siteId: string, orderId: string, orderNumber: string): ActivityLogInsert => ({
    site_id: siteId,
    activity_type: 'order_created',
    entity_type: 'orders',
    entity_id: orderId,
    title: `New order ${orderNumber} created`,
    metadata: { order_number: orderNumber },
  }),
  
  orderStatusChanged: (
    siteId: string, 
    orderId: string, 
    orderNumber: string, 
    oldStatus: string, 
    newStatus: string
  ): ActivityLogInsert => ({
    site_id: siteId,
    activity_type: 'order_status_changed',
    entity_type: 'orders',
    entity_id: orderId,
    title: `Order ${orderNumber} status changed from ${oldStatus} to ${newStatus}`,
    metadata: { order_number: orderNumber, old_status: oldStatus, new_status: newStatus },
  }),
  
  productCreated: (siteId: string, productId: string, productTitle: string): ActivityLogInsert => ({
    site_id: siteId,
    activity_type: 'product_created',
    entity_type: 'products',
    entity_id: productId,
    title: `New product "${productTitle}" created`,
    metadata: { product_title: productTitle },
  }),
  
  contentPublished: (siteId: string, contentId: string, contentTitle: string): ActivityLogInsert => ({
    site_id: siteId,
    activity_type: 'content_published',
    entity_type: 'content',
    entity_id: contentId,
    title: `Content "${contentTitle}" published`,
    metadata: { content_title: contentTitle },
  }),
  
  userInvited: (siteId: string, email: string, role: string): ActivityLogInsert => ({
    site_id: siteId,
    activity_type: 'user_invited',
    entity_type: 'site_memberships',
    entity_id: crypto.randomUUID(), // Temporary ID
    title: `User ${email} invited as ${role}`,
    metadata: { email, role },
  }),
};