/**
 * Site Analytics Services
 * Provides comprehensive analytics, performance metrics, and reporting
 */

import { supabase } from '@/src/lib/supabase/client'
import { 
  assertAuditLogResponse,
  AuditLogResponse 
} from '@/src/lib/database/rpc-types'

// Types for analytics
export interface PerformanceMetrics {
  id: string
  site_id: string
  recorded_at: string
  unique_visitors: number
  page_views: number
  sessions: number
  bounce_rate?: number
  avg_session_duration_seconds?: number
  avg_page_load_time_ms?: number
  avg_server_response_time_ms?: number
  total_requests: number
  error_rate?: number
  
  // Core Web Vitals
  avg_first_contentful_paint_ms?: number
  avg_largest_contentful_paint_ms?: number
  avg_cumulative_layout_shift?: number
  avg_first_input_delay_ms?: number
  
  // Resource usage
  bandwidth_used_bytes: number
  storage_used_bytes: number
  cdn_cache_hit_rate?: number
  
  // Content metrics
  total_content_items: number
  total_products: number
  active_content_items: number
  
  // User engagement
  form_submissions: number
  contact_inquiries: number
  product_views: number
  
  // Additional data
  top_countries?: any[]
  top_referrers?: any[]
  top_pages?: any[]
  device_breakdown?: Record<string, number>
  browser_breakdown?: Record<string, number>
  
  // SEO metrics
  search_impressions: number
  search_clicks: number
  avg_search_position?: number
  
  // Period info
  period_type: 'hourly' | 'daily' | 'weekly' | 'monthly'
  period_start?: string
  period_end?: string
  
  created_at: string
}

export interface SiteAnalyticsSummary {
  site_id: string
  site_name: string
  period_days: number
  period_type: string
  generated_at: string
  
  summary_metrics: {
    total_unique_visitors: number
    total_page_views: number
    total_sessions: number
    avg_bounce_rate?: number
    avg_session_duration?: number
    avg_page_load_time?: number
  }
  
  time_series_data: Array<{
    date: string
    unique_visitors: number
    page_views: number
    sessions: number
    bounce_rate?: number
    avg_session_duration?: number
    avg_page_load_time?: number
    form_submissions: number
    product_views: number
  }>
  
  geographic_data: {
    top_countries: any[]
  }
  
  device_breakdown: Record<string, number>
  top_pages: any[]
}

export interface PlatformAnalyticsSummary {
  period_days: number
  generated_at: string
  
  platform_totals: {
    total_sites: number
    total_unique_visitors: number
    total_page_views: number
    total_sessions: number
    avg_platform_uptime: number
  }
  
  performance_averages: {
    avg_page_load_time_ms?: number
    avg_bounce_rate?: number
    avg_session_duration?: number
  }
  
  top_performing_sites: Array<{
    site_id: string
    site_name: string
    subdomain: string
    total_visitors: number
    avg_load_time?: number
  }>
  
  health_distribution: {
    healthy: number
    warning: number
    critical: number
  }
  
  daily_trends: Array<{
    date: string
    unique_visitors: number
    page_views: number
    avg_load_time?: number
    uptime_percentage?: number
  }>
}

/**
 * Get platform-wide analytics summary
 */
export async function getPlatformAnalyticsSummary(daysBack: number = 30): Promise<PlatformAnalyticsSummary> {
  const { data, error } = await supabase.rpc('get_platform_analytics_summary', {
    days_back: daysBack
  })

  if (error) {
    console.error('Error getting platform analytics summary:', error)
    throw new Error(`Failed to get platform analytics summary: ${error.message}`)
  }

  return data as unknown as PlatformAnalyticsSummary
}

/**
 * Get detailed analytics for a specific site
 */
