'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { Tables } from '@/lib/database/types'
import { 
  createSystemAnnouncement,
  createWelcomeNotification,
  createLowStockNotification,
  createOrderStatusNotification,
  createPaymentNotification,
  createContentUpdateNotification,
  createAdminNotification,
  createBulkNotification
} from '@/lib/helpers/notifications'
import { CreateNotificationData } from '@/lib/types/notifications'
import { z } from 'zod'

// Validation schemas
const testNotificationSchema = z.object({
  type: z.enum([
    'welcome',
    'low_stock',
    'order_status',
    'payment',
    'content_update',
    'system_announcement',
    'admin_broadcast',
    'bulk_test',
    'custom'
  ]),
  title: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.string().optional(),
  actionUrl: z.string().optional(),
})

/**
 * Create test notifications for development and testing purposes
 */
export async function createTestNotification(formData: FormData) {
  const user = await getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const supabase = await createClient()
  
  // Get user's site membership
  const { data: membership } = await supabase
    .from('site_memberships')
    .select('site_id, role')
    .eq('user_id', user.id)
    .single()
  
  if (!membership) {
    throw new Error('No site membership found')
  }

  // Parse and validate form data
  const rawData = {
    type: formData.get('type') as string,
    title: formData.get('title') as string || undefined,
    message: formData.get('message') as string || undefined,
    priority: formData.get('priority') as string || undefined,
    category: formData.get('category') as string || undefined,
    actionUrl: formData.get('actionUrl') as string || undefined,
  }

  const validatedData = testNotificationSchema.parse(rawData)
  const siteId = membership.site_id
  const userId = user.id

  let result: Tables<'notifications'> | null = null

  try {
    switch (validatedData.type) {
      case 'welcome':
        result = await createWelcomeNotification(siteId, userId, {
          full_name: user.user_metadata?.full_name as string || 'Test User',
          email: user.email || 'test@example.com'
        })
        break

      case 'system_announcement':
        result = await createSystemAnnouncement(
          siteId,
          userId,
          validatedData.title || 'System Announcement',
          validatedData.message || 'This is a test system announcement to verify notifications are working correctly.',
          (validatedData.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          validatedData.actionUrl
        )
        break

      case 'low_stock':
        // Create a mock product for testing
        const mockProduct: Tables<'products'> = {
          id: 'test-product-id',
          name: 'Test Product',
          sku: 'TEST-SKU-001',
          inventory_count: 2,
          stock_status: 'low_stock',
          attributes: null,
          site_id: siteId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          care_instructions: null,
          category: null,
          compare_at_price: null,
          description: null,
          images: null,
          import_batch_id: null,
          import_source: null,
          in_stock: true,
          is_active: true,
          is_featured: false,
          low_stock_threshold: 5,
          meta_description: null,
          price: 29.99,
          rating: null,
          review_count: null,
          sale_price: null,
          slug: 'test-product',
          subcategory: null,
          unit_of_measure: null
        }

        result = await createLowStockNotification(siteId, mockProduct, 2, 5)
        break

      case 'order_status':
        // Create a mock order for testing
        const mockOrder: Tables<'orders'> = {
          id: 'test-order-id',
          order_number: 'ORD-2024-001',
          total_amount: 99.99,
          status: 'shipped',
          site_id: siteId,
          customer_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          billing_address: null,
          cancelled_at: null,
          completed_at: null,
          currency: 'USD',
          customer_email: 'test@example.com',
          customer_name: 'Test Customer',
          delivered_at: null,
          discount_amount: null,
          internal_notes: null,
          items_count: 1,
          notes: null,
          payment_method: 'credit_card',
          payment_status: 'paid',
          refunded_at: null,
          shipped_at: new Date().toISOString(),
          shipping_address: null,
          shipping_amount: 9.99,
          subtotal: 89.99,
          tax_amount: 8.99
        }

        result = await createOrderStatusNotification(
          siteId,
          userId,
          mockOrder,
          'shipped',
          'processing'
        )
        break

      case 'payment':
        // Create a mock order for payment notification
        const mockPaymentOrder: Tables<'orders'> = {
          id: 'test-payment-order-id',
          order_number: 'ORD-2024-002',
          total_amount: 149.99,
          status: 'processing',
          site_id: siteId,
          customer_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          billing_address: null,
          cancelled_at: null,
          completed_at: null,
          currency: 'USD',
          customer_email: 'test@example.com',
          customer_name: 'Test Customer',
          delivered_at: null,
          discount_amount: null,
          internal_notes: null,
          items_count: 2,
          notes: null,
          payment_method: 'credit_card',
          payment_status: 'paid',
          refunded_at: null,
          shipped_at: null,
          shipping_address: null,
          shipping_amount: 12.99,
          subtotal: 137.00,
          tax_amount: 12.99
        }

        result = await createPaymentNotification(
          siteId,
          userId,
          mockPaymentOrder,
          'payment_received',
          149.99
        )
        break

      case 'content_update':
        result = await createContentUpdateNotification(
          siteId,
          userId,
          'Blog Post',
          validatedData.title || 'Test Blog Post',
          'published'
        )
        break

      case 'admin_broadcast':
        const adminData: CreateNotificationData = {
          title: validatedData.title || 'Admin Broadcast',
          message: validatedData.message || 'This is a test admin broadcast notification sent to all administrators.',
          category: 'system',
          type: 'admin_broadcast',
          priority: (validatedData.priority as 'low' | 'medium' | 'high' | 'urgent') || 'high',
          actionUrl: validatedData.actionUrl,
          data: {
            isAdminBroadcast: true,
            broadcastAt: new Date().toISOString()
          }
        }

        const adminResults = await createAdminNotification(siteId, adminData)
        result = adminResults[0] || null
        break

      case 'bulk_test':
        // Create test notifications for multiple users (admin only)
        if (membership.role !== 'owner') {
          throw new Error('Only site owners can create bulk test notifications')
        }

        // Get all users in the site
        const { data: siteUsers } = await supabase
          .from('site_memberships')
          .select('user_id')
          .eq('site_id', siteId)

        if (siteUsers && siteUsers.length > 0) {
          const bulkData: CreateNotificationData = {
            title: validatedData.title || 'Bulk Test Notification',
            message: validatedData.message || 'This is a bulk test notification sent to all site members.',
            category: 'system',
            type: 'bulk_test',
            priority: (validatedData.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
            actionUrl: validatedData.actionUrl,
            data: {
              isBulkTest: true,
              sentAt: new Date().toISOString(),
              recipientCount: siteUsers.length
            }
          }

          const userIds = siteUsers.map(m => m.user_id)
          const bulkResults = await createBulkNotification(siteId, userIds, bulkData)
          result = bulkResults[0] || null
        }
        break

      case 'custom':
        // Create a custom notification with provided data
        const customData: CreateNotificationData = {
          title: validatedData.title || 'Custom Test Notification',
          message: validatedData.message || 'This is a custom test notification with user-defined content.',
          category: validatedData.category || 'system',
          type: 'custom_test',
          priority: (validatedData.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          actionUrl: validatedData.actionUrl,
          data: {
            isCustomTest: true,
            createdAt: new Date().toISOString(),
            customFields: {
              title: validatedData.title,
              message: validatedData.message,
              category: validatedData.category,
              priority: validatedData.priority
            }
          }
        }

        const { data, error } = await supabase
          .from('notifications')
          .insert({
            site_id: siteId,
            user_id: userId,
            title: customData.title,
            message: customData.message,
            category: customData.category,
            type: customData.type,
            priority: customData.priority || 'medium',
            action_url: customData.actionUrl || null,
            data: customData.data ? JSON.parse(JSON.stringify(customData.data)) : null,
            is_read: false,
            is_archived: false,
          })
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }
        
        result = data
        break

      default:
        throw new Error(`Unknown test notification type: ${validatedData.type}`)
    }

    revalidatePath('/dashboard/notifications')
    return { 
      success: true, 
      notification: result,
      message: `Test notification created: ${validatedData.type}`
    }
  } catch (error) {
    console.error('Error creating test notification:', error)
    throw new Error(`Failed to create test notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create multiple test notifications with different priorities and types
 */
export async function createTestNotificationSuite() {
  const user = await getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const supabase = await createClient()
  
  const { data: membership } = await supabase
    .from('site_memberships')
    .select('site_id, role')
    .eq('user_id', user.id)
    .single()
  
  if (!membership) {
    throw new Error('No site membership found')
  }

  const notifications = [
    // Low priority
    { type: 'custom', title: 'Low Priority Test', message: 'This is a low priority test notification', priority: 'low', category: 'system' },
    
    // Medium priority
    { type: 'content_update', title: 'New Blog Post Published', priority: 'medium' },
    
    // High priority  
    { type: 'order_status', title: 'Order Status Update', priority: 'high' },
    
    // Urgent priority
    { type: 'system_announcement', title: 'Urgent System Maintenance', message: 'System maintenance scheduled in 30 minutes', priority: 'urgent' },
    
    // Different categories
    { type: 'custom', title: 'Order Notification', message: 'New order received', priority: 'medium', category: 'orders' },
    { type: 'custom', title: 'Payment Notification', message: 'Payment processed successfully', priority: 'medium', category: 'payments' },
    { type: 'custom', title: 'Product Notification', message: 'Product inventory updated', priority: 'low', category: 'products' },
    { type: 'custom', title: 'Message Notification', message: 'New customer message received', priority: 'high', category: 'messages' },
  ]

  const results = []

  for (const notificationData of notifications) {
    try {
      const formData = new FormData()
      Object.entries(notificationData).forEach(([key, value]) => {
        formData.append(key, value)
      })

      const result = await createTestNotification(formData)
      results.push(result)
    } catch (error) {
      console.error(`Failed to create test notification: ${notificationData.title}`, error)
      results.push({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        title: notificationData.title
      })
    }
  }

  revalidatePath('/dashboard/notifications')
  return {
    success: true,
    message: `Created ${results.filter(r => r.success).length} of ${notifications.length} test notifications`,
    results
  }
}

/**
 * Clear all test notifications (useful for cleanup)
 */
export async function clearTestNotifications() {
  const user = await getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const supabase = await createClient()
  
  const { data: membership } = await supabase
    .from('site_memberships')
    .select('site_id, role')
    .eq('user_id', user.id)
    .single()
  
  if (!membership) {
    throw new Error('No site membership found')
  }

  // Only allow owners to clear test notifications
  if (membership.role !== 'owner') {
    throw new Error('Only site owners can clear test notifications')
  }

  // Delete test notifications
  const { data: deletedNotifications, error } = await supabase
    .from('notifications')
    .delete()
    .eq('site_id', membership.site_id)
    .or('type.like.%test%,category.eq.test,message.ilike.%test%,title.ilike.%test%')
    .select('id')

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/notifications')
  return {
    success: true,
    message: `Cleared ${deletedNotifications?.length || 0} test notifications`,
    deletedCount: deletedNotifications?.length || 0
  }
}

/**
 * Create a specific low stock test scenario
 */
export async function createLowStockTestScenario() {
  const user = await getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const supabase = await createClient()
  
  const { data: membership } = await supabase
    .from('site_memberships')
    .select('site_id')
    .eq('user_id', user.id)
    .single()
  
  if (!membership) {
    throw new Error('No site membership found')
  }

  // Create test products with low stock
  const testProducts = [
    { name: 'Test Product 1', sku: 'TEST-001', stock: 0, threshold: 5 },
    { name: 'Test Product 2', sku: 'TEST-002', stock: 2, threshold: 5 },
    { name: 'Test Product 3', sku: 'TEST-003', stock: 1, threshold: 3 },
  ]

  const results = []

  for (const productData of testProducts) {
    const mockProduct: Tables<'products'> = {
      id: `test-product-${productData.sku}`,
      name: productData.name,
      sku: productData.sku,
      inventory_count: productData.stock,
      stock_status: productData.stock === 0 ? 'out_of_stock' : 'low_stock',
      attributes: null,
      site_id: membership.site_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      care_instructions: null,
      category: null,
      compare_at_price: null,
      description: null,
      images: null,
      import_batch_id: null,
      import_source: null,
      in_stock: productData.stock > 0,
      is_active: true,
      is_featured: false,
      low_stock_threshold: productData.threshold,
      meta_description: null,
      price: 19.99,
      rating: null,
      review_count: null,
      sale_price: null,
      slug: `test-product-${productData.sku.toLowerCase()}`,
      subcategory: null,
      unit_of_measure: null
    }

    try {
      const notification = await createLowStockNotification(
        membership.site_id,
        mockProduct,
        productData.stock,
        productData.threshold
      )
      
      results.push({
        success: true,
        product: productData.name,
        notification: notification?.id
      })
    } catch (error) {
      results.push({
        success: false,
        product: productData.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  revalidatePath('/dashboard/notifications')
  return {
    success: true,
    message: `Created ${results.filter(r => r.success).length} low stock test notifications`,
    results
  }
}