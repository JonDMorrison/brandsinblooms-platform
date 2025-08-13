'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { 
  BulkNotificationAction 
} from '@/lib/types/notifications'
import { z } from 'zod'

// Validation schemas
const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  category: z.string().min(1, 'Category is required'),
  type: z.string().min(1, 'Type is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  actionUrl: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
  data: z.any().optional(),
})

const markNotificationSchema = z.object({
  notificationId: z.string().uuid(),
})

const bulkActionSchema = z.object({
  notificationIds: z.array(z.string().uuid()),
  action: z.enum(['markAsRead', 'markAsUnread', 'archive', 'unarchive', 'delete']),
})

// Mark single notification as read
export async function markNotificationAsRead(notificationId: string) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Validate input
  const validated = markNotificationSchema.parse({ notificationId })

  // Get notification to check permissions
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('site_id, user_id')
    .eq('id', validated.notificationId)
    .single()

  if (fetchError || !notification) {
    throw new Error('Notification not found')
  }

  // Check user owns this notification
  if (notification.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // Update notification
  const { data: updatedNotification, error: updateError } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', validated.notificationId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateError) {
    throw new Error(updateError.message)
  }

  revalidatePath('/dashboard/notifications')
  return { success: true, notification: updatedNotification }
}

// Mark single notification as unread
export async function markNotificationAsUnread(notificationId: string) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Validate input
  const validated = markNotificationSchema.parse({ notificationId })

  // Get notification to check permissions
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('site_id, user_id')
    .eq('id', validated.notificationId)
    .single()

  if (fetchError || !notification) {
    throw new Error('Notification not found')
  }

  // Check user owns this notification
  if (notification.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // Update notification
  const { data: updatedNotification, error: updateError } = await supabase
    .from('notifications')
    .update({ 
      is_read: false, 
      read_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', validated.notificationId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateError) {
    throw new Error(updateError.message)
  }

  revalidatePath('/dashboard/notifications')
  return { success: true, notification: updatedNotification }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Get user's site membership
  const { data: membership } = await supabase
    .from('site_memberships')
    .select('site_id')
    .eq('user_id', user.id)
    .single()
  
  if (!membership) {
    throw new Error('No site membership found')
  }

  // Update all unread notifications
  const { data: updatedNotifications, error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('site_id', membership.site_id)
    .eq('user_id', user.id)
    .eq('is_read', false)
    .select()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/notifications')
  return { success: true, count: updatedNotifications.length }
}

// Archive notification
export async function archiveNotification(notificationId: string) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Validate input
  const validated = markNotificationSchema.parse({ notificationId })

  // Get notification to check permissions
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('site_id, user_id')
    .eq('id', validated.notificationId)
    .single()

  if (fetchError || !notification) {
    throw new Error('Notification not found')
  }

  // Check user owns this notification
  if (notification.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // Update notification
  const { data: updatedNotification, error: updateError } = await supabase
    .from('notifications')
    .update({ 
      is_archived: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', validated.notificationId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateError) {
    throw new Error(updateError.message)
  }

  revalidatePath('/dashboard/notifications')
  return { success: true, notification: updatedNotification }
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Validate input
  const validated = markNotificationSchema.parse({ notificationId })

  // Get notification to check permissions
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('site_id, user_id')
    .eq('id', validated.notificationId)
    .single()

  if (fetchError || !notification) {
    throw new Error('Notification not found')
  }

  // Check user owns this notification
  if (notification.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // Delete notification
  const { error: deleteError } = await supabase
    .from('notifications')
    .delete()
    .eq('id', validated.notificationId)
    .eq('user_id', user.id)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  revalidatePath('/dashboard/notifications')
  return { success: true }
}

// Bulk notification actions
export async function bulkNotificationAction(action: BulkNotificationAction) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Validate input
  const validated = bulkActionSchema.parse(action)

  // Verify all notifications belong to the user
  const { data: notifications, error: fetchError } = await supabase
    .from('notifications')
    .select('id, user_id')
    .in('id', validated.notificationIds)

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  // Check all notifications belong to the user
  const unauthorizedNotifications = notifications.filter(n => n.user_id !== user.id)
  if (unauthorizedNotifications.length > 0) {
    throw new Error('Unauthorized to modify some notifications')
  }

  let updateData: Record<string, unknown>
  let result: { count: number }
  const timestamp = new Date().toISOString()

  switch (validated.action) {
    case 'markAsRead':
      updateData = { 
        is_read: true, 
        read_at: timestamp,
        updated_at: timestamp
      }
      break
    case 'markAsUnread':
      updateData = { 
        is_read: false, 
        read_at: null,
        updated_at: timestamp
      }
      break
    case 'archive':
      updateData = { 
        is_archived: true,
        updated_at: timestamp
      }
      break
    case 'unarchive':
      updateData = { 
        is_archived: false,
        updated_at: timestamp
      }
      break
    case 'delete':
      const { data: deletedData, error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .in('id', validated.notificationIds)
        .eq('user_id', user.id)
        .select()
      
      if (deleteError) {
        throw new Error(deleteError.message)
      }
      
      result = { count: deletedData?.length || 0 }
      revalidatePath('/dashboard/notifications')
      return { success: true, ...result }
    default:
      throw new Error(`Unknown action: ${validated.action}`)
  }

  const { data: updatedData, error: updateError } = await supabase
    .from('notifications')
    .update(updateData)
    .in('id', validated.notificationIds)
    .eq('user_id', user.id)
    .select()

  if (updateError) {
    throw new Error(updateError.message)
  }

  result = { count: updatedData?.length || 0 }
  revalidatePath('/dashboard/notifications')
  return { success: true, ...result }
}

// Create notification (admin function)
export async function createNotification(formData: FormData) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Get user's site membership
  const { data: membership } = await supabase
    .from('site_memberships')
    .select('site_id, role')
    .eq('user_id', user.id)
    .single()
  
  if (!membership || !['owner', 'editor'].includes(membership.role)) {
    throw new Error('Insufficient permissions')
  }

  // Parse and validate form data
  const rawData = {
    title: formData.get('title') as string,
    message: formData.get('message') as string,
    category: formData.get('category') as string,
    type: formData.get('type') as string,
    priority: formData.get('priority') as string || 'medium',
    actionUrl: formData.get('actionUrl') as string || undefined,
    relatedEntityType: formData.get('relatedEntityType') as string || undefined,
    relatedEntityId: formData.get('relatedEntityId') as string || undefined,
    data: formData.get('data') ? JSON.parse(formData.get('data') as string) : undefined,
  }

  const validatedData = createNotificationSchema.parse(rawData)

  // Create notification
  const { data: newNotification, error } = await supabase
    .from('notifications')
    .insert({
      site_id: membership.site_id,
      user_id: user.id,
      title: validatedData.title,
      message: validatedData.message,
      category: validatedData.category,
      type: validatedData.type,
      priority: validatedData.priority || 'medium',
      action_url: validatedData.actionUrl || null,
      related_entity_type: validatedData.relatedEntityType || null,
      related_entity_id: validatedData.relatedEntityId || null,
      data: validatedData.data ? JSON.parse(JSON.stringify(validatedData.data)) : null,
      is_read: false,
      is_archived: false,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/notifications')
  return { success: true, notification: newNotification }
}

// Export notifications to CSV
export async function exportNotifications(filters?: {
  isRead?: boolean
  isArchived?: boolean
  category?: string
  type?: string
  priority?: string
  dateFrom?: string
  dateTo?: string
}) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Get user's site
  const { data: membership } = await supabase
    .from('site_memberships')
    .select('site_id')
    .eq('user_id', user.id)
    .single()
  
  if (!membership) {
    throw new Error('No site membership found')
  }

  // Build query
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('site_id', membership.site_id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Apply filters
  if (typeof filters?.isRead === 'boolean') {
    query = query.eq('is_read', filters.isRead)
  }
  
  if (typeof filters?.isArchived === 'boolean') {
    query = query.eq('is_archived', filters.isArchived)
  }
  
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  
  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  
  if (filters?.priority) {
    query = query.eq('priority', filters.priority)
  }
  
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  const { data: notifications, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  // Convert to CSV format
  const csv = [
    // Headers
    'Title,Message,Category,Type,Priority,Read Status,Created At,Read At',
    // Data rows
    ...notifications.map(notification => 
      `"${notification.title}","${notification.message}","${notification.category}","${notification.type}","${notification.priority}","${notification.is_read ? 'Read' : 'Unread'}","${new Date(notification.created_at).toLocaleString()}","${notification.read_at ? new Date(notification.read_at).toLocaleString() : 'N/A'}"`
    )
  ].join('\n')

  return {
    csv,
    filename: `notifications-export-${new Date().toISOString().split('T')[0]}.csv`,
    count: notifications.length
  }
}