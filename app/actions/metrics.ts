'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { getUser } from '@/src/lib/auth/server'
import { SiteMetricsData, MetricData } from '@/src/lib/database/aliases'
import { z } from 'zod'

// Validation schemas
const metricDataSchema = z.object({
  score: z.number().min(0).max(100),
  change: z.number(),
  trend: z.enum(['up', 'down', 'neutral']),
})

const siteMetricsSchema = z.object({
  performance: metricDataSchema.optional(),
  page_load: metricDataSchema.optional(),
  seo: metricDataSchema.optional(),
  mobile: metricDataSchema.optional(),
  security: metricDataSchema.optional(),
  accessibility: metricDataSchema.optional(),
})

// Calculate site metrics (could be called by a cron job)
export async function calculateSiteMetrics(siteId?: string): Promise<{
  success: boolean;
  error?: string;
  processed?: number;
  failed?: number;
  data?: SiteMetricsData;
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
      sites.map((site): Promise<{ success: boolean; error?: string; data?: SiteMetricsData }> => calculateSiteMetrics(site.id))
    )
    
    return {
      success: true,
      processed: results.filter((r): boolean => r.success).length,
      failed: results.filter((r): boolean => !r.success).length,
    }
  }

  // Calculate metrics for a specific site
  try {
    // In a real application, these would be calculated from:
    // - Google PageSpeed API
    // - Google Analytics
    // - Internal monitoring tools
    // - Security scans
    // - Accessibility audits
    
    const metrics = await calculateMetricsForSite(siteId)
    
    // Get previous day's metrics for trend calculation
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    const { data: previousMetrics } = await supabase
      .from('site_metrics')
      .select('metrics')
      .eq('site_id', siteId)
      .eq('metric_date', yesterdayStr)
      .single()
    
    // Calculate trends
    const metricsWithTrends = calculateTrends(
      metrics,
      previousMetrics?.metrics as SiteMetricsData | null
    )
    
    // Save metrics
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from('site_metrics')
      .upsert({
        site_id: siteId,
        metric_date: today,
        metrics: metricsWithTrends,
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
    
    return { success: true, metrics: metricsWithTrends }
  } catch (error) {
    console.error('Failed to calculate metrics:', error)
    return { success: false, error: error.message }
  }
}

// Helper function to calculate metrics (mock implementation)
async function calculateMetricsForSite(siteId: string): Promise<SiteMetricsData> {
  const supabase = await createClient()
  
  // In production, these would come from real monitoring tools
  // For now, we'll calculate based on site data
  
  // Get site data for calculations
  const { data: site } = await supabase
    .from('sites')
    .select('created_at, updated_at')
    .eq('id', siteId)
    .single()
  
  // Get content metrics
  const { count: contentCount } = await supabase
    .from('content')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('status', 'published')
  
  // Get product metrics
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('status', 'active')
  
  // Calculate scores based on available data
  // In production, use real monitoring APIs
  
  const performanceScore = Math.min(100, 70 + (productCount || 0) / 10 + (contentCount || 0) / 5)
  const pageLoadScore = Math.min(100, 80 + Math.random() * 20) // Mock variation
  const seoScore = Math.min(100, 60 + (contentCount || 0) * 2)
  const mobileScore = Math.min(100, 75 + Math.random() * 15)
  const securityScore = 95 // Assume good security by default
  const accessibilityScore = Math.min(100, 70 + Math.random() * 10)
  
  return {
    performance: {
      score: Math.round(performanceScore),
      change: 0,
      trend: 'neutral',
    },
    page_load: {
      score: Math.round(pageLoadScore),
      change: 0,
      trend: 'neutral',
    },
    seo: {
      score: Math.round(seoScore),
      change: 0,
      trend: 'neutral',
    },
    mobile: {
      score: Math.round(mobileScore),
      change: 0,
      trend: 'neutral',
    },
    security: {
      score: Math.round(securityScore),
      change: 0,
      trend: 'neutral',
    },
    accessibility: {
      score: Math.round(accessibilityScore),
      change: 0,
      trend: 'neutral',
    },
  }
}

// Calculate trends based on previous metrics
function calculateTrends(
  current: SiteMetricsData,
  previous: SiteMetricsData | null
): SiteMetricsData {
  if (!previous) return current
  
  const result: SiteMetricsData = {}
  
  const metricKeys: (keyof SiteMetricsData)[] = [
    'performance', 'page_load', 'seo', 'mobile', 'security', 'accessibility'
  ]
  
  for (const key of metricKeys) {
    const currentMetric = current[key]
    const previousMetric = previous[key]
    
    if (currentMetric && previousMetric) {
      const change = currentMetric.score - previousMetric.score
      result[key] = {
        score: currentMetric.score,
        change: Math.abs(change),
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      }
    } else if (currentMetric) {
      result[key] = currentMetric
    }
  }
  
  return result
}

// Manual metric update (for testing or manual adjustments)
export async function updateSiteMetrics(formData: FormData) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Get user's site
  const { data: membership } = await supabase
    .from('site_memberships')
    .select('site_id, role')
    .eq('user_id', user.id)
    .single()
  
  if (!membership || !['owner', 'editor'].includes(membership.role)) {
    throw new Error('Insufficient permissions')
  }

  // Parse form data
  const metrics: SiteMetricsData = {}
  const metricTypes: (keyof SiteMetricsData)[] = [
    'performance', 'page_load', 'seo', 'mobile', 'security', 'accessibility'
  ]
  
  for (const type of metricTypes) {
    const score = formData.get(`${type}_score`)
    if (score !== null) {
      metrics[type] = {
        score: parseInt(score as string),
        change: 0,
        trend: 'neutral',
      }
    }
  }

  // Validate metrics
  const validated = siteMetricsSchema.parse(metrics)
  
  // Calculate trends
  const today = new Date().toISOString().split('T')[0]
  const { data: currentMetrics } = await supabase
    .from('site_metrics')
    .select('metrics')
    .eq('site_id', membership.site_id)
    .eq('metric_date', today)
    .single()
  
  const metricsWithTrends = calculateTrends(
    validated as SiteMetricsData,
    currentMetrics?.metrics as SiteMetricsData | null
  )

  // Save metrics
  const { error } = await supabase
    .from('site_metrics')
    .upsert({
      site_id: membership.site_id,
      metric_date: today,
      metrics: metricsWithTrends,
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
  const { data: membership } = await supabase
    .from('site_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('site_id', siteId)
    .single()
  
  if (!membership) {
    throw new Error('No access to this site')
  }

  // Get metrics for date range
  const { data: metricsData, error } = await supabase
    .from('site_metrics')
    .select('metric_date, metrics')
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
  
  const sums: Record<string, number> = {}
  const counts: Record<string, number> = {}
  
  metricsData.forEach(({ metrics }) => {
    Object.entries(metrics).forEach(([key, metric]: [string, any]) => {
      if (metric?.score) {
        sums[key] = (sums[key] || 0) + metric.score
        counts[key] = (counts[key] || 0) + 1
      }
    })
  })
  
  const averages: Record<string, number> = {}
  Object.keys(sums).forEach(key => {
    averages[key] = Math.round(sums[key] / counts[key])
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
  const headers = ['Date', 'Performance', 'Page Load', 'SEO', 'Mobile', 'Security', 'Accessibility']
  
  const rows = metricsData.map(({ metric_date, metrics }) => {
    return [
      metric_date,
      metrics.performance?.score || '',
      metrics.page_load?.score || '',
      metrics.seo?.score || '',
      metrics.mobile?.score || '',
      metrics.security?.score || '',
      metrics.accessibility?.score || '',
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
  
  // Log the scheduled run
  const supabase = await createClient()
  await supabase
    .from('activity_logs')
    .insert({
      site_id: null, // System-wide activity
      user_id: null,
      activity_type: 'metrics_scheduled',
      entity_type: 'system',
      entity_id: 'metrics-calculation',
      title: `Scheduled metrics calculation completed`,
      metadata: result,
    })
  
  return result
}