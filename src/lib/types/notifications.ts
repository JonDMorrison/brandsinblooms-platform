import { Tables, TablesInsert, TablesUpdate } from '@/lib/database/types';

// Notification database types
export type Notification = Tables<'notifications'>;
export type NotificationInsert = TablesInsert<'notifications'>;
export type NotificationUpdate = TablesUpdate<'notifications'>;

// Notification with user profile information
export interface NotificationWithUser extends Notification {
  user?: {
    user_id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

// Notification filters for querying
export interface NotificationFilters {
  isRead?: boolean;
  isArchived?: boolean;
  category?: string;
  type?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  relatedEntityType?: string;
  relatedEntityId?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}

// Paginated notifications response
export interface PaginatedNotifications {
  notifications: NotificationWithUser[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Notification statistics
export interface NotificationStats {
  total: number;
  unread: number;
  unreadByCategory: Record<string, number>;
  unreadByPriority: Record<string, number>;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
}

// Notification creation helper types
export interface CreateNotificationData {
  title: string;
  message: string;
  category: string;
  type: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  relatedEntityType?: string;
  relatedEntityId?: string | null;
  data?: Record<string, unknown>;
}

// Bulk notification operations
export interface BulkNotificationAction {
  notificationIds: string[];
  action: 'markAsRead' | 'markAsUnread' | 'archive' | 'unarchive' | 'delete';
}

// Notification preference types
export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  categories: Record<string, {
    email: boolean;
    push: boolean;
    priority: string;
  }>;
}

// Real-time notification event types
export interface NotificationRealtimePayload {
  notification: NotificationWithUser;
  action: 'created' | 'updated' | 'deleted';
  userId: string;
  siteId: string;
}

// Helper types for notification grouping
export interface NotificationGroup {
  date: string;
  notifications: NotificationWithUser[];
  unreadCount: number;
}

// Notification template types
export interface NotificationTemplate {
  category: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  variables: Record<string, string>;
}

// Notification action types for UI
export type NotificationAction = 
  | { type: 'view'; url: string }
  | { type: 'approve'; entityId: string }
  | { type: 'reject'; entityId: string }
  | { type: 'acknowledge' }
  | { type: 'custom'; handler: () => void };