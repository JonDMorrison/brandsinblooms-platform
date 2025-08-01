/**
 * Site Health Monitoring Services
 * Provides comprehensive health monitoring, automated checks, and alerting
 */

import { supabase } from '@/lib/supabase/client'
import type { Json } from '@/lib/database/types'

// Types for health monitoring
export interface SiteHealthCheck {
  id: string
  site_id: string
  check_type: 'uptime' | 'performance' | 'ssl' | 'domain' | 'database' | 'content' | 'comprehensive'
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  checked_at: string
  response_time_ms?: number
  is_healthy?: boolean
  error_message?: string
  warning_message?: string
  check_data?: Record<string, unknown>
  http_status_code?: number
  dns_resolution_ms?: number
  ssl_expiry_date?: string
  page_load_time_ms?: number
  first_contentful_paint_ms?: number
  largest_contentful_paint_ms?: number
  cumulative_layout_shift?: number
  user_agent?: string
  check_location?: string
  created_at: string
}

export interface SiteHealthSummary {
  site_id: string
  site_name: string
  health_score: number
  overall_status: 'healthy' | 'warning' | 'critical'
  checked_at: string
  uptime_24h: number
  avg_response_time_ms?: number
  components: {
    domain: string
    ssl: string
    content: string
    performance: string
  }
  metrics: {
    content_count: number
    product_count: number
    error_count_24h: number
  }
  issues: Array<{
    type: string
    message: string
    severity: 'low' | 'medium' | 'high'
  }>
  warnings: Array<{
    type: string
    message: string
    severity: 'low' | 'medium' | 'high'
  }>
}

export interface PlatformHealthOverview {
  total_sites: number
  healthy_sites: number
  warning_sites: number
  critical_sites: number
  avg_platform_uptime: number
  avg_response_time: number
  total_errors_24h: number
  health_distribution: {
    healthy: number
    warning: number
    critical: number
  }
  recent_issues: Array<{
    site_id: string
    site_name: string
    issue_type: string
    severity: string
    occurred_at: string
    message: string
  }>
}

/**
 * Get comprehensive health check for a specific site
 */
export async function checkSiteHealth(siteId: string): Promise<SiteHealthSummary> {
  const { data, error } = await supabase.rpc('check_site_health', {
    site_uuid: siteId
  })

  if (error) {
    console.error('Error checking site health:', error)
    throw new Error(`Failed to check site health: ${error.message}`)
  }

  const result = data as unknown as { success: boolean; error?: string }
  if (!result.success) {
    throw new Error(result.error || 'Health check failed')
  }

  return data as unknown as SiteHealthSummary
}

/**
 * Get site health summary with historical data
 */
export async function getSiteHealthSummary(
  siteId: string, 
  daysBack: number = 7
): Promise<SiteHealthSummary> {
  const { data, error } = await supabase.rpc('get_site_health_summary', {
    site_uuid: siteId,
    days_back: daysBack
  })

  if (error) {
    console.error('Error getting site health summary:', error)
    throw new Error(`Failed to get site health summary: ${error.message}`)
  }

  return data as unknown as SiteHealthSummary
}

/**
 * Get recent health checks for a site
 */
