import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { updateUserPassword, generateTempPassword } from '@/lib/supabase/service-client'
import { validatePassword } from '@/lib/admin/users'
import { apiSuccess, apiError } from '@/lib/types/api'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/admin/users/[id]/password
 * Reset user password (admin only)
 *
 * Body (optional):
 * - password: string - New password (if not provided, generates a random one)
 * - generate: boolean - Force generate random password (default: true)
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

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { generate = true } = body
    let { password } = body

    // Generate password if requested or not provided
    if (generate || !password) {
      password = generateTempPassword()
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return apiError(
        passwordValidation.message || 'Invalid password',
        'VALIDATION_ERROR',
        400
      )
    }

    // Update password using service role client
    await updateUserPassword({
      userId,
      newPassword: password,
    })

    return apiSuccess({
      message: 'Password reset successfully',
      temp_password: password,
      user_id: userId,
    })

  } catch (error) {
    console.error('Error resetting password:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return apiError('User not found', 'NOT_FOUND', 404)
      }
    }

    return apiError('Failed to reset password', 'RESET_ERROR', 500)
  }
}
