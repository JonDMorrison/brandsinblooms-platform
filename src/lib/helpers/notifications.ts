/**
 * Notification helper functions for creating common types of notifications
 * Provides standardized notification creation for different scenarios
 */

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { CreateNotificationData } from '@/lib/types/notifications'
import { Tables } from '@/lib/database/types'

type Product = Tables<'products'>
type User = Tables<'profiles'>
type Order = Tables<'orders'>

/**
 * Base function to create notifications
 */
async function createNotificationInternal(
  siteId: string,
  userId: string,
  data: CreateNotificationData
): Promise<Tables<'notifications'> | null> {
  const supabase = await createClient()
  
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
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
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create notification:', error)
    return null
  }

  return notification
}

/**
 * Create low stock notification for site owners
 */
export async function createLowStockNotification(
  siteId: string,
  product: Product,
  currentStock: number,
  threshold: number
): Promise<Tables<'notifications'> | null> {
  try {
    const supabase = await createClient()
    
    // Get site owner(s)
    const { data: memberships, error: membershipError } = await supabase
      .from('site_memberships')
      .select('user_id, profiles(full_name)')
      .eq('site_id', siteId)
      .eq('role', 'owner')

    if (membershipError || !memberships || memberships.length === 0) {
      console.error('Failed to find site owners for low stock notification:', membershipError)
      return null
    }

    // Create notification for each owner
    const notifications = await Promise.all(
      memberships.map(async (membership) => {
        const notificationData: CreateNotificationData = {
          title: `Low Stock Alert: ${product.name}`,
          message: `Product "${product.name}" (SKU: ${product.sku}) is running low on stock. Current: ${currentStock}, Threshold: ${threshold}`,
          category: 'products',
          type: 'low_stock',
          priority: currentStock === 0 ? 'urgent' : 'high',
          actionUrl: `/dashboard/products/${product.id}`,
          relatedEntityType: 'product',
          relatedEntityId: product.id,
          data: {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            currentStock,
            threshold,
            stockStatus: product.stock_status
          }
        }

        return createNotificationInternal(siteId, membership.user_id, notificationData)
      })
    )

    // Return the first successful notification
    return notifications.find(n => n !== null) || null
  } catch (error) {
    console.error('Error creating low stock notification:', error)
    return null
  }
}

/**
 * Create system announcement notification
 */
export async function createSystemAnnouncement(
  siteId: string,
  userId: string,
  title: string,
  message: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  actionUrl?: string
): Promise<Tables<'notifications'> | null> {
  const notificationData: CreateNotificationData = {
    title,
    message,
    category: 'system',
    type: 'announcement',
    priority,
    actionUrl: actionUrl || undefined,
    data: {
      isSystemAnnouncement: true,
      timestamp: new Date().toISOString()
    }
  }

  return createNotificationInternal(siteId, userId, notificationData)
}

/**
 * Create welcome notification for new users
 */
export async function createWelcomeNotification(
  siteId: string,
  userId: string,
  userProfile: Pick<User, 'full_name' | 'email'>
): Promise<Tables<'notifications'> | null> {
  const firstName = userProfile.full_name?.split(' ')[0] || 'there'
  
  const notificationData: CreateNotificationData = {
    title: `Welcome to your dashboard, ${firstName}!`,
    message: `We're excited to have you on board. Get started by exploring your dashboard features, setting up your site, and managing your content.`,
    category: 'system',
    type: 'welcome',
    priority: 'medium',
    actionUrl: '/dashboard/getting-started',
    data: {
      isWelcomeMessage: true,
      userEmail: userProfile.email,
      joinedAt: new Date().toISOString()
    }
  }

  return createNotificationInternal(siteId, userId, notificationData)
}

/**
 * Create order status notification
 */
export async function createOrderStatusNotification(
  siteId: string,
  userId: string,
  order: Order,
  newStatus: string,
  previousStatus?: string
): Promise<Tables<'notifications'> | null> {
  const statusMessages = {
    pending: 'Order has been received and is being processed',
    confirmed: 'Order has been confirmed and is being prepared',
    processing: 'Order is being processed and prepared for shipment',
    shipped: 'Order has been shipped and is on its way',
    delivered: 'Order has been delivered successfully',
    cancelled: 'Order has been cancelled',
    refunded: 'Order has been refunded'
  }

  const statusPriorities = {
    pending: 'low' as const,
    confirmed: 'medium' as const,
    processing: 'medium' as const,
    shipped: 'high' as const,
    delivered: 'high' as const,
    cancelled: 'medium' as const,
    refunded: 'medium' as const
  }

  const message = statusMessages[newStatus as keyof typeof statusMessages] || 
    `Order status has been updated to ${newStatus}`

  const notificationData: CreateNotificationData = {
    title: `Order #${order.order_number} ${newStatus}`,
    message,
    category: 'orders',
    type: 'status_update',
    priority: statusPriorities[newStatus as keyof typeof statusPriorities] || 'medium',
    actionUrl: `/dashboard/orders/${order.id}`,
    relatedEntityType: 'order',
    relatedEntityId: order.id,
    data: {
      orderId: order.id,
      orderNumber: order.order_number,
      newStatus,
      previousStatus,
      totalAmount: order.total_amount,
      statusChangedAt: new Date().toISOString()
    }
  }

  return createNotificationInternal(siteId, userId, notificationData)
}