export async function getSiteHealthChecks(
  siteId: string,
  limit: number = 50,
  checkType?: string
): Promise<SiteHealthCheck[]> {
  let query = supabase
    .from('site_health_checks')
    .select('*')
    .eq('site_id', siteId)
    .order('checked_at', { ascending: false })
    .limit(limit)

  if (checkType) {
    query = query.eq('check_type', checkType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error getting site health checks:', error)
    throw new Error(`Failed to get health checks: ${error.message}`)
  }

  return (data as unknown as SiteHealthCheck[]) || []
}

/**
 * Get platform-wide health overview
 */
export async function getPlatformHealthOverview(): Promise<PlatformHealthOverview> {
  // Get basic platform stats
  const [sitesResponse, healthChecksResponse] = await Promise.all([
    supabase
      .from('sites')
      .select('id, name, is_active')
      .eq('is_active', true),
    supabase
      .from('site_health_checks')
      .select('*')
      .eq('check_type', 'comprehensive')
      .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('checked_at', { ascending: false })
  ])

  if (sitesResponse.error) {
    throw new Error(`Failed to get sites: ${sitesResponse.error.message}`)
  }

  if (healthChecksResponse.error) {
    throw new Error(`Failed to get health checks: ${healthChecksResponse.error.message}`)
  }

  const sites = sitesResponse.data || []
  const healthChecks = healthChecksResponse.data || []

  // Get latest health status for each site
  const siteHealthMap = new Map<string, SiteHealthCheck>()
  healthChecks.forEach(check => {
    if (!siteHealthMap.has(check.site_id)) {
      siteHealthMap.set(check.site_id, check as unknown as SiteHealthCheck)
    }
  })

  // Calculate health distribution
  let healthySites = 0
  let warningSites = 0
  let criticalSites = 0
  const totalUptime = 0
  let totalResponseTime = 0
  let responseTimeCount = 0
  let totalErrors = 0

  const recentIssues: Array<{
    site_id: string
    site_name: string
    issue_type: string
    severity: string
    occurred_at: string
    message: string
  }> = []

  sites.forEach(site => {
    const healthCheck = siteHealthMap.get(site.id)
    
    if (healthCheck) {
      const healthScore = (typeof healthCheck.check_data === 'object' && 
        healthCheck.check_data !== null && 
        !Array.isArray(healthCheck.check_data) &&
        'health_score' in healthCheck.check_data
      ) ? (healthCheck.check_data.health_score as number) : 0
      
      if (healthScore >= 90) {
        healthySites++
      } else if (healthScore >= 70) {
        warningSites++
      } else {
        criticalSites++
      }

      if (healthCheck.response_time_ms) {
        totalResponseTime += healthCheck.response_time_ms
        responseTimeCount++
      }

      // Add issues to recent issues
      if (healthCheck.status === 'critical') {
        totalErrors++
        recentIssues.push({
          site_id: site.id,
          site_name: site.name,
          issue_type: 'health_check',
          severity: 'high',
          occurred_at: healthCheck.checked_at,
          message: healthCheck.error_message || 'Critical health check failure'
        })
      }
    } else {
      // No recent health check - consider as unknown/warning
      warningSites++
    }
  })

  // Get recent critical health checks for issues
  const { data: criticalChecks } = await supabase
    .from('site_health_checks')
    .select(`
      *,
      sites!inner(name)
    `)
    .eq('status', 'critical')
    .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('checked_at', { ascending: false })
    .limit(10)

  if (criticalChecks) {
    criticalChecks.forEach(check => {
      recentIssues.push({
        site_id: check.site_id,
        site_name: (check.sites as { name: string }).name,
        issue_type: check.check_type,
        severity: 'high',
        occurred_at: check.checked_at,
        message: check.error_message || `${check.check_type} check failed`
      })
    })
  }

  return {
    total_sites: sites.length,
    healthy_sites: healthySites,
    warning_sites: warningSites,
    critical_sites: criticalSites,
    avg_platform_uptime: sites.length > 0 ? ((healthySites + warningSites) / sites.length) * 100 : 100,
    avg_response_time: responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0,
    total_errors_24h: totalErrors,
    health_distribution: {
      healthy: healthySites,
      warning: warningSites,
      critical: criticalSites
    },
    recent_issues: recentIssues.slice(0, 10)
  }
}

/**
 * Run health check for all sites (admin only)
 */
export async function runPlatformHealthChecks(): Promise<{ success: boolean; sites_checked: number }> {
  const { data, error } = await supabase.rpc('run_platform_health_checks')

  if (error) {
    console.error('Error running platform health checks:', error)
    throw new Error(`Failed to run platform health checks: ${error.message}`)
  }

  return data as unknown as { success: boolean; sites_checked: number }
}

/**
 * Get health check history for trend analysis
 */
export async function getHealthCheckTrend(
  siteId?: string,
  daysBack: number = 30,
  checkType: string = 'uptime'
): Promise<Array<{
  date: string
  uptime_percentage: number
  avg_response_time: number
  error_count: number
}>> {
  let query = supabase
    .from('site_health_checks')
    .select('checked_at, is_healthy, response_time_ms, status')
    .eq('check_type', checkType)
    .gte('checked_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .order('checked_at', { ascending: true })

  if (siteId) {
    query = query.eq('site_id', siteId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error getting health check trend:', error)
    throw new Error(`Failed to get health check trend: ${error.message}`)
  }

  // Group by date and calculate metrics
  const dailyStats = new Map<string, {
    total: number
    healthy: number
    totalResponseTime: number
    responseTimeCount: number
    errors: number
  }>()

  data?.forEach(check => {
    const date = new Date(check.checked_at).toISOString().split('T')[0]
    const stats = dailyStats.get(date) || {
      total: 0,
      healthy: 0,
      totalResponseTime: 0,
      responseTimeCount: 0,
      errors: 0
    }

    stats.total++
    if (check.is_healthy) stats.healthy++
    if (check.response_time_ms) {
      stats.totalResponseTime += check.response_time_ms
      stats.responseTimeCount++
    }
    if (check.status === 'critical') stats.errors++

    dailyStats.set(date, stats)
  })

  return Array.from(dailyStats.entries()).map(([date, stats]) => ({
    date,
    uptime_percentage: stats.total > 0 ? Math.round((stats.healthy / stats.total) * 100) : 100,
    avg_response_time: stats.responseTimeCount > 0 
      ? Math.round(stats.totalResponseTime / stats.responseTimeCount) 
      : 0,
    error_count: stats.errors
  }))
}

/**
 * Get sites that need attention (health issues)
 */
export async function getSitesNeedingAttention(): Promise<Array<{
  site_id: string
  site_name: string
  health_score: number
  status: string
  issues: string[]
  last_checked: string
}>> {
  const { data, error } = await supabase
    .from('site_health_checks')
    .select(`
      site_id,
      status,
      check_data,
      checked_at,
      sites!inner(name)
    `)
    .eq('check_type', 'comprehensive')
    .in('status', ['warning', 'critical'])
    .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('checked_at', { ascending: false })

  if (error) {
    console.error('Error getting sites needing attention:', error)
    throw new Error(`Failed to get sites needing attention: ${error.message}`)
  }

  // Group by site and get latest status
  const siteMap = new Map<string, {
    site_id: string
    site_name: string
    health_score: number
    status: string
    issues: string[]
    last_checked: string
  }>()
  data?.forEach(check => {
    if (!siteMap.has(check.site_id)) {
      const issues: string[] = []
      const checkData = (check.check_data as unknown as {
        issues?: Array<{ message: string }>
        warnings?: Array<{ message: string }>
        health_score?: number
      }) || {}
      
      if (checkData.issues) {
        checkData.issues.forEach((issue: { message: string }) => {
          issues.push(issue.message)
        })
      }
      if (checkData.warnings) {
        checkData.warnings.forEach((warning: { message: string }) => {
          issues.push(warning.message)
        })
      }

      siteMap.set(check.site_id, {
        site_id: check.site_id,
        site_name: (check.sites as { name: string }).name,
        health_score: checkData.health_score || 0,
        status: check.status,
        issues,
        last_checked: check.checked_at
      })
    }
  })

  return Array.from(siteMap.values())
    .sort((a, b) => {
      // Sort by severity (critical first) then by health score
      if (a.status !== b.status) {
        return a.status === 'critical' ? -1 : 1
      }
      return a.health_score - b.health_score
    })
}

/**
 * Add a manual health check record
 */
export async function addHealthCheckRecord(
  siteId: string,
  checkType: string,
  data: Partial<SiteHealthCheck>
): Promise<void> {
  // Prepare the data, ensuring check_data is Json compatible
  const insertData: any = {
    site_id: siteId,
    check_type: checkType,
    created_at: new Date().toISOString()
  }
  
  // Copy over fields excluding check_data for special handling
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'check_data' && value !== undefined) {
      insertData[key] = value
    }
  })
  
  // Handle check_data separately to ensure it's Json compatible
  if (data.check_data) {
    insertData.check_data = data.check_data as Json
  }
  
  const { error } = await supabase
    .from('site_health_checks')
    .insert(insertData)

  if (error) {
    console.error('Error adding health check record:', error)
    throw new Error(`Failed to add health check record: ${error.message}`)
  }
}

