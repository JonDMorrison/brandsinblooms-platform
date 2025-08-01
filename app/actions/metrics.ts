'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { z } from 'zod'

// Validation schemas for new site_metrics schema
const siteMetricsSchema = z.object({
  content_count: z.number().min(0).optional(),
  product_count: z.number().min(0).optional(),
  inquiry_count: z.number().min(0).optional(),
  unique_visitors: z.number().min(0).optional(),
  page_views: z.number().min(0).optional(),
})

// Type for metrics calculation result
export type CalculatedMetrics = {
  content_count: number;
  product_count: number;
  inquiry_count: number;
  unique_visitors: number;
  page_views: number;
};

// Calculate site metrics (could be called by a cron job)
export async function calculateSiteMetrics(siteId?: string): Promise<{
  success: boolean;
  error?: string;
  processed?: number;
  failed?: number;
  data?: CalculatedMetrics;
}> {
  const user = await getUser()
  if (!user) {
    // Allow this to be called by system/cron without user
    // In production, you'd verify this is called by a trusted source
  }

  const supabase = await createClient()
  
  // If no siteId provided, calculate for all sites
  if (!siteId) {
    const { data: sites } = await supabase
      .from('sites')
      .select('id')
      .eq('status', 'active')
    
    if (!sites) return { success: false, error: 'No sites found' }
    
    // Process each site
    const results = await Promise.all(
      sites.map((site): Promise<{ success: boolean; error?: string; data?: CalculatedMetrics }> => calculateSiteMetrics(site.id))
    )
    
    return {
      success: true,
      processed: results.filter((r): boolean => r.success).length,
      failed: results.filter((r): boolean => !r.success).length,
    }
  }

  // Calculate metrics for a specific site
  try {
    // Calculate actual metrics from database
    const metrics = await calculateMetricsForSite(siteId)
    
    // Save metrics
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from('site_metrics')
      .upsert({
        site_id: siteId,
        metric_date: today,
        content_count: metrics.content_count,
        product_count: metrics.product_count,
        inquiry_count: metrics.inquiry_count,
        unique_visitors: metrics.unique_visitors,
        page_views: metrics.page_views,
      }, {
        onConflict: 'site_id,metric_date',
      })
    
    if (error) {
      throw new Error(error.message)
    }
    
    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        site_id: siteId,
        user_id: user?.id || null,
        activity_type: 'metrics_calculated',
        entity_type: 'site_metrics',
        entity_id: siteId,
        title: 'Site metrics calculated',
        metadata: { date: today },
      })
    
    revalidatePath('/dashboard')
    
    return { success: true, data: metrics }
  } catch (error) {
    console.error('Failed to calculate metrics:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate metrics'
    return { success: false, error: errorMessage }
  }
}

// Helper function to calculate metrics based on actual database data
async function calculateMetricsForSite(siteId: string): Promise<CalculatedMetrics> {
  const supabase = await createClient()
  
  // Get content count (published content)
  const { count: contentCount } = await supabase
    .from('content')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('is_published', true)
  
  // Get product count (active products)
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('is_active', true)
  
  // Get inquiry count (all inquiries)
  const { count: inquiryCount } = await supabase
    .from('contact_inquiries')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
  
  // For unique visitors and page views, we would integrate with analytics services
  // For now, we'll use placeholder values that could be updated by external services
  const uniqueVisitors = 0 // Would come from Google Analytics, etc.
  const pageViews = 0 // Would come from Google Analytics, etc.
  
  return {
    content_count: contentCount || 0,
    product_count: productCount || 0,
    inquiry_count: inquiryCount || 0,
    unique_visitors: uniqueVisitors,
    page_views: pageViews,
  }
}

// Calculate trends based on previous metrics
function calculateTrends(
  current: CalculatedMetrics,
  previous: CalculatedMetrics | null
): CalculatedMetrics & { trends?: Record<keyof CalculatedMetrics, { change: number; trend: 'up' | 'down' | 'neutral' }> } {
  if (!previous) return current
  
  const trends: Record<keyof CalculatedMetrics, { change: number; trend: 'up' | 'down' | 'neutral' }> = {} as any
  
  const metricKeys: (keyof CalculatedMetrics)[] = [
    'content_count', 'product_count', 'inquiry_count', 'unique_visitors', 'page_views'
  ]
  
  for (const key of metricKeys) {
    const currentValue = current[key]
    const previousValue = previous[key]
    
    const change = currentValue - previousValue
    trends[key] = {
      change: Math.abs(change),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    }
  }
  
  return { ...current, trends }
}

