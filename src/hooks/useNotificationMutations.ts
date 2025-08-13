'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries/keys';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/contexts/SiteContext';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  archiveNotification,
  unarchiveNotification,
  deleteNotification,
  createNotification,
  bulkNotificationAction,
  CreateNotificationData,
  BulkNotificationAction,
} from '@/lib/queries/domains/notifications';
import { toast } from 'sonner';

// Hook for marking a single notification as read
export function useMarkNotificationAsRead() {
  const client = useSupabase();
  const queryClient = useQueryClient();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationAsRead(client, notificationId, user?.id!),
    onMutate: async (notificationId) => {
      if (!siteId || !user?.id) return;
      
      // Optimistically update unread count
      const unreadCountKey = queryKeys.notifications.unreadCount(siteId, user.id);
      const previousCount = queryClient.getQueryData<number>(unreadCountKey) || 0;
      queryClient.setQueryData(unreadCountKey, Math.max(0, previousCount - 1));
      
      // Optimistically update notification in lists
      const listKeys = [
        queryKeys.notifications.lists(siteId, user.id),
        queryKeys.notifications.all(siteId, user.id),
      ];
      
      listKeys.forEach(baseKey => {
        queryClient.invalidateQueries({ queryKey: baseKey });
      });
      
      return { previousCount };
    },
    onError: (error, notificationId, context) => {
      if (!siteId || !user?.id || !context) return;
      
      // Revert optimistic update on error
      const unreadCountKey = queryKeys.notifications.unreadCount(siteId, user.id);
      queryClient.setQueryData(unreadCountKey, context.previousCount);
      
      toast.error('Failed to mark notification as read');
    },
    onSuccess: () => {
      if (!siteId || !user?.id) return;
      
      // Invalidate all notification queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(siteId, user.id),
      });
    },
  });
}

// Hook for marking a notification as unread
export function useMarkNotificationAsUnread() {
  const client = useSupabase();
  const queryClient = useQueryClient();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationAsUnread(client, notificationId, user?.id!),
    onMutate: async (notificationId) => {
      if (!siteId || !user?.id) return;
      
      // Optimistically update unread count
      const unreadCountKey = queryKeys.notifications.unreadCount(siteId, user.id);
      const previousCount = queryClient.getQueryData<number>(unreadCountKey) || 0;
      queryClient.setQueryData(unreadCountKey, previousCount + 1);
      
      return { previousCount };
    },
    onError: (error, notificationId, context) => {
      if (!siteId || !user?.id || !context) return;
      
      // Revert optimistic update on error
      const unreadCountKey = queryKeys.notifications.unreadCount(siteId, user.id);
      queryClient.setQueryData(unreadCountKey, context.previousCount);
      
      toast.error('Failed to mark notification as unread');
    },
    onSuccess: () => {
      if (!siteId || !user?.id) return;
      
      // Invalidate all notification queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(siteId, user.id),
      });
    },
  });
}

// Hook for marking all notifications as read
export function useMarkAllNotificationsAsRead() {
  const client = useSupabase();
  const queryClient = useQueryClient();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: () =>
      markAllNotificationsAsRead(client, siteId!, user?.id!),
    onMutate: async () => {
      if (!siteId || !user?.id) return;
      
      // Optimistically set unread count to 0
      const unreadCountKey = queryKeys.notifications.unreadCount(siteId, user.id);
      const previousCount = queryClient.getQueryData<number>(unreadCountKey) || 0;
      queryClient.setQueryData(unreadCountKey, 0);
      
      return { previousCount };
    },
    onError: (error, variables, context) => {
      if (!siteId || !user?.id || !context) return;
      
      // Revert optimistic update on error
      const unreadCountKey = queryKeys.notifications.unreadCount(siteId, user.id);
      queryClient.setQueryData(unreadCountKey, context.previousCount);
      
      toast.error('Failed to mark all notifications as read');
    },
    onSuccess: (result) => {
      if (!siteId || !user?.id) return;
      
      // Invalidate all notification queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(siteId, user.id),
      });
      
      toast.success(`Marked ${result.count} notifications as read`);
    },
  });
}

// Hook for archiving a notification
export function useArchiveNotification() {
  const client = useSupabase();
  const queryClient = useQueryClient();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      archiveNotification(client, notificationId, user?.id!),
    onSuccess: () => {
      if (!siteId || !user?.id) return;
      
      // Invalidate notification queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(siteId, user.id),
      });
      
      toast.success('Notification archived');
    },
    onError: () => {
      toast.error('Failed to archive notification');
    },
  });
}

// Hook for unarchiving a notification
export function useUnarchiveNotification() {
  const client = useSupabase();
  const queryClient = useQueryClient();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      unarchiveNotification(client, notificationId, user?.id!),
    onSuccess: () => {
      if (!siteId || !user?.id) return;
      
      // Invalidate notification queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(siteId, user.id),
      });
      
      toast.success('Notification unarchived');
    },
    onError: () => {
      toast.error('Failed to unarchive notification');
    },
  });
}

