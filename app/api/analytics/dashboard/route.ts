/**
 * Analytics dashboard API endpoint
 * Provides site-specific and system-wide analytics data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSiteAnalytics, getSystemAnalytics } from '@/lib/monitoring/site-analytics'

interface AnalyticsDashboardQuery {
  siteId?: string
  timeRange?: 'hour' | 'day' | 'week' | 'month'
  includeSystem?: boolean
  metrics?: string[]
}

/**
 * Validate user access to analytics data
 */
async function validateAccess(siteId?: string): Promise<{
  authorized: boolean
  user?: any
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

      return { authorized: true, user }
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

    return { authorized: true, user }
  } catch (error: any) {
    return { authorized: false, error: error.message }
  }
}

/**
 * GET /api/analytics/dashboard
 * Returns analytics dashboard data
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const query: AnalyticsDashboardQuery = {
      siteId: searchParams.get('siteId') || undefined,
      timeRange: (searchParams.get('timeRange') as any) || 'day',
      includeSystem: searchParams.get('includeSystem') === 'true',
      metrics: searchParams.get('metrics')?.split(',') || undefined,
    }

    // Validate access
    const accessCheck = await validateAccess(query.siteId)
    if (!accessCheck.authorized) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: 401 }
      )
    }

    const startTime = Date.now()
    let siteAnalytics = null
    let systemAnalytics = null

    // Get site-specific analytics
    if (query.siteId) {
      try {
        siteAnalytics = await getSiteAnalytics(query.siteId, query.timeRange)
      } catch (error: any) {
        console.error('[Analytics API] Error getting site analytics:', error)
        return NextResponse.json(
          { error: 'Failed to retrieve site analytics', details: error.message },
          { status: 500 }
        )
      }
    }

    // Get system-wide analytics (if authorized and requested)
    if (query.includeSystem || !query.siteId) {
      try {
        systemAnalytics = await getSystemAnalytics(query.timeRange)
      } catch (error: any) {
        console.error('[Analytics API] Error getting system analytics:', error)
        // Don't fail the entire request if system analytics fail
        systemAnalytics = { error: error.message }
      }
    }

    const response = {
      timestamp: new Date().toISOString(),
      timeRange: query.timeRange,
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
      const filteredSite: any = {}
      query.metrics.forEach(metric => {
        if (metric in response.site!) {
          filteredSite[metric] = (response.site as any)[metric]
        }
      })
      response.site = filteredSite
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
        'X-Analytics-Generated': response.metadata.generatedAt,
        'X-Analytics-Time': `${response.metadata.generationTime}ms`,
      },
    })

  } catch (error: any) {
    console.error('[Analytics API] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/analytics/dashboard/export
 * Exports analytics data in various formats
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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
      return NextResponse.json(
        { error: accessCheck.error },
        { status: 401 }
      )
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

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${siteId || 'system'}-${Date.now()}.csv"`,
          'Cache-Control': 'no-cache',
        },
      })
    } else if (format === 'xlsx') {
      // For Excel format, you'd typically use a library like xlsx
      // For now, return JSON with a note
      return NextResponse.json(
        {
          error: 'Excel export not implemented',
          suggestion: 'Use CSV format instead',
          data: analytics,
        },
        { status: 501 }
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

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="analytics-${siteId || 'system'}-${Date.now()}.json"`,
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error: any) {
    console.error('[Analytics Export] Error:', error)
    return NextResponse.json(
      {
        error: 'Export failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/analytics/dashboard/config
 * Updates analytics configuration for a site
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { siteId, config } = body

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      )
    }

    // Validate access
    const accessCheck = await validateAccess(siteId)
    if (!accessCheck.authorized) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: 401 }
      )
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
      return NextResponse.json(
        { error: 'Failed to update analytics configuration', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      site: data,
      updatedAt: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error('[Analytics Config] Error:', error)
    return NextResponse.json(
      {
        error: 'Configuration update failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}