export async function getSiteAnalytics(
  siteId: string,
  daysBack: number = 30,
  periodType: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<SiteAnalyticsSummary> {
  const { data, error } = await supabase.rpc('get_site_analytics', {
    site_uuid: siteId,
    days_back: daysBack,
    period_type: periodType
  })

  if (error) {
    console.error('Error getting site analytics:', error)
    throw new Error(`Failed to get site analytics: ${error.message}`)
  }

  return data as unknown as SiteAnalyticsSummary
}

/**
 * Get performance metrics for a site
 */
export async function getSitePerformanceMetrics(
  siteId: string,
  limit: number = 100,
  periodType?: string
): Promise<PerformanceMetrics[]> {
  let query = supabase
    .from('site_performance_metrics')
    .select('*')
    .eq('site_id', siteId)
    .order('recorded_at', { ascending: false })
    .limit(limit)

  if (periodType) {
    query = query.eq('period_type', periodType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error getting performance metrics:', error)
    throw new Error(`Failed to get performance metrics: ${error.message}`)
  }

  // Transform null values to match interface expectations
  const metrics = (data || []).map(item => ({
    ...item,
    unique_visitors: item.unique_visitors || 0,
    page_views: item.page_views || 0,
    sessions: item.sessions || 0,
    total_requests: item.total_requests || 0,
    bandwidth_used_bytes: item.bandwidth_used_bytes || 0,
    active_content_items: item.active_content_items || 0,
    active_products: 0 // Field doesn't exist in database
  }))
  
  return metrics as PerformanceMetrics[]
}

/**
 * Get traffic trends for visualization
 */
export async function getTrafficTrends(
  siteId?: string,
  daysBack: number = 30,
  periodType: string = 'daily'
): Promise<Array<{
  date: string
  unique_visitors: number
  page_views: number
  sessions: number
  bounce_rate?: number
}>> {
  let query = supabase
    .from('site_performance_metrics')
    .select('recorded_at, unique_visitors, page_views, sessions, bounce_rate')
    .eq('period_type', periodType)
    .gte('recorded_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .order('recorded_at', { ascending: true })

  if (siteId) {
    query = query.eq('site_id', siteId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error getting traffic trends:', error)
    throw new Error(`Failed to get traffic trends: ${error.message}`)
  }

  // If no site specified, aggregate across all sites by date
  if (!siteId && data) {
    const aggregated = new Map<string, {
      unique_visitors: number
      page_views: number
      sessions: number
      bounce_rates: number[]
    }>()

    data.forEach(metric => {
      const date = new Date(metric.recorded_at).toISOString().split('T')[0]
      const existing = aggregated.get(date) || {
        unique_visitors: 0,
        page_views: 0,
        sessions: 0,
        bounce_rates: []
      }

      existing.unique_visitors += metric.unique_visitors || 0
      existing.page_views += metric.page_views || 0
      existing.sessions += metric.sessions || 0
      if (metric.bounce_rate !== null) {
        existing.bounce_rates.push(metric.bounce_rate)
      }

      aggregated.set(date, existing)
    })

    return Array.from(aggregated.entries()).map(([date, stats]) => ({
      date,
      unique_visitors: stats.unique_visitors,
      page_views: stats.page_views,
      sessions: stats.sessions,
      bounce_rate: stats.bounce_rates.length > 0 
        ? Math.round(stats.bounce_rates.reduce((sum, rate) => sum + rate, 0) / stats.bounce_rates.length)
        : undefined
    }))
  }

  return (data || []).map(metric => ({
    date: new Date(metric.recorded_at).toISOString().split('T')[0],
    unique_visitors: metric.unique_visitors || 0,
    page_views: metric.page_views || 0,
    sessions: metric.sessions || 0,
    bounce_rate: metric.bounce_rate || undefined
  }))
}

/**
 * Get performance trends (load times, etc.)
 */
export async function getPerformanceTrends(
  siteId?: string,
  daysBack: number = 30,
  periodType: string = 'daily'
): Promise<Array<{
  date: string
  avg_page_load_time?: number
  avg_server_response_time?: number
  error_rate?: number
  avg_first_contentful_paint?: number
  avg_largest_contentful_paint?: number
}>> {
  let query = supabase
    .from('site_performance_metrics')
    .select(`
      recorded_at,
      avg_page_load_time_ms,
      avg_server_response_time_ms,
      error_rate,
      avg_first_contentful_paint_ms,
      avg_largest_contentful_paint_ms
    `)
    .eq('period_type', periodType)
    .gte('recorded_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .order('recorded_at', { ascending: true })

  if (siteId) {
    query = query.eq('site_id', siteId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error getting performance trends:', error)
    throw new Error(`Failed to get performance trends: ${error.message}`)
  }

  // Aggregate by date if no specific site
  if (!siteId && data) {
    const aggregated = new Map<string, {
      page_load_times: number[]
      response_times: number[]
      error_rates: number[]
      fcp_times: number[]
      lcp_times: number[]
    }>()

    data.forEach(metric => {
      const date = new Date(metric.recorded_at).toISOString().split('T')[0]
      const existing = aggregated.get(date) || {
        page_load_times: [],
        response_times: [],
        error_rates: [],
        fcp_times: [],
        lcp_times: []
      }

      if (metric.avg_page_load_time_ms) existing.page_load_times.push(metric.avg_page_load_time_ms)
      if (metric.avg_server_response_time_ms) existing.response_times.push(metric.avg_server_response_time_ms)
      if (metric.error_rate) existing.error_rates.push(metric.error_rate)
      if (metric.avg_first_contentful_paint_ms) existing.fcp_times.push(metric.avg_first_contentful_paint_ms)
      if (metric.avg_largest_contentful_paint_ms) existing.lcp_times.push(metric.avg_largest_contentful_paint_ms)

      aggregated.set(date, existing)
    })

    return Array.from(aggregated.entries()).map(([date, stats]) => ({
      date,
      avg_page_load_time: stats.page_load_times.length > 0 
        ? Math.round(stats.page_load_times.reduce((sum, time) => sum + time, 0) / stats.page_load_times.length)
        : undefined,
      avg_server_response_time: stats.response_times.length > 0
        ? Math.round(stats.response_times.reduce((sum, time) => sum + time, 0) / stats.response_times.length)
        : undefined,
      error_rate: stats.error_rates.length > 0
        ? Math.round((stats.error_rates.reduce((sum, rate) => sum + rate, 0) / stats.error_rates.length) * 100) / 100
        : undefined,
      avg_first_contentful_paint: stats.fcp_times.length > 0
        ? Math.round(stats.fcp_times.reduce((sum, time) => sum + time, 0) / stats.fcp_times.length)
        : undefined,
      avg_largest_contentful_paint: stats.lcp_times.length > 0
        ? Math.round(stats.lcp_times.reduce((sum, time) => sum + time, 0) / stats.lcp_times.length)
        : undefined
    }))
  }

  return (data || []).map(metric => ({
    date: new Date(metric.recorded_at).toISOString().split('T')[0],
    avg_page_load_time: metric.avg_page_load_time_ms || undefined,
    avg_server_response_time: metric.avg_server_response_time_ms || undefined,
    error_rate: metric.error_rate || undefined,
    avg_first_contentful_paint: metric.avg_first_contentful_paint_ms || undefined,
    avg_largest_contentful_paint: metric.avg_largest_contentful_paint_ms || undefined
  }))
}

/**
 * Get top performing sites
 */
export async function getTopPerformingSites(
  daysBack: number = 30,
  limit: number = 10,
  sortBy: 'visitors' | 'page_views' | 'performance' = 'visitors'
): Promise<Array<{
  site_id: string
  site_name: string
  subdomain: string
  custom_domain?: string
  total_visitors: number
  total_page_views: number
  avg_load_time?: number
  bounce_rate?: number
}>> {
  const { data: sitesData, error: sitesError } = await supabase
    .from('sites')
    .select('id, name, subdomain, custom_domain')
    .eq('is_active', true)

  if (sitesError) {
    throw new Error(`Failed to get sites: ${sitesError.message}`)
  }

  const { data: metricsData, error: metricsError } = await supabase
    .from('site_performance_metrics')
    .select('site_id, unique_visitors, page_views, avg_page_load_time_ms, bounce_rate')
    .gte('recorded_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .eq('period_type', 'daily')

  if (metricsError) {
    throw new Error(`Failed to get metrics: ${metricsError.message}`)
  }

  // Aggregate metrics by site
  const siteMetrics = new Map<string, {
    total_visitors: number
    total_page_views: number
    load_times: number[]
    bounce_rates: number[]
  }>()

  metricsData?.forEach(metric => {
    const existing = siteMetrics.get(metric.site_id) || {
      total_visitors: 0,
      total_page_views: 0,
      load_times: [],
      bounce_rates: []
    }

    existing.total_visitors += metric.unique_visitors || 0
    existing.total_page_views += metric.page_views || 0
    if (metric.avg_page_load_time_ms) existing.load_times.push(metric.avg_page_load_time_ms)
    if (metric.bounce_rate) existing.bounce_rates.push(metric.bounce_rate)

    siteMetrics.set(metric.site_id, existing)
  })

  // Combine with site data and sort
  const results = sitesData
    ?.map(site => {
      const metrics = siteMetrics.get(site.id) || {
        total_visitors: 0,
        total_page_views: 0,
        load_times: [],
        bounce_rates: []
      }

      return {
        site_id: site.id,
        site_name: site.name,
        subdomain: site.subdomain,
        custom_domain: site.custom_domain || undefined,
        total_visitors: metrics.total_visitors,
        total_page_views: metrics.total_page_views,
        avg_load_time: metrics.load_times.length > 0
          ? Math.round(metrics.load_times.reduce((sum, time) => sum + time, 0) / metrics.load_times.length)
          : undefined,
        bounce_rate: metrics.bounce_rates.length > 0
          ? Math.round((metrics.bounce_rates.reduce((sum, rate) => sum + rate, 0) / metrics.bounce_rates.length) * 100) / 100
          : undefined
      }
    })
    .filter(site => site.total_visitors > 0) // Only include sites with traffic
    .sort((a, b) => {
      switch (sortBy) {
        case 'page_views':
          return b.total_page_views - a.total_page_views
        case 'performance':
          // Sort by load time (lower is better), fallback to visitors
          if (a.avg_load_time && b.avg_load_time) {
            return a.avg_load_time - b.avg_load_time
          }
          return b.total_visitors - a.total_visitors
        default:
          return b.total_visitors - a.total_visitors
      }
    })
    .slice(0, limit)

  return results || []
}

/**
 * Get engagement metrics for a site
 */
export async function getSiteEngagementMetrics(
  siteId: string,
  daysBack: number = 30
): Promise<{
  total_form_submissions: number
  total_contact_inquiries: number
  total_product_views: number
  avg_session_duration: number
  bounce_rate: number
  engagement_trend: Array<{
    date: string
    form_submissions: number
    contact_inquiries: number
    product_views: number
  }>
}> {
  const { data, error } = await supabase
    .from('site_performance_metrics')
    .select(`
      recorded_at,
      form_submissions,
      contact_inquiries,
      product_views,
      avg_session_duration_seconds,
      bounce_rate
    `)
    .eq('site_id', siteId)
    .eq('period_type', 'daily')
    .gte('recorded_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .order('recorded_at', { ascending: true })

  if (error) {
    console.error('Error getting engagement metrics:', error)
    throw new Error(`Failed to get engagement metrics: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return {
      total_form_submissions: 0,
      total_contact_inquiries: 0,
      total_product_views: 0,
      avg_session_duration: 0,
      bounce_rate: 0,
      engagement_trend: []
    }
  }

  const totalFormSubmissions = data.reduce((sum, metric) => sum + (metric.form_submissions || 0), 0)
  const totalContactInquiries = data.reduce((sum, metric) => sum + (metric.contact_inquiries || 0), 0)
  const totalProductViews = data.reduce((sum, metric) => sum + (metric.product_views || 0), 0)

  const sessionDurations = data.filter(m => m.avg_session_duration_seconds).map(m => m.avg_session_duration_seconds!)
  const bounceRates = data.filter(m => m.bounce_rate).map(m => m.bounce_rate!)

  const avgSessionDuration = sessionDurations.length > 0
    ? Math.round(sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length)
    : 0

  const avgBounceRate = bounceRates.length > 0
    ? Math.round((bounceRates.reduce((sum, rate) => sum + rate, 0) / bounceRates.length) * 100) / 100
    : 0

  const engagementTrend = data.map(metric => ({
    date: new Date(metric.recorded_at).toISOString().split('T')[0],
    form_submissions: metric.form_submissions || 0,
    contact_inquiries: metric.contact_inquiries || 0,
    product_views: metric.product_views || 0
  }))

  return {
    total_form_submissions: totalFormSubmissions,
    total_contact_inquiries: totalContactInquiries,
    total_product_views: totalProductViews,
    avg_session_duration: avgSessionDuration,
    bounce_rate: avgBounceRate,
    engagement_trend: engagementTrend
  }
}

/**
 * Add performance metrics (for data collection)
 */
export async function addPerformanceMetrics(
  siteId: string,
  metrics: Partial<PerformanceMetrics>
): Promise<void> {
  const { error } = await supabase
    .from('site_performance_metrics')
    .insert({
      site_id: siteId,
      ...metrics,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error adding performance metrics:', error)
    throw new Error(`Failed to add performance metrics: ${error.message}`)
  }
}

/**
 * Get Core Web Vitals trends
 */
export async function getCoreWebVitalsTrends(
  siteId: string,
  daysBack: number = 30
): Promise<Array<{
  date: string
  first_contentful_paint: number
  largest_contentful_paint: number
  cumulative_layout_shift: number
  first_input_delay: number
}>> {
  const { data, error } = await supabase
    .from('site_performance_metrics')
    .select(`
      recorded_at,
      avg_first_contentful_paint_ms,
      avg_largest_contentful_paint_ms,
      avg_cumulative_layout_shift,
      avg_first_input_delay_ms
    `)
    .eq('site_id', siteId)
    .eq('period_type', 'daily')
    .gte('recorded_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .order('recorded_at', { ascending: true })

  if (error) {
    console.error('Error getting Core Web Vitals trends:', error)
    throw new Error(`Failed to get Core Web Vitals trends: ${error.message}`)
  }

  return (data || []).map(metric => ({
    date: new Date(metric.recorded_at).toISOString().split('T')[0],
    first_contentful_paint: metric.avg_first_contentful_paint_ms || 0,
    largest_contentful_paint: metric.avg_largest_contentful_paint_ms || 0,
    cumulative_layout_shift: metric.avg_cumulative_layout_shift || 0,
    first_input_delay: metric.avg_first_input_delay_ms || 0
  }))
}

/**
 * Export analytics data to CSV format
 */
export async function exportAnalyticsData(
  siteId: string,
  daysBack: number = 30,
  includeDetails: boolean = false
): Promise<string> {
  const metrics = await getSitePerformanceMetrics(siteId, 1000, 'daily')
  const filteredMetrics = metrics.filter(m => 
    new Date(m.recorded_at) >= new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
  )

  if (filteredMetrics.length === 0) {
    return 'No data available for the specified period'
  }

  // Basic CSV headers
  const headers = [
    'Date',
    'Unique Visitors',
    'Page Views',
    'Sessions',
    'Bounce Rate',
    'Avg Session Duration (s)',
    'Avg Page Load Time (ms)',
    'Form Submissions',
    'Product Views'
  ]

  // Add detailed headers if requested
  if (includeDetails) {
    headers.push(
      'Server Response Time (ms)',
      'Error Rate',
      'First Contentful Paint (ms)',
      'Largest Contentful Paint (ms)',
      'Cumulative Layout Shift',
      'Bandwidth Used (bytes)',
      'Storage Used (bytes)'
    )
  }

  // Convert data to CSV rows
  const rows = filteredMetrics.map(metric => {
    const basicRow = [
      new Date(metric.recorded_at).toISOString().split('T')[0],
      metric.unique_visitors,
      metric.page_views,
      metric.sessions,
      metric.bounce_rate || '',
      metric.avg_session_duration_seconds || '',
      metric.avg_page_load_time_ms || '',
      metric.form_submissions,
      metric.product_views
    ]

    if (includeDetails) {
      basicRow.push(
        metric.avg_server_response_time_ms || '',
        metric.error_rate || '',
        metric.avg_first_contentful_paint_ms || '',
        metric.avg_largest_contentful_paint_ms || '',
        metric.avg_cumulative_layout_shift || '',
        metric.bandwidth_used_bytes,
        metric.storage_used_bytes
      )
    }

    return basicRow
  })

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  return csvContent
}