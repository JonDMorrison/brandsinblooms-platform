import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { toggleUserStatus, getUserDetails } from '@/lib/admin/users'
import { apiSuccess, apiError } from '@/lib/types/api'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/admin/users/[id]/deactivate
 * Toggle user active status (activate/deactivate)
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { id: userId } = await context.params

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
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

    // Toggle user status
    const newStatus = await toggleUserStatus(supabase, userId)

    // Fetch updated user details
    const updatedUser = await getUserDetails(supabase, userId)

    return apiSuccess({
      user: updatedUser,
      new_status: newStatus,
      message: newStatus
        ? 'User activated successfully'
        : 'User deactivated successfully',
    })

  } catch (error) {
    console.error('Error toggling user status:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return apiError('User not found', 'NOT_FOUND', 404)
      }
      if (error.message.includes('last active admin')) {
        return apiError(
          'Cannot deactivate the last active admin',
          'LAST_ADMIN_ERROR',
          400
        )
      }
    }

    return apiError('Failed to toggle user status', 'TOGGLE_ERROR', 500)
  }
}
