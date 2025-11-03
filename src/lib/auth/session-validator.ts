/**
 * Session Validator Utility
 *
 * Validates user sessions by checking if the user account is active.
 * Prevents deactivated users from accessing the system.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/lib/database/types'

export interface SessionValidationResult {
  isValid: boolean
  isActive: boolean
  reason?: string
  profile?: {
    user_id: string
    is_active: boolean
    role: string
  }
}

/**
 * Validates if a user session is active by checking their profile status
 * Uses RPC function to bypass RLS restrictions for deactivated users
 * @param supabase - Supabase client instance
 * @param userId - User ID to validate
 * @returns Validation result with status and profile info
 */
export async function validateUserSession(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<SessionValidationResult> {
  try {
    // Use RPC function that bypasses RLS to check user status
    // This allows deactivated users to check their own status
    const { data, error } = await supabase.rpc('check_user_active_status', {
      target_user_id: userId,
    })

    if (error) {
      console.error('[SessionValidator] Error checking user status:', error)
      return {
        isValid: false,
        isActive: false,
        reason: 'Unable to verify account status',
      }
    }

    // RPC returns an array, get first result
    const profile = Array.isArray(data) ? data[0] : data

    if (!profile) {
      return {
        isValid: false,
        isActive: false,
        reason: 'Profile does not exist',
      }
    }

    // Check if user is active
    if (!profile.is_active) {
      return {
        isValid: false,
        isActive: false,
        reason: 'Account has been deactivated',
        profile: {
          user_id: profile.user_id,
          is_active: profile.is_active,
          role: profile.role,
        },
      }
    }

    // User is active and valid
    return {
      isValid: true,
      isActive: true,
      profile: {
        user_id: profile.user_id,
        is_active: profile.is_active,
        role: profile.role,
      },
    }
  } catch (error) {
    console.error('[SessionValidator] Unexpected error:', error)
    return {
      isValid: false,
      isActive: false,
      reason: 'Unexpected validation error',
    }
  }
}

/**
 * Validates if a user session is active and terminates it if not
 * @param supabase - Supabase client instance
 * @param userId - User ID to validate
 * @returns Validation result
 */
export async function validateAndTerminateIfInactive(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<SessionValidationResult> {
  const result = await validateUserSession(supabase, userId)

  // If user is not active, sign them out
  if (!result.isActive) {
    console.warn('[SessionValidator] Inactive user detected, signing out:', userId)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('[SessionValidator] Error signing out inactive user:', error)
    }
  }

  return result
}

/**
 * Error class for inactive user sessions
 */
export class InactiveUserError extends Error {
  constructor(message = 'Your account has been deactivated. Please contact an administrator.') {
    super(message)
    this.name = 'InactiveUserError'
  }
}
