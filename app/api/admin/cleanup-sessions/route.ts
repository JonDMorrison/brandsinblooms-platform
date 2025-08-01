import { createServerClient } from '@supabase/ssr'
import { ApiRequest, ApiResponse, apiSuccess, apiError, ApiResult } from '@/src/lib/types/api'

/**
 * API endpoint for cleaning up expired impersonation sessions
 * Can be called by cron jobs, monitoring systems, or admin interfaces
 */
interface CleanupSessionsData {
  expired_sessions_count: number
  cleanup_timestamp: string
  message: string
}

export const POST = async (request: ApiRequest<void>): Promise<ApiResponse<ApiResult<CleanupSessionsData>>> => {
  try {
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Cookie setting is handled by the response
          },
        },
      }
    )

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return apiError('Authentication required', 'AUTH_REQUIRED', 401)
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return apiError('Admin privileges required', 'ADMIN_REQUIRED', 403)
    }

    // Call the cleanup function
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('cleanup_expired_impersonation_sessions')

    if (cleanupError) {
      console.error('Error during session cleanup:', cleanupError)
      return apiError(
        'Failed to cleanup sessions',
        'CLEANUP_FAILED',
        500
      )
    }

    // Return cleanup results
    return apiSuccess({
      expired_sessions_count: cleanupResult.expired_sessions_count,
      cleanup_timestamp: cleanupResult.cleanup_timestamp,
      message: `Successfully cleaned up ${cleanupResult.expired_sessions_count} expired sessions`
    })

  } catch (error) {
    console.error('Unexpected error during session cleanup:', error)
    return apiError('Internal server error', 'INTERNAL_ERROR', 500)
  }
}

/**
 * GET endpoint to check cleanup status and get statistics
 */
interface SessionStatsData {
  active_sessions_count: number
  expiring_sessions_count: number
  last_cleanup_check: string
  cleanup_threshold_minutes: number
  total_sessions_fetched: number
}

export const GET = async (request: ApiRequest<void>): Promise<ApiResponse<ApiResult<SessionStatsData>>> => {
  try {
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Cookie setting is handled by the response
          },
        },
      }
    )

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return apiError('Authentication required', 'AUTH_REQUIRED', 401)
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return apiError('Admin privileges required', 'ADMIN_REQUIRED', 403)
    }

    // Get active sessions count
    const { data: activeSessions, error: activeError } = await supabase
      .rpc('get_active_impersonation_sessions', {
        admin_user_uuid: null,
        site_uuid: null,
        limit_count: 1000
      })

    if (activeError) {
      console.error('Error fetching active sessions:', activeError)
      return apiError(
        'Failed to fetch session statistics',
        'SESSION_STATS_ERROR',
        500
      )
    }

    // Count sessions by expiry status
    const now = new Date()
    const sessions = (activeSessions.sessions as Array<{ expires_at: string }>) || []
    
    const expiringCount = sessions.filter((session) => {
      const expiryTime = new Date(session.expires_at)
      const timeUntilExpiry = expiryTime.getTime() - now.getTime()
      return timeUntilExpiry <= 10 * 60 * 1000 // Expiring within 10 minutes
    }).length

    return apiSuccess({
      active_sessions_count: sessions.length,
      expiring_sessions_count: expiringCount,
      last_cleanup_check: now.toISOString(),
      cleanup_threshold_minutes: 10,
      total_sessions_fetched: sessions.length
    })

  } catch (error) {
    console.error('Unexpected error fetching cleanup statistics:', error)
    return apiError('Internal server error', 'INTERNAL_ERROR', 500)
  }
}

/**
 * OPTIONS for CORS support
 */
export const OPTIONS = async () => {
  const response = apiSuccess({ message: 'Session cleanup endpoint' })
  response.headers.set('Allow', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}