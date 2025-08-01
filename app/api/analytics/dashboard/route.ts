/**
 * Analytics dashboard API endpoint
 * Provides site-specific and system-wide analytics data
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSiteAnalytics, getSystemAnalytics } from '@/lib/monitoring/site-analytics'
import { handleError } from '@/lib/types/error-handling'
import { ApiHandler, ApiRequest, ApiResponse, apiSuccess, apiError, ApiResult } from '@/src/lib/types/api'

interface AnalyticsDashboardQuery {
  siteId?: string
  timeRange?: 'hour' | 'day' | 'week' | 'month'
  includeSystem?: boolean
  metrics?: string[]
}

interface UserProfile {
  id: string
  [key: string]: unknown
}

/**
 * Validate user access to analytics data
 */
async function validateAccess(siteId?: string): Promise<{
  authorized: boolean
  user?: UserProfile
  error?: string
}> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // No-op for read-only operation
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { authorized: false, error: 'Authentication required' }
    }

    // If requesting system-wide analytics, check for admin role
    if (!siteId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        return { authorized: false, error: 'Admin access required for system analytics' }
      }

      return { authorized: true, user: user as unknown as UserProfile }
    }

    // Check site-specific access
    const { data: membership } = await supabase
      .from('site_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('site_id', siteId)
      .eq('is_active', true)
      .single()

    if (!membership) {
      return { authorized: false, error: 'Access denied to site analytics' }
    }

    return { authorized: true, user: user as unknown as UserProfile }
  } catch (error: unknown) {
    const handled = handleError(error)
    return { authorized: false, error: handled.message }
  }
}

/**
 * GET /api/analytics/dashboard
 * Returns analytics dashboard data
 */
interface AnalyticsDashboardResponse {
  timestamp: string
  timeRange: string
  site: Record<string, unknown> | null
  system: Record<string, unknown> | null
  metadata: {
    generatedAt: string
    generationTime: number
    requestedBy: string | undefined
  }
}

export const GET = async (request: ApiRequest<void>): Promise<ApiResponse<ApiResult<AnalyticsDashboardResponse>>> => {
  try {
    const searchParams = request.nextUrl.searchParams
    const query: AnalyticsDashboardQuery = {
      siteId: searchParams.get('siteId') || undefined,
      timeRange: (searchParams.get('timeRange') as 'hour' | 'day' | 'week' | 'month') || 'day',
      includeSystem: searchParams.get('includeSystem') === 'true',
      metrics: searchParams.get('metrics')?.split(',') || undefined,
    }

    // Validate access
    const accessCheck = await validateAccess(query.siteId)
    if (!accessCheck.authorized) {
      return apiError(accessCheck.error || 'Unauthorized', 'UNAUTHORIZED', 401)
    }

    const startTime = Date.now()
    let siteAnalytics = null
    let systemAnalytics = null

    // Get site-specific analytics
    if (query.siteId) {
      try {
        siteAnalytics = await getSiteAnalytics(query.siteId, query.timeRange)
      } catch (error: unknown) {
        const handled = handleError(error)
        console.error('[Analytics API] Error getting site analytics:', handled)
        return apiError(
          'Failed to retrieve site analytics',
          'SITE_ANALYTICS_ERROR',
          500
        )
      }
    }

    // Get system-wide analytics (if authorized and requested)
    if (query.includeSystem || !query.siteId) {
      try {
        systemAnalytics = await getSystemAnalytics(query.timeRange)
      } catch (error: unknown) {
        const handled = handleError(error)
        console.error('[Analytics API] Error getting system analytics:', handled)
        // Don't fail the entire request if system analytics fail
        systemAnalytics = { error: handled.message }
      }
    }

    const response = {
      timestamp: new Date().toISOString(),
      timeRange: query.timeRange || 'day',
      site: siteAnalytics ? {
        id: query.siteId,
        pageViews: siteAnalytics.pageViews,
        domainResolutions: siteAnalytics.domainResolutions,
        errors: siteAnalytics.errors,
        performance: siteAnalytics.performance,
        security: siteAnalytics.security,
      } : null,
      system: systemAnalytics ? {
        totalSites: systemAnalytics.totalSites,
        totalPageViews: systemAnalytics.totalPageViews,
        averageLatency: systemAnalytics.averageLatency,
        errorRate: systemAnalytics.errorRate,
        topSites: systemAnalytics.topSites,
        systemHealth: systemAnalytics.systemHealth,
      } : null,
      metadata: {
        generatedAt: new Date().toISOString(),
        generationTime: Date.now() - startTime,
        requestedBy: accessCheck.user?.id,
      },
    }

    // Filter metrics if specified
    if (query.metrics && response.site) {
      const filteredSite: Record<string, unknown> = {}
      query.metrics.forEach(metric => {
        if (metric in response.site!) {
          filteredSite[metric] = (response.site as Record<string, unknown>)[metric]
        }
      })
      response.site = filteredSite as typeof response.site
    }

    const apiResponse = apiSuccess(response)
    apiResponse.headers.set('Cache-Control', 'private, max-age=60')
    apiResponse.headers.set('X-Analytics-Generated', response.metadata.generatedAt)
    apiResponse.headers.set('X-Analytics-Time', `${response.metadata.generationTime}ms`)
    return apiResponse

  } catch (error: unknown) {
    const handled = handleError(error)
    console.error('[Analytics API] Unexpected error:', handled)
    return apiError(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    )
  }
}