/**
 * Create payment notification
 */
export async function createPaymentNotification(
  siteId: string,
  userId: string,
  order: Order,
  type: 'payment_received' | 'payment_failed' | 'refund_processed',
  amount?: number,
  failureReason?: string
): Promise<Tables<'notifications'> | null> {
  const typeMessages = {
    payment_received: `Payment of $${amount || order.total_amount} has been received`,
    payment_failed: `Payment failed for order #${order.order_number}${failureReason ? `: ${failureReason}` : ''}`,
    refund_processed: `Refund of $${amount || order.total_amount} has been processed`
  }

  const typePriorities = {
    payment_received: 'medium' as const,
    payment_failed: 'high' as const,
    refund_processed: 'medium' as const
  }

  const notificationData: CreateNotificationData = {
    title: `Order #${order.order_number} - ${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    message: typeMessages[type],
    category: 'payments',
    type,
    priority: typePriorities[type],
    actionUrl: `/dashboard/orders/${order.id}`,
    relatedEntityType: 'order',
    relatedEntityId: order.id,
    data: {
      orderId: order.id,
      orderNumber: order.order_number,
      paymentType: type,
      amount: amount || order.total_amount,
      failureReason,
      processedAt: new Date().toISOString()
    }
  }

  return createNotificationInternal(siteId, userId, notificationData)
}

/**
 * Create content update notification
 */
export async function createContentUpdateNotification(
  siteId: string,
  userId: string,
  contentType: string,
  contentTitle: string,
  action: 'created' | 'updated' | 'published' | 'unpublished',
  contentId?: string
): Promise<Tables<'notifications'> | null> {
  const actionMessages = {
    created: 'has been created',
    updated: 'has been updated',
    published: 'has been published',
    unpublished: 'has been unpublished'
  }

  const notificationData: CreateNotificationData = {
    title: `${contentType} ${action}`,
    message: `${contentType} "${contentTitle}" ${actionMessages[action]}`,
    category: 'content',
    type: `content_${action}`,
    priority: 'low',
    actionUrl: contentId ? `/dashboard/content/${contentId}` : '/dashboard/content',
    relatedEntityType: 'content',
    relatedEntityId: contentId || null,
    data: {
      contentType,
      contentTitle,
      action,
      contentId,
      actionedAt: new Date().toISOString()
    }
  }

  return createNotificationInternal(siteId, userId, notificationData)
}

/**
 * Create bulk notification for multiple users
 */
export async function createBulkNotification(
  siteId: string,
  userIds: string[],
  notificationData: CreateNotificationData
): Promise<Tables<'notifications'>[]> {
  const notifications = await Promise.all(
    userIds.map(userId => createNotificationInternal(siteId, userId, notificationData))
  )

  return notifications.filter(n => n !== null) as Tables<'notifications'>[]
}

/**
 * Create notification for site administrators
 */
export async function createAdminNotification(
  siteId: string,
  notificationData: CreateNotificationData
): Promise<Tables<'notifications'>[]> {
  try {
    const supabase = await createClient()
    
    // Get site admins (owners and editors)
    const { data: memberships, error } = await supabase
      .from('site_memberships')
      .select('user_id')
      .eq('site_id', siteId)
      .in('role', ['owner', 'editor'])

    if (error || !memberships) {
      console.error('Failed to find site administrators:', error)
      return []
    }

    const userIds = memberships.map(m => m.user_id)
    return createBulkNotification(siteId, userIds, notificationData)
  } catch (error) {
    console.error('Error creating admin notification:', error)
    return []
  }
}

/**
 * Check if low stock notification should be sent
 */
export function shouldSendLowStockNotification(
  currentStock: number,
  threshold: number,
  previousStock?: number
): boolean {
  // Send notification when crossing the threshold downward
  if (previousStock !== undefined) {
    return previousStock > threshold && currentStock <= threshold
  }
  
  // Send notification if currently at or below threshold
  return currentStock <= threshold
}

/**
 * Get notification threshold for products (default: 5)
 */
export function getProductStockThreshold(product: Product): number {
  // Check if product has custom threshold in attributes
  if (product.attributes && typeof product.attributes === 'object') {
    const attrs = product.attributes as Record<string, unknown>
    const threshold = attrs.stockThreshold || attrs.lowStockThreshold
    if (typeof threshold === 'number' && threshold > 0) {
      return threshold
    }
  }
  
  // Default threshold
  return 5
}