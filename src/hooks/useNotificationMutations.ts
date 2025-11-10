'use client';

import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
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
} from '@/src/lib/queries/domains/notifications';

// Hook for marking a single notification as read
export function useMarkNotificationAsRead() {
  const client = useSupabase();
  const { user } = useAuth();
  
  return useSupabaseMutation(
    (notificationId: string) => markNotificationAsRead(client, notificationId, user?.id!),
    {
      showSuccessToast: 'Notification marked as read',
      showErrorToast: true
    }
  );
}

// Hook for marking a notification as unread
export function useMarkNotificationAsUnread() {
  const client = useSupabase();
  const { user } = useAuth();
  
  return useSupabaseMutation(
    (notificationId: string) => markNotificationAsUnread(client, notificationId, user?.id!),
    {
      showSuccessToast: 'Notification marked as unread',
      showErrorToast: true
    }
  );
}

// Hook for marking all notifications as read
export function useMarkAllNotificationsAsRead() {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useSupabaseMutation(
    () => markAllNotificationsAsRead(client, siteId!, user?.id!),
    {
      onSuccess: (result) => {
        console.log(`Marked ${result.count} notifications as read`);
      },
      showSuccessToast: true,
      showErrorToast: true
    }
  );
}

// Hook for archiving a notification
export function useArchiveNotification() {
  const client = useSupabase();
  const { user } = useAuth();
  
  return useSupabaseMutation(
    (notificationId: string) => archiveNotification(client, notificationId, user?.id!),
    {
      showSuccessToast: 'Notification archived',
      showErrorToast: true
    }
  );
}

// Hook for unarchiving a notification
export function useUnarchiveNotification() {
  const client = useSupabase();
  const { user } = useAuth();
  
  return useSupabaseMutation(
    (notificationId: string) => unarchiveNotification(client, notificationId, user?.id!),
    {
      showSuccessToast: 'Notification unarchived',
      showErrorToast: true
    }
  );
}

// Hook for deleting a notification
export function useDeleteNotification() {
  const client = useSupabase();
  const { user } = useAuth();
  
  return useSupabaseMutation(
    (notificationId: string) => deleteNotification(client, notificationId, user?.id!),
    {
      showSuccessToast: 'Notification deleted',
      showErrorToast: true
    }
  );
}

// Hook for creating a notification
export function useCreateNotification() {
  const client = useSupabase();
  const siteId = useSiteId();
  const { user } = useAuth();
  
  return useSupabaseMutation(
    (data: CreateNotificationData) => createNotification(client, siteId!, user?.id!, data),
    {
      showSuccessToast: 'Notification created',
      showErrorToast: true
    }
  );
}

// Hook for bulk notification actions
export function useBulkNotificationAction() {
  const client = useSupabase();
  const { user } = useAuth();
  
  return useSupabaseMutation(
    (action: BulkNotificationAction) => bulkNotificationAction(client, user?.id!, action),
    {
      onSuccess: (result, variables) => {
        const actionText = variables.action.replace(/([A-Z])/g, ' $1').toLowerCase();
        console.log(`Successfully ${actionText} ${result.count} notifications`);
      },
      showSuccessToast: true,
      showErrorToast: true
    }
  );
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