/**
 * Get uptime statistics for a site
 */
export async function getSiteUptimeStats(
  siteId: string,
  daysBack: number = 30
): Promise<{
  uptime_percentage: number
  total_checks: number
  successful_checks: number
  avg_response_time: number
  max_downtime_minutes: number
}> {
  const { data, error } = await supabase
    .from('site_health_checks')
    .select('is_healthy, response_time_ms, checked_at')
    .eq('site_id', siteId)
    .eq('check_type', 'uptime')
    .gte('checked_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .order('checked_at', { ascending: true })

  if (error) {
    console.error('Error getting uptime stats:', error)
    throw new Error(`Failed to get uptime stats: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return {
      uptime_percentage: 100,
      total_checks: 0,
      successful_checks: 0,
      avg_response_time: 0,
      max_downtime_minutes: 0
    }
  }

  const totalChecks = data.length
  const successfulChecks = data.filter(check => check.is_healthy).length
  const responseTimes = data.filter(check => check.response_time_ms).map(check => check.response_time_ms!)
  const avgResponseTime = responseTimes.length > 0 
    ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
    : 0

  // Calculate max downtime period (simplified)
  let maxDowntimeMinutes = 0
  let currentDowntimeStart: Date | null = null

  data.forEach(check => {
    const checkTime = new Date(check.checked_at)
    
    if (!check.is_healthy) {
      if (!currentDowntimeStart) {
        currentDowntimeStart = checkTime
      }
    } else {
      if (currentDowntimeStart) {
        const downtimeMinutes = (checkTime.getTime() - currentDowntimeStart.getTime()) / (1000 * 60)
        maxDowntimeMinutes = Math.max(maxDowntimeMinutes, downtimeMinutes)
        currentDowntimeStart = null
      }
    }
  })

  return {
    uptime_percentage: totalChecks > 0 ? Math.round((successfulChecks / totalChecks) * 100) : 100,
    total_checks: totalChecks,
    successful_checks: successfulChecks,
    avg_response_time: avgResponseTime,
    max_downtime_minutes: Math.round(maxDowntimeMinutes)
  }
}