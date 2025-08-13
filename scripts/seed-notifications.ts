import { createClient } from '@supabase/supabase-js'
import { Database } from '../src/lib/database/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

async function seedNotifications() {
  console.log('🌱 Starting notification seed...')
  
  const testSiteId = '00000000-0000-0000-0000-000000000001'
  
  // Use the site owner user ID (owner@test.com)
  const testUserId = '22222222-2222-2222-2222-222222222222'
  
  // Verify the site owner exists
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('user_id, email')
    .eq('user_id', testUserId)
    .single()
  
  if (!ownerProfile) {
    // Create the site owner profile if it doesn't exist
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: testUserId,
        email: 'owner@test.com',
        full_name: 'Site Owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (profileError) {
      console.error('Error creating site owner profile:', profileError)
    }
    console.log(`Created site owner profile: owner@test.com`)
  } else {
    console.log(`Using site owner: ${ownerProfile.email} (${testUserId})`)
  }
  
  const notifications = [
    // Order notifications (unread, high priority)
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'order_shipped',
      category: 'orders',
      priority: 'high' as const,
      title: 'Order Shipped! 📦',
      message: 'Your order #ORD-2024-001 has been shipped and is on its way!',
      action_url: '/dashboard/orders/123',
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'order_delivered',
      category: 'orders',
      priority: 'normal' as const,
      title: 'Order Delivered ✅',
      message: 'Your order #ORD-2024-002 has been successfully delivered.',
      action_url: '/dashboard/orders/124',
      is_read: false,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'order_processing',
      category: 'orders',
      priority: 'normal' as const,
      title: 'Order Being Processed',
      message: 'Your order #ORD-2024-003 is currently being processed.',
      action_url: '/dashboard/orders/125',
      is_read: true,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    // Payment notifications
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'payment_received',
      category: 'payments',
      priority: 'high' as const,
      title: 'Payment Received 💰',
      message: 'Payment of $299.99 has been successfully received for order #ORD-2024-001.',
      action_url: '/dashboard/orders/123',
      is_read: false,
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'payment_failed',
      category: 'payments',
      priority: 'urgent' as const,
      title: 'Payment Failed ⚠️',
      message: 'Payment processing failed for order #ORD-2024-004. Please update your payment method.',
      action_url: '/dashboard/settings',
      is_read: false,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    // Product notifications
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'low_stock_alert',
      category: 'products',
      priority: 'high' as const,
      title: 'Low Stock Alert 📉',
      message: 'Product "Premium Bouquet" is running low on stock (only 3 left).',
      action_url: '/dashboard/products/456',
      is_read: false,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'product_review',
      category: 'products',
      priority: 'normal' as const,
      title: 'New Product Review ⭐',
      message: 'A customer left a 5-star review on "Rose Garden Collection".',
      action_url: '/dashboard/products/457',
      is_read: false,
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    },
    // Message notifications
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'new_message',
      category: 'messages',
      priority: 'normal' as const,
      title: 'New Message 💬',
      message: 'You have a new message from Sarah Johnson regarding custom arrangements.',
      action_url: '/dashboard/messages/789',
      is_read: false,
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    },
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'contact_form',
      category: 'messages',
      priority: 'normal' as const,
      title: 'Contact Form Submission',
      message: 'New contact form submission from potential customer about wedding flowers.',
      action_url: '/dashboard/messages/790',
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'customer_inquiry',
      category: 'messages',
      priority: 'high' as const,
      title: 'Urgent Customer Inquiry',
      message: 'A customer needs help with their bulk order for an event tomorrow.',
      action_url: '/dashboard/messages/791',
      is_read: false,
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    // System notifications
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'system_update',
      category: 'system',
      priority: 'low' as const,
      title: 'System Update 🔧',
      message: 'New features have been added to your dashboard. Check them out!',
      action_url: '/dashboard',
      is_read: true,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'feature_announcement',
      category: 'system',
      priority: 'low' as const,
      title: 'New Feature Available',
      message: 'Analytics dashboard has been upgraded with new insights.',
      action_url: '/dashboard',
      is_read: false,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    // Marketing notifications
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'campaign_results',
      category: 'marketing',
      priority: 'normal' as const,
      title: 'Campaign Results 📊',
      message: 'Your email campaign "Spring Sale" reached 1,250 customers with 23% open rate.',
      action_url: '/dashboard/marketing',
      is_read: false,
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
    },
    // Security notifications
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'login_new_device',
      category: 'security',
      priority: 'high' as const,
      title: 'New Device Login 🔐',
      message: 'Your account was accessed from a new device in New York, NY.',
      action_url: '/dashboard/settings',
      is_read: false,
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    },
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'suspicious_activity',
      category: 'security',
      priority: 'urgent' as const,
      title: 'Suspicious Activity Detected ⚠️',
      message: 'Multiple failed login attempts detected. Please verify your account security.',
      action_url: '/dashboard/settings',
      is_read: false,
      created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString()
    },
    // Content notifications
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'content_published',
      category: 'content',
      priority: 'normal' as const,
      title: 'Content Published 📝',
      message: 'Your blog post "Spring Flower Care Tips" is now live.',
      action_url: '/dashboard/content/321',
      is_read: true,
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      site_id: testSiteId,
      user_id: testUserId,
      type: 'comment_moderation',
      category: 'content',
      priority: 'normal' as const,
      title: 'Comment Awaiting Moderation',
      message: 'A new comment on "Wedding Bouquet Ideas" needs your approval.',
      action_url: '/dashboard/content/323',
      is_read: false,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    }
  ]
  
  // Insert notifications
  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select()
  
  if (error) {
    console.error('❌ Error seeding notifications:', error)
    return
  }
  
  console.log(`✅ Successfully created ${data?.length || 0} notifications`)
  
  // Show summary
  const { data: summary } = await supabase
    .from('notifications')
    .select('category, priority, is_read')
    .eq('site_id', testSiteId)
    .eq('user_id', testUserId)
    .eq('is_archived', false)
  
  if (summary) {
    const stats = summary.reduce((acc, n) => {
      acc.total++
      if (!n.is_read) acc.unread++
      acc.byCategory[n.category] = (acc.byCategory[n.category] || 0) + 1
      acc.byPriority[n.priority] = (acc.byPriority[n.priority] || 0) + 1
      return acc
    }, {
      total: 0,
      unread: 0,
      byCategory: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    })
    
    console.log('\n📊 Notification Summary:')
    console.log(`Total: ${stats.total}`)
    console.log(`Unread: ${stats.unread}`)
    console.log('\nBy Category:')
    Object.entries(stats.byCategory).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`)
    })
    console.log('\nBy Priority:')
    Object.entries(stats.byPriority).forEach(([pri, count]) => {
      console.log(`  ${pri}: ${count}`)
    })
  }
}

seedNotifications()
  .then(() => {
    console.log('\n✨ Notification seeding complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })