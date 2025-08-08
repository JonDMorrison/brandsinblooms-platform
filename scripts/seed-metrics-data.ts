import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to generate a date range
function generateDateRange(days: number): Date[] {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date)
  }
  
  return dates
}

// Generate random number with some variation
function randomInRange(min: number, max: number, trend: number = 0): number {
  const base = Math.random() * (max - min) + min
  // Add trend factor (positive trend means increasing over time)
  return Math.round(base * (1 + trend))
}

async function seedSiteMetrics() {
  try {
    // Get the first site
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, business_name')
      .limit(1)

    if (sitesError || !sites || sites.length === 0) {
      console.error('Error fetching sites:', sitesError)
      return
    }

    const siteId = sites[0].id
    console.log(`\nSeeding metrics for site: ${sites[0].business_name} (${siteId})`)

    // Generate 30 days of site metrics
    const dates = generateDateRange(30)
    const siteMetrics = dates.map((date, index) => {
      const trend = index / dates.length // Increasing trend over time
      
      return {
        site_id: siteId,
        metric_date: date.toISOString().split('T')[0],
        page_views: randomInRange(500, 2000, trend * 0.5),
        unique_visitors: randomInRange(200, 800, trend * 0.3),
        content_count: Math.floor(10 + index * 0.5), // Slowly growing
        product_count: Math.floor(20 + index * 0.3), // Slowly growing
        inquiry_count: randomInRange(5, 20, trend * 0.2),
      }
    })

    console.log('Inserting site metrics...')
    const { data: metricsData, error: metricsError } = await supabase
      .from('site_metrics')
      .upsert(siteMetrics, { 
        onConflict: 'site_id,metric_date',
        ignoreDuplicates: false 
      })
      .select()

    if (metricsError) {
      console.error('Error inserting site metrics:', metricsError)
    } else {
      console.log(`✅ Inserted ${metricsData.length} site metrics records`)
    }

    // Generate performance metrics (weekly data for the last 12 weeks)
    const performanceMetrics = []
    const today = new Date()
    
    for (let week = 11; week >= 0; week--) {
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - (week * 7 + 6))
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      const trend = (11 - week) / 11 // Improving trend over time
      
      performanceMetrics.push({
        site_id: siteId,
        period_type: 'week',
        period_start: weekStart.toISOString(),
        period_end: weekEnd.toISOString(),
        recorded_at: weekEnd.toISOString(),
        
        // Traffic metrics
        page_views: randomInRange(3500, 14000, trend * 0.5),
        unique_visitors: randomInRange(1400, 5600, trend * 0.3),
        sessions: randomInRange(2100, 8400, trend * 0.4),
        bounce_rate: randomInRange(30, 50, -trend * 0.2) / 100, // Improving (lower is better)
        avg_session_duration_seconds: randomInRange(120, 300, trend * 0.3),
        
        // Performance metrics (improving over time)
        avg_page_load_time_ms: randomInRange(1500, 3000, -trend * 0.3),
        avg_server_response_time_ms: randomInRange(200, 500, -trend * 0.2),
        avg_first_contentful_paint_ms: randomInRange(1000, 2000, -trend * 0.2),
        avg_largest_contentful_paint_ms: randomInRange(2000, 4000, -trend * 0.2),
        avg_first_input_delay_ms: randomInRange(50, 150, -trend * 0.1),
        avg_cumulative_layout_shift: randomInRange(5, 15, -trend * 0.1) / 100,
        
        // Content metrics
        total_content_items: Math.floor(10 + (11 - week) * 2),
        active_content_items: Math.floor(8 + (11 - week) * 1.5),
        total_products: Math.floor(20 + (11 - week) * 3),
        product_views: randomInRange(2000, 8000, trend * 0.4),
        
        // Engagement metrics
        contact_inquiries: randomInRange(35, 140, trend * 0.3),
        form_submissions: randomInRange(20, 80, trend * 0.3),
        
        // Technical metrics
        error_rate: randomInRange(1, 5, -trend * 0.5) / 100,
        cdn_cache_hit_rate: randomInRange(85, 95, trend * 0.1) / 100,
        bandwidth_used_bytes: randomInRange(1000000000, 5000000000, trend * 0.3), // 1-5 GB
        storage_used_bytes: randomInRange(500000000, 2000000000, trend * 0.2), // 0.5-2 GB
        total_requests: randomInRange(50000, 200000, trend * 0.4),
        
        // SEO metrics
        search_impressions: randomInRange(5000, 20000, trend * 0.5),
        search_clicks: randomInRange(250, 1000, trend * 0.4),
        avg_search_position: randomInRange(15, 25, -trend * 0.3),
        
        // Additional data
        top_pages: {
          '/': randomInRange(1000, 4000, trend * 0.3),
          '/products': randomInRange(800, 3200, trend * 0.3),
          '/about': randomInRange(400, 1600, trend * 0.2),
          '/contact': randomInRange(300, 1200, trend * 0.2),
        },
        top_referrers: {
          'google.com': randomInRange(400, 1600, trend * 0.3),
          'facebook.com': randomInRange(200, 800, trend * 0.2),
          'direct': randomInRange(500, 2000, trend * 0.3),
          'instagram.com': randomInRange(100, 400, trend * 0.2),
        },
        device_breakdown: {
          'desktop': randomInRange(50, 60, 0),
          'mobile': randomInRange(35, 45, trend * 0.1),
          'tablet': randomInRange(5, 10, 0),
        },
        browser_breakdown: {
          'Chrome': randomInRange(60, 70, 0),
          'Safari': randomInRange(15, 25, 0),
          'Firefox': randomInRange(5, 10, 0),
          'Edge': randomInRange(5, 10, 0),
        },
        top_countries: {
          'US': randomInRange(60, 70, 0),
          'CA': randomInRange(10, 15, 0),
          'UK': randomInRange(5, 10, 0),
          'AU': randomInRange(5, 10, 0),
        },
      })
    }

    console.log('Inserting performance metrics...')
    const { data: perfData, error: perfError } = await supabase
      .from('site_performance_metrics')
      .insert(performanceMetrics)
      .select()

    if (perfError) {
      console.error('Error inserting performance metrics:', perfError)
    } else {
      console.log(`✅ Inserted ${perfData.length} performance metrics records`)
    }

    // Skip orders for now since they require existing customer records
    console.log('⚠️  Skipping orders - would require existing customer records')

    console.log('\n✨ All test data has been successfully seeded!')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  } finally {
    process.exit(0)
  }
}

seedSiteMetrics()