// Manual metric update (for testing or manual adjustments)
export async function updateSiteMetrics(formData: FormData) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Get user's site
  const { data: membershipArray } = await supabase
    .from('site_memberships')
    .select('site_id, role')
    .eq('user_id', user.id)
    .limit(1)
  
  const membership = membershipArray && membershipArray.length > 0 ? membershipArray[0] : null
  
  if (!membership || !['owner', 'editor'].includes(membership.role)) {
    throw new Error('Insufficient permissions')
  }

  // Parse form data for count-based metrics
  const metrics: Partial<CalculatedMetrics> = {}
  
  const contentCount = formData.get('content_count')
  const productCount = formData.get('product_count')
  const inquiryCount = formData.get('inquiry_count')
  const uniqueVisitors = formData.get('unique_visitors')
  const pageViews = formData.get('page_views')
  
  if (contentCount !== null) metrics.content_count = parseInt(contentCount as string)
  if (productCount !== null) metrics.product_count = parseInt(productCount as string)
  if (inquiryCount !== null) metrics.inquiry_count = parseInt(inquiryCount as string)
  if (uniqueVisitors !== null) metrics.unique_visitors = parseInt(uniqueVisitors as string)
  if (pageViews !== null) metrics.page_views = parseInt(pageViews as string)

  // Validate metrics
  const validated = siteMetricsSchema.parse(metrics)
  
  // Get current metrics for trend calculation
  const today = new Date().toISOString().split('T')[0]
  const { data: currentMetricsArray } = await supabase
    .from('site_metrics')
    .select('content_count, product_count, inquiry_count, unique_visitors, page_views')
    .eq('site_id', membership.site_id)
    .eq('metric_date', today)
    .limit(1)
  
  const currentMetrics = currentMetricsArray && currentMetricsArray.length > 0 ? currentMetricsArray[0] : null
  
  // Calculate trends if we have previous data
  const metricsWithTrends = currentMetrics ? 
    calculateTrends(validated as CalculatedMetrics, currentMetrics as CalculatedMetrics) :
    validated

  // Save metrics
  const { error } = await supabase
    .from('site_metrics')
    .upsert({
      site_id: membership.site_id,
      metric_date: today,
      content_count: validated.content_count,
      product_count: validated.product_count,
      inquiry_count: validated.inquiry_count,
      unique_visitors: validated.unique_visitors,
      page_views: validated.page_views,
    }, {
      onConflict: 'site_id,metric_date',
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  
  return { success: true, metrics: metricsWithTrends }
}

// Generate metrics report
export async function generateMetricsReport(
  siteId: string,
  startDate: string,
  endDate: string
) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Check permissions
  const { data: membershipArray } = await supabase
    .from('site_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('site_id', siteId)
    .limit(1)
  
  const membership = membershipArray && membershipArray.length > 0 ? membershipArray[0] : null
  
  if (!membership) {
    throw new Error('No access to this site')
  }

  // Get metrics for date range
  const { data: metricsData, error } = await supabase
    .from('site_metrics')
    .select('metric_date, content_count, product_count, inquiry_count, unique_visitors, page_views')
    .eq('site_id', siteId)
    .gte('metric_date', startDate)
    .lte('metric_date', endDate)
    .order('metric_date', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  // Calculate averages and trends
  const summary = calculateMetricsSummary(metricsData)
  
  // Generate CSV
  const csv = generateMetricsCSV(metricsData, summary)
  
  return {
    success: true,
    csv,
    filename: `metrics-report-${startDate}-to-${endDate}.csv`,
    summary,
  }
}

// Helper to calculate metrics summary
function calculateMetricsSummary(metricsData: any[]) {
  if (metricsData.length === 0) return null
  
  const sums: Record<string, number> = {
    content_count: 0,
    product_count: 0,
    inquiry_count: 0,
    unique_visitors: 0,
    page_views: 0,
  }
  const counts: Record<string, number> = {
    content_count: 0,
    product_count: 0,
    inquiry_count: 0,
    unique_visitors: 0,
    page_views: 0,
  }
  
  metricsData.forEach((data) => {
    if (data.content_count !== null) {
      sums.content_count += data.content_count
      counts.content_count += 1
    }
    if (data.product_count !== null) {
      sums.product_count += data.product_count
      counts.product_count += 1
    }
    if (data.inquiry_count !== null) {
      sums.inquiry_count += data.inquiry_count
      counts.inquiry_count += 1
    }
    if (data.unique_visitors !== null) {
      sums.unique_visitors += data.unique_visitors
      counts.unique_visitors += 1
    }
    if (data.page_views !== null) {
      sums.page_views += data.page_views
      counts.page_views += 1
    }
  })
  
  const averages: Record<string, number> = {}
  Object.keys(sums).forEach(key => {
    averages[key] = counts[key] > 0 ? Math.round(sums[key] / counts[key]) : 0
  })
  
  return {
    averages,
    dataPoints: metricsData.length,
    startDate: metricsData[0].metric_date,
    endDate: metricsData[metricsData.length - 1].metric_date,
  }
}

// Helper to generate CSV
function generateMetricsCSV(metricsData: any[], summary: any) {
  const headers = ['Date', 'Content Count', 'Product Count', 'Inquiry Count', 'Unique Visitors', 'Page Views']
  
  const rows = metricsData.map((data) => {
    return [
      data.metric_date,
      data.content_count || 0,
      data.product_count || 0,
      data.inquiry_count || 0,
      data.unique_visitors || 0,
      data.page_views || 0,
    ].join(',')
  })
  
  // Add summary row
  if (summary) {
    rows.push('')
    rows.push('Averages,' + Object.values(summary.averages).join(','))
  }
  
  return [headers.join(','), ...rows].join('\n')
}

// Schedule metrics calculation (would be called by a cron job)
export async function scheduleMetricsCalculation() {
  // In production, this would be handled by a job scheduler
  // For now, just calculate for all active sites
  
  const result = await calculateSiteMetrics()
  
  // Log the scheduled run would require a specific site_id
  // For system-wide activities, we'd need a different logging approach
  console.log('Scheduled metrics calculation completed:', result)
  
  return result
}