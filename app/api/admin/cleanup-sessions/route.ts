import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * API endpoint for cleaning up expired impersonation sessions
 * Can be called by cron jobs, monitoring systems, or admin interfaces
 */
export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    // Call the cleanup function
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('cleanup_expired_impersonation_sessions')

    if (cleanupError) {
      console.error('Error during session cleanup:', cleanupError)
      return NextResponse.json(
        { 
          error: 'Failed to cleanup sessions',
          details: cleanupError.message 
        },
        { status: 500 }
      )
    }

    // Return cleanup results
    return NextResponse.json({
      success: true,
      expired_sessions_count: cleanupResult.expired_sessions_count,
      cleanup_timestamp: cleanupResult.cleanup_timestamp,
      message: `Successfully cleaned up ${cleanupResult.expired_sessions_count} expired sessions`
    })

  } catch (error) {
    console.error('Unexpected error during session cleanup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check cleanup status and get statistics
 */
export async function GET(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
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
      return NextResponse.json(
        { error: 'Failed to fetch session statistics' },
        { status: 500 }
      )
    }

    // Count sessions by expiry status
    const now = new Date()
    const sessions = activeSessions.sessions || []
    
    const expiringCount = sessions.filter((session: any) => {
      const expiryTime = new Date(session.expires_at)
      const timeUntilExpiry = expiryTime.getTime() - now.getTime()
      return timeUntilExpiry <= 10 * 60 * 1000 // Expiring within 10 minutes
    }).length

    return NextResponse.json({
      active_sessions_count: sessions.length,
      expiring_sessions_count: expiringCount,
      last_cleanup_check: now.toISOString(),
      cleanup_threshold_minutes: 10,
      total_sessions_fetched: sessions.length
    })

  } catch (error) {
    console.error('Unexpected error fetching cleanup statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS for CORS support
 */
export async function OPTIONS() {
  return NextResponse.json(
    { message: 'Session cleanup endpoint' },
    { 
      status: 200,
      headers: {
        'Allow': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    }
  )
}