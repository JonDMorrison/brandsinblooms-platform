import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { getUserDetails, updateUserProfile, validateEmail, validateRole } from '@/lib/admin/users'
import { apiSuccess, apiError } from '@/lib/types/api'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/users/[id]
 * Get detailed information about a specific user
 */
export async function GET(request: NextRequest, context: RouteParams) {
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

    // Fetch user details
    const userDetails = await getUserDetails(supabase, userId)

    return apiSuccess({
      user: userDetails,
    })

  } catch (error) {
    console.error('Error fetching user details:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return apiError('User not found', 'NOT_FOUND', 404)
    }

    return apiError('Failed to fetch user details', 'FETCH_ERROR', 500)
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user profile information
 */
export async function PATCH(request: NextRequest, context: RouteParams) {
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

    // Parse request body
    const body = await request.json()
    const { email, full_name, username, phone, role, is_active } = body

    // Validate email if provided
    if (email && !validateEmail(email)) {
      return apiError('Invalid email format', 'VALIDATION_ERROR', 400)
    }

    // Validate role if provided
    if (role && !validateRole(role)) {
      return apiError('Invalid role value', 'VALIDATION_ERROR', 400)
    }

    // Update user profile
    const success = await updateUserProfile(supabase, userId, {
      email,
      full_name,
      username,
      phone,
      role,
      is_active,
    })

    if (!success) {
      return apiError('Failed to update user profile', 'UPDATE_ERROR', 500)
    }

    // Fetch updated user details
    const updatedUser = await getUserDetails(supabase, userId)

    return apiSuccess({
      user: updatedUser,
      message: 'User profile updated successfully',
    })

  } catch (error) {
    console.error('Error updating user:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return apiError('User not found', 'NOT_FOUND', 404)
      }
      if (error.message.includes('last active admin')) {
        return apiError(
          'Cannot demote the last active admin',
          'LAST_ADMIN_ERROR',
          400
        )
      }
    }

    return apiError('Failed to update user profile', 'UPDATE_ERROR', 500)
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user account (future implementation)
 * Currently not implemented - use deactivate instead
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  return apiError(
    'User deletion is not implemented. Please use deactivate instead.',
    'NOT_IMPLEMENTED',
    501
  )
}