// Hook for deleting a notification
export function useDeleteNotification() {
  const client = useSupabase();
  const queryClient = useQueryClient();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      deleteNotification(client, notificationId, user?.id!),
    onMutate: async (notificationId) => {
      if (!siteId || !user?.id) return;
      
      // Remove from cache optimistically
      const detailKey = queryKeys.notifications.detail(siteId, user.id, notificationId);
      queryClient.removeQueries({ queryKey: detailKey });
      
      // Update unread count if notification was unread
      // Note: This is a simplified approach - in practice you might want to check if the notification was unread first
      const unreadCountKey = queryKeys.notifications.unreadCount(siteId, user.id);
      const previousCount = queryClient.getQueryData<number>(unreadCountKey) || 0;
      queryClient.setQueryData(unreadCountKey, Math.max(0, previousCount - 1));
      
      return { previousCount };
    },
    onError: (error, notificationId, context) => {
      if (!siteId || !user?.id || !context) return;
      
      // Revert unread count on error
      const unreadCountKey = queryKeys.notifications.unreadCount(siteId, user.id);
      queryClient.setQueryData(unreadCountKey, context.previousCount);
      
      toast.error('Failed to delete notification');
    },
    onSuccess: () => {
      if (!siteId || !user?.id) return;
      
      // Invalidate notification lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.lists(siteId, user.id),
      });
      
      toast.success('Notification deleted');
    },
  });
}

// Hook for creating a notification
export function useCreateNotification() {
  const client = useSupabase();
  const queryClient = useQueryClient();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (data: CreateNotificationData) =>
      createNotification(client, siteId!, user?.id!, data),
    onSuccess: () => {
      if (!siteId || !user?.id) return;
      
      // Invalidate all notification queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(siteId, user.id),
      });
      
      // Update unread count
      const unreadCountKey = queryKeys.notifications.unreadCount(siteId, user.id);
      queryClient.invalidateQueries({ queryKey: unreadCountKey });
      
      toast.success('Notification created');
    },
    onError: () => {
      toast.error('Failed to create notification');
    },
  });
}

// Hook for bulk notification actions
export function useBulkNotificationAction() {
  const client = useSupabase();
  const queryClient = useQueryClient();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (action: BulkNotificationAction) =>
      bulkNotificationAction(client, user?.id!, action),
    onMutate: async (action) => {
      if (!siteId || !user?.id) return;
      
      // Optimistically update unread count for read/unread actions
      if (action.action === 'markAsRead') {
        const unreadCountKey = queryKeys.notifications.unreadCount(siteId, user.id);
        const previousCount = queryClient.getQueryData<number>(unreadCountKey) || 0;
        queryClient.setQueryData(unreadCountKey, Math.max(0, previousCount - action.notificationIds.length));
        return { previousCount, action: action.action };
      } else if (action.action === 'markAsUnread') {
        const unreadCountKey = queryKeys.notifications.unreadCount(siteId, user.id);
        const previousCount = queryClient.getQueryData<number>(unreadCountKey) || 0;
        queryClient.setQueryData(unreadCountKey, previousCount + action.notificationIds.length);
        return { previousCount, action: action.action };
      }
    },
    onError: (error, variables, context) => {
      if (!siteId || !user?.id || !context) return;
      
      // Revert optimistic updates on error
      if (context.action === 'markAsRead' || context.action === 'markAsUnread') {
        const unreadCountKey = queryKeys.notifications.unreadCount(siteId, user.id);
        queryClient.setQueryData(unreadCountKey, context.previousCount);
      }
      
      toast.error(`Failed to ${variables.action.replace(/([A-Z])/g, ' $1').toLowerCase()} notifications`);
    },
    onSuccess: (result, variables) => {
      if (!siteId || !user?.id) return;
      
      // Invalidate all notification queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(siteId, user.id),
      });
      
      const actionText = variables.action.replace(/([A-Z])/g, ' $1').toLowerCase();
      toast.success(`Successfully ${actionText} ${result.count} notifications`);
    },
  });
}

// Convenience hooks for specific bulk actions
export function useBulkMarkAsRead() {
  const bulkAction = useBulkNotificationAction();
  
  return {
    ...bulkAction,
    mutate: (notificationIds: string[]) =>
      bulkAction.mutate({ notificationIds, action: 'markAsRead' }),
    mutateAsync: (notificationIds: string[]) =>
      bulkAction.mutateAsync({ notificationIds, action: 'markAsRead' }),
  };
}

export function useBulkMarkAsUnread() {
  const bulkAction = useBulkNotificationAction();
  
  return {
    ...bulkAction,
    mutate: (notificationIds: string[]) =>
      bulkAction.mutate({ notificationIds, action: 'markAsUnread' }),
    mutateAsync: (notificationIds: string[]) =>
      bulkAction.mutateAsync({ notificationIds, action: 'markAsUnread' }),
  };
}

export function useBulkArchive() {
  const bulkAction = useBulkNotificationAction();
  
  return {
    ...bulkAction,
    mutate: (notificationIds: string[]) =>
      bulkAction.mutate({ notificationIds, action: 'archive' }),
    mutateAsync: (notificationIds: string[]) =>
      bulkAction.mutateAsync({ notificationIds, action: 'archive' }),
  };
}

export function useBulkDelete() {
  const bulkAction = useBulkNotificationAction();
  
  return {
    ...bulkAction,
    mutate: (notificationIds: string[]) =>
      bulkAction.mutate({ notificationIds, action: 'delete' }),
    mutateAsync: (notificationIds: string[]) =>
      bulkAction.mutateAsync({ notificationIds, action: 'delete' }),
  };
}