/**
 * POST /api/analytics/dashboard/export
 * Exports analytics data in various formats
 */
interface ExportRequestBody {
  siteId?: string
  timeRange?: 'hour' | 'day' | 'week' | 'month'
  format?: 'json' | 'csv' | 'xlsx'
  startTime?: string
  endTime?: string
}

export const POST: ApiHandler<ExportRequestBody, unknown> = async (request: ApiRequest<ExportRequestBody>): Promise<ApiResponse<unknown>> => {
  try {
    const body = await request.json()
    const {
      siteId,
      timeRange = 'week',
      format = 'json',
      startTime,
      endTime,
    } = body

    // Validate access
    const accessCheck = await validateAccess(siteId)
    if (!accessCheck.authorized) {
      return apiError(accessCheck.error || 'Unauthorized', 'UNAUTHORIZED', 401)
    }

    // Get analytics data
    const analytics = siteId 
      ? await getSiteAnalytics(siteId, timeRange)
      : await getSystemAnalytics(timeRange)

    // Export in requested format
    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = ['timestamp', 'metric', 'value', 'count']
      const csvRows: string[][] = [csvHeaders]

      // Add page views data
      if ('pageViews' in analytics) {
        analytics.pageViews.data.forEach(point => {
          csvRows.push([
            new Date(point.timestamp).toISOString(),
            'page_views',
            point.value.toString(),
            point.count?.toString() || '1',
          ])
        })
      }

      // Add domain resolution data
      if ('domainResolutions' in analytics) {
        analytics.domainResolutions.data.forEach(point => {
          csvRows.push([
            new Date(point.timestamp).toISOString(),
            'domain_resolution_latency',
            point.value.toString(),
            point.count?.toString() || '1',
          ])
        })
      }

      const csvContent = csvRows.map(row => row.join(',')).join('\n')

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${siteId || 'system'}-${Date.now()}.csv"`,
          'Cache-Control': 'no-cache',
        },
      }) as ApiResponse<unknown>
    } else if (format === 'xlsx') {
      // For Excel format, you'd typically use a library like xlsx
      // For now, return JSON with a note
      return apiError(
        'Excel export not implemented',
        'NOT_IMPLEMENTED',
        501
      )
    }

    // Default JSON export
    const exportData = {
      exportedAt: new Date().toISOString(),
      siteId: siteId || 'system',
      timeRange,
      startTime,
      endTime,
      data: analytics,
    }

    const response = apiSuccess(exportData)
    response.headers.set('Content-Type', 'application/json')
    response.headers.set('Content-Disposition', `attachment; filename="analytics-${siteId || 'system'}-${Date.now()}.json"`)
    response.headers.set('Cache-Control', 'no-cache')
    return response

  } catch (error: unknown) {
    const handled = handleError(error)
    console.error('[Analytics Export] Error:', handled)
    return apiError(
      'Export failed',
      'EXPORT_ERROR',
      500
    )
  }
}

/**
 * PUT /api/analytics/dashboard/config
 * Updates analytics configuration for a site
 */
interface ConfigUpdateBody {
  siteId: string
  config: Record<string, unknown>
}

interface ConfigUpdateResponse {
  success: boolean
  site: Record<string, unknown>
  updatedAt: string
}

export const PUT = async (request: ApiRequest<ConfigUpdateBody>): Promise<ApiResponse<ApiResult<ConfigUpdateResponse>>> => {
  try {
    const body = await request.json()
    const { siteId, config } = body

    if (!siteId) {
      return apiError('Site ID is required', 'MISSING_SITE_ID', 400)
    }

    // Validate access
    const accessCheck = await validateAccess(siteId)
    if (!accessCheck.authorized) {
      return apiError(accessCheck.error || 'Unauthorized', 'UNAUTHORIZED', 401)
    }

    // Update analytics configuration in database
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // No-op for this operation
          },
        },
      }
    )

    const { data, error } = await supabase
      .from('sites')
      .update({
        analytics_config: config,
        updated_at: new Date().toISOString(),
      })
      .eq('id', siteId)
      .select()
      .single()

    if (error) {
      return apiError(
        'Failed to update analytics configuration',
        'CONFIG_UPDATE_ERROR',
        500
      )
    }

    return apiSuccess({
      success: true,
      site: data,
      updatedAt: new Date().toISOString(),
    })

  } catch (error: unknown) {
    const handled = handleError(error)
    console.error('[Analytics Config] Error:', handled)
    return apiError(
      'Configuration update failed',
      'CONFIG_UPDATE_FAILED',
      500
    )
  }
}