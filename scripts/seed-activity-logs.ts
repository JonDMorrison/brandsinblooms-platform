import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedActivityLogs() {
  try {
    // First, get a site to add activities for
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, business_name')
      .limit(1)

    if (sitesError) {
      console.error('Error fetching sites:', sitesError)
      return
    }

    if (!sites || sites.length === 0) {
      console.error('No sites found')
      return
    }

    const siteId = sites[0].id
    console.log(`Adding activity logs for site: ${sites[0].business_name} (${siteId})`)

    // For local development, we'll use null for user_id to represent system activities
    // In production, you would get actual user IDs from auth.users
    const userId = null

    // Sample activity logs
    const activities = [
      {
        site_id: siteId,
        user_id: null,
        activity_type: 'page_created',
        entity_type: 'content',
        entity_id: crypto.randomUUID(),
        title: 'New page created',
        description: 'Landing page "Welcome to Our Store" has been published',
        created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
      },
      {
        site_id: siteId,
        user_id: null,
        activity_type: 'product_updated',
        entity_type: 'product',
        entity_id: crypto.randomUUID(),
        title: 'Product updated',
        description: 'Rose Bouquet pricing has been updated to $89.99',
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      },
      {
        site_id: siteId,
        user_id: null, // System activity
        activity_type: 'order_received',
        entity_type: 'order',
        entity_id: crypto.randomUUID(),
        title: 'New order received',
        description: 'Order #1247 from Sarah Johnson for $156.50',
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
      },
      {
        site_id: siteId,
        user_id: null,
        activity_type: 'design_changed',
        entity_type: 'site_settings',
        entity_id: siteId,
        title: 'Design updated',
        description: 'Header color scheme changed to purple gradient',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        site_id: siteId,
        user_id: null,
        activity_type: 'profile_updated',
        entity_type: 'site',
        entity_id: siteId,
        title: 'Profile updated',
        description: 'Business hours and contact information updated',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      },
      {
        site_id: siteId,
        user_id: null,
        activity_type: 'settings_changed',
        entity_type: 'site_settings',
        entity_id: siteId,
        title: 'Settings updated',
        description: 'Email notifications enabled for new orders',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        site_id: siteId,
        user_id: null,
        activity_type: 'product_updated',
        entity_type: 'product',
        entity_id: crypto.randomUUID(),
        title: 'Product added',
        description: 'New product "Summer Sunflower Arrangement" added to catalog',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
      {
        site_id: siteId,
        user_id: null,
        activity_type: 'order_received',
        entity_type: 'order',
        entity_id: crypto.randomUUID(),
        title: 'New order received',
        description: 'Order #1246 from John Doe for $78.00',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      },
    ]

    // Insert activity logs
    const { data, error } = await supabase
      .from('activity_logs')
      .insert(activities)
      .select()

    if (error) {
      console.error('Error inserting activity logs:', error)
      return
    }

    console.log(`Successfully inserted ${data.length} activity logs`)
    console.log('Sample activities:', data.slice(0, 3))
  } catch (error) {
    console.error('Unexpected error:', error)
  } finally {
    process.exit(0)
  }
}

seedActivityLogs()