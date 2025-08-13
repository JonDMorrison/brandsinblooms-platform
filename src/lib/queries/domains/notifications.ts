import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database/types';
import { 
  Notification, 
  NotificationInsert, 
  NotificationUpdate,
  NotificationWithUser, 
  NotificationFilters,
  PaginatedNotifications,
  NotificationStats,
  CreateNotificationData,
  BulkNotificationAction
} from '@/lib/types/notifications';
import { SupabaseError } from '../errors';

// Re-export types for convenience
export type {
  Notification,
  NotificationInsert,
  NotificationUpdate,
  NotificationWithUser,
  NotificationFilters,
  PaginatedNotifications,
  NotificationStats,
  CreateNotificationData,
  BulkNotificationAction
};

// Get paginated notifications with cursor-based pagination
export async function getNotifications(
  client: SupabaseClient<Database>,
  siteId: string,
  userId: string,
  filters: NotificationFilters = {}
): Promise<PaginatedNotifications> {
  const { 
    isRead,
    isArchived,
    category,
    type,
    priority,
    relatedEntityType,
    relatedEntityId,
    dateFrom,
    dateTo,
    cursor,
    limit = 20
  } = filters;
  
  let query = client
    .from('notifications')
    .select('*')
    .eq('site_id', siteId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check if there are more
  
  // Apply cursor-based pagination
  if (cursor) {
    query = query.lt('created_at', cursor);
  }
  
  // Apply filters
  if (typeof isRead === 'boolean') {
    query = query.eq('is_read', isRead);
  }
  
  if (typeof isArchived === 'boolean') {
    query = query.eq('is_archived', isArchived);
  }
  
  if (category) {
    query = query.eq('category', category);
  }
  
  if (type) {
    query = query.eq('type', type);
  }
  
  if (priority) {
    query = query.eq('priority', priority);
  }
  
  if (relatedEntityType) {
    query = query.eq('related_entity_type', relatedEntityType);
  }
  
  if (relatedEntityId) {
    query = query.eq('related_entity_id', relatedEntityId);
  }
  
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }
  
  const { data, error } = await query;
  if (error) throw new SupabaseError(error.message, error.code);
  if (!data) return { notifications: [], nextCursor: null, hasMore: false };
  
  const hasMore = data.length > limit;
  const notifications = hasMore ? data.slice(0, -1) : data;
  const nextCursor = hasMore ? notifications[notifications.length - 1]?.created_at : null;
  
  return {
    notifications: notifications as NotificationWithUser[],
    nextCursor,
    hasMore,
  };
}

// Get count of unread notifications
export async function getUnreadNotificationCount(
  client: SupabaseClient<Database>,
  siteId: string,
  userId: string
): Promise<number> {
  const { count, error } = await client
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('user_id', userId)
    .eq('is_read', false)
    .eq('is_archived', false);
  
  if (error) throw new SupabaseError(error.message, error.code);
  return count || 0;
}

// Get notification statistics
export async function getNotificationStats(
  client: SupabaseClient<Database>,
  siteId: string,
  userId: string
): Promise<NotificationStats> {
  const { data: notifications, error } = await client
    .from('notifications')
    .select('category, type, priority, is_read')
    .eq('site_id', siteId)
    .eq('user_id', userId)
    .eq('is_archived', false);
  
  if (error) throw new SupabaseError(error.message, error.code);
  
  const stats: NotificationStats = {
    total: notifications.length,
    unread: 0,
    unreadByCategory: {},
    unreadByPriority: {},
    byCategory: {},
    byType: {},
  };
  
  notifications.forEach(notification => {
    // Count by category
    stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1;
    
    // Count by type
    stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
    
    // Count unread
    if (!notification.is_read) {
      stats.unread++;
      stats.unreadByCategory[notification.category] = (stats.unreadByCategory[notification.category] || 0) + 1;
      stats.unreadByPriority[notification.priority] = (stats.unreadByPriority[notification.priority] || 0) + 1;
    }
  });
  
  return stats;
}

// Mark single notification as read
export async function markNotificationAsRead(
  client: SupabaseClient<Database>,
  notificationId: string,
  userId: string
): Promise<Notification> {
  const { data, error } = await client
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) throw new SupabaseError(error.message, error.code);
  if (!data) throw new SupabaseError('Notification not found or not updated', 'UPDATE_FAILED');
  return data;
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(
  client: SupabaseClient<Database>,
  siteId: string,
  userId: string
): Promise<{ count: number }> {
  const { data, error } = await client
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('site_id', siteId)
    .eq('user_id', userId)
    .eq('is_read', false)
    .select();
  
  if (error) throw new SupabaseError(error.message, error.code);
  
  const count = data?.length || 0;
  return { count };
}

// Mark notification as unread
export async function markNotificationAsUnread(
  client: SupabaseClient<Database>,
  notificationId: string,
  userId: string
): Promise<Notification> {
  const { data, error } = await client
    .from('notifications')
    .update({ 
      is_read: false, 
      read_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) throw new SupabaseError(error.message, error.code);
  if (!data) throw new SupabaseError('Notification not found or not updated', 'UPDATE_FAILED');
  return data;
}

// Archive notification
export async function archiveNotification(
  client: SupabaseClient<Database>,
  notificationId: string,
  userId: string
): Promise<Notification> {
  const { data, error } = await client
    .from('notifications')
    .update({ 
      is_archived: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) throw new SupabaseError(error.message, error.code);
  if (!data) throw new SupabaseError('Notification not found or not updated', 'UPDATE_FAILED');
  return data;
}

// Unarchive notification
export async function unarchiveNotification(
  client: SupabaseClient<Database>,
  notificationId: string,
  userId: string
): Promise<Notification> {
  const { data, error } = await client
    .from('notifications')
    .update({ 
      is_archived: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) throw new SupabaseError(error.message, error.code);
  if (!data) throw new SupabaseError('Notification not found or not updated', 'UPDATE_FAILED');
  return data;
}

// Delete notification
export async function deleteNotification(
  client: SupabaseClient<Database>,
  notificationId: string,
  userId: string
): Promise<void> {
  const { error } = await client
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId);
  
  if (error) throw new SupabaseError(error.message, error.code);
}

// Create notification
export async function createNotification(
  client: SupabaseClient<Database>,
  siteId: string,
  userId: string,
  data: CreateNotificationData
): Promise<Notification> {
  const notificationData: NotificationInsert = {
    site_id: siteId,
    user_id: userId,
    title: data.title,
    message: data.message,
    category: data.category,
    type: data.type,
    priority: data.priority || 'medium',
    action_url: data.actionUrl || null,
    related_entity_type: data.relatedEntityType || null,
    related_entity_id: data.relatedEntityId || null,
    data: data.data ? JSON.parse(JSON.stringify(data.data)) : null,
    is_read: false,
    is_archived: false,
  };
  
  const { data: notification, error } = await client
    .from('notifications')
    .insert(notificationData)
    .select()
    .single();
  
  if (error) throw new SupabaseError(error.message, error.code);
  if (!notification) throw new SupabaseError('Notification not created', 'INSERT_FAILED');
  return notification;
}

// Bulk operations on notifications
export async function bulkNotificationAction(
  client: SupabaseClient<Database>,
  userId: string,
  action: BulkNotificationAction
): Promise<{ count: number }> {
  const { notificationIds, action: actionType } = action;
  
  let updateData: Partial<NotificationUpdate>;
  const timestamp = new Date().toISOString();
  
  switch (actionType) {
    case 'markAsRead':
      updateData = { 
        is_read: true, 
        read_at: timestamp,
        updated_at: timestamp
      };
      break;
    case 'markAsUnread':
      updateData = { 
        is_read: false, 
        read_at: null,
        updated_at: timestamp
      };
      break;
    case 'archive':
      updateData = { 
        is_archived: true,
        updated_at: timestamp
      };
      break;
    case 'unarchive':
      updateData = { 
        is_archived: false,
        updated_at: timestamp
      };
      break;
    case 'delete':
      const { data: deletedData, error: deleteError } = await client
        .from('notifications')
        .delete()
        .in('id', notificationIds)
        .eq('user_id', userId)
        .select();
      
      if (deleteError) throw new SupabaseError(deleteError.message, deleteError.code);
      return { count: deletedData?.length || 0 };
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
  
  const { data, error } = await client
    .from('notifications')
    .update(updateData)
    .in('id', notificationIds)
    .eq('user_id', userId)
    .select();
  
  if (error) throw new SupabaseError(error.message, error.code);
  return { count: data?.length || 0 };
}

// Get notifications for a specific entity
export async function getEntityNotifications(
  client: SupabaseClient<Database>,
  siteId: string,
  userId: string,
  entityType: string,
  entityId: string,
  limit: number = 10
): Promise<NotificationWithUser[]> {
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('site_id', siteId)
    .eq('user_id', userId)
    .eq('related_entity_type', entityType)
    .eq('related_entity_id', entityId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw new SupabaseError(error.message, error.code);
  
  return (data || []) as NotificationWithUser[];
}

// Helper functions for common notification types
export const notificationHelpers = {
  orderStatusChanged: (
    siteId: string,
    userId: string,
    orderId: string,
    orderNumber: string,
    newStatus: string
  ): CreateNotificationData => ({
    title: `Order #${orderNumber} Status Updated`,
    message: `Your order status has been changed to ${newStatus}`,
    category: 'orders',
    type: 'order_status_changed',
    priority: 'medium',
    actionUrl: `/dashboard/orders/${orderId}`,
    relatedEntityType: 'orders',
    relatedEntityId: orderId,
    data: { order_number: orderNumber, new_status: newStatus },
  }),
  
  newMessage: (
    siteId: string,
    userId: string,
    messageId: string,
    senderName: string
  ): CreateNotificationData => ({
    title: 'New Message',
    message: `You have a new message from ${senderName}`,
    category: 'messages',
    type: 'new_message',
    priority: 'medium',
    actionUrl: `/dashboard/messages/${messageId}`,
    relatedEntityType: 'messages',
    relatedEntityId: messageId,
    data: { sender_name: senderName },
  }),
  
  paymentReceived: (
    siteId: string,
    userId: string,
    orderId: string,
    amount: number,
    currency: string
  ): CreateNotificationData => ({
    title: 'Payment Received',
    message: `Payment of ${currency}${amount} has been received`,
    category: 'payments',
    type: 'payment_received',
    priority: 'high',
    actionUrl: `/dashboard/orders/${orderId}`,
    relatedEntityType: 'orders',
    relatedEntityId: orderId,
    data: { amount, currency },
  }),
  
  systemAlert: (
    siteId: string,
    userId: string,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): CreateNotificationData => ({
    title,
    message,
    category: 'system',
    type: 'alert',
    priority,
    data: {},
  }),
};