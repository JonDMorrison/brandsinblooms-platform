/**
 * Admin User Management Service
 *
 * Provides comprehensive user management capabilities for platform administrators.
 * All functions require admin privileges and include proper error handling.
 *
 * IMPORTANT: All functions that interact with the database require a SupabaseClient
 * parameter. This ensures proper authentication context when called from server-side
 * code (API routes) or client-side code.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database/types'

// Type definitions for user management
export interface UserProfile {
  user_id: string
  email: string | null
  full_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  phone: string | null
  role: 'user' | 'site_owner' | 'admin'
  is_active: boolean
  created_at: string
  updated_at: string
  last_sign_in_at: string | null
}

export interface UserDetails extends UserProfile {
  email_confirmed_at: string | null
  site_count: number
}

export interface UserListFilters {
  search?: string
  role?: 'user' | 'site_owner' | 'admin'
  status?: boolean // true = active, false = inactive
  limit?: number
  offset?: number
}

export interface UserListResult {
  users: UserProfile[]
  total: number
  page: number
  per_page: number
}

export interface UserUpdateParams {
  email?: string
  full_name?: string
  username?: string
  phone?: string
  role?: 'user' | 'site_owner' | 'admin'
  is_active?: boolean
}

/**
 * Custom error class for admin user operations
 */
export class AdminUserError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AdminUserError'
  }
}

/**
 * Check if current user has admin access
 * @param client - Authenticated Supabase client with user context
 */
export async function checkAdminAccess(client: SupabaseClient<Database>): Promise<boolean> {
  try {
    const { data, error } = await client.rpc('is_admin')

    if (error) {
      console.error('Failed to check admin access:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Error checking admin access:', error)
    return false
  }
}

/**
 * Require admin access or throw error
 * @param client - Authenticated Supabase client with user context
 */
export async function requireAdminAccess(client: SupabaseClient<Database>): Promise<void> {
  const isAdmin = await checkAdminAccess(client)

  if (!isAdmin) {
    throw new AdminUserError(
      'Unauthorized: Admin access required',
      'UNAUTHORIZED'
    )
  }
}

/**
 * Get all users with search, filtering, and pagination
 * @param client - Authenticated Supabase client with user context
 * @param filters - Optional filters for search, role, status, and pagination
 */
export async function getAllUsers(
  client: SupabaseClient<Database>,
  filters: UserListFilters = {}
): Promise<UserListResult> {
  try {
    await requireAdminAccess(client)

    const {
      search = undefined,
      role = undefined,
      status = undefined,
      limit = 20,
      offset = 0,
    } = filters

    // Get users
    const { data: users, error: usersError } = await client.rpc(
      'get_all_users',
      {
        search_query: search,
        role_filter: role,
        status_filter: status,
        limit_count: limit,
        offset_count: offset,
      }
    )

    if (usersError) {
      throw new AdminUserError(
        'Failed to fetch users',
        'FETCH_ERROR',
        usersError
      )
    }

    // Get total count
    const { data: totalCount, error: countError } = await client.rpc(
      'admin_count_users',
      {
        search_query: search,
        role_filter: role,
        status_filter: status,
      }
    )

    if (countError) {
      throw new AdminUserError(
        'Failed to count users',
        'COUNT_ERROR',
        countError
      )
    }

    return {
      users: (users as unknown as UserProfile[]) || [],
      total: totalCount || 0,
      page: Math.floor(offset / limit) + 1,
      per_page: limit,
    }
  } catch (error) {
    if (error instanceof AdminUserError) {
      throw error
    }
    throw new AdminUserError(
      'Unexpected error fetching users',
      'UNKNOWN_ERROR',
      error
    )
  }
}

/**
 * Get detailed information about a specific user
 * @param client - Authenticated Supabase client with user context
 * @param userId - The user ID to fetch details for
 */
export async function getUserDetails(
  client: SupabaseClient<Database>,
  userId: string
): Promise<UserDetails> {
  try {
    await requireAdminAccess(client)

    const { data, error } = await client.rpc('admin_get_user_details', {
      target_user_id: userId,
    })

    if (error) {
      throw new AdminUserError(
        'Failed to fetch user details',
        'FETCH_ERROR',
        error
      )
    }

    if (!data || data.length === 0) {
      throw new AdminUserError('User not found', 'NOT_FOUND')
    }

    return data[0] as unknown as UserDetails
  } catch (error) {
    if (error instanceof AdminUserError) {
      throw error
    }
    throw new AdminUserError(
      'Unexpected error fetching user details',
      'UNKNOWN_ERROR',
      error
    )
  }
}

/**
 * Update user profile information
 * @param client - Authenticated Supabase client with user context
 * @param userId - The user ID to update
 * @param updates - Profile fields to update
 */
export async function updateUserProfile(
  client: SupabaseClient<Database>,
  userId: string,
  updates: UserUpdateParams
): Promise<boolean> {
  try {
    await requireAdminAccess(client)

    const { data, error } = await client.rpc('admin_update_user_profile', {
      target_user_id: userId,
      new_email: updates.email,
      new_full_name: updates.full_name,
      new_username: updates.username,
      new_phone: updates.phone,
      new_role: updates.role,
      new_is_active: updates.is_active,
    })

    if (error) {
      throw new AdminUserError(
        'Failed to update user profile',
        'UPDATE_ERROR',
        error
      )
    }

    return data === true
  } catch (error) {
    if (error instanceof AdminUserError) {
      throw error
    }
    throw new AdminUserError(
      'Unexpected error updating user profile',
      'UNKNOWN_ERROR',
      error
    )
  }
}

/**
 * Toggle user active status (activate/deactivate)
 * @param client - Authenticated Supabase client with user context
 * @param userId - The user ID to toggle status for
 */
export async function toggleUserStatus(
  client: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  try {
    await requireAdminAccess(client)

    const { data, error } = await client.rpc('admin_toggle_user_status', {
      target_user_id: userId,
    })

    if (error) {
      throw new AdminUserError(
        'Failed to toggle user status',
        'TOGGLE_ERROR',
        error
      )
    }

    return data === true
  } catch (error) {
    if (error instanceof AdminUserError) {
      throw error
    }
    throw new AdminUserError(
      'Unexpected error toggling user status',
      'UNKNOWN_ERROR',
      error
    )
  }
}

/**
 * Search users by query string
 * Shorthand for getAllUsers with search parameter
 * @param client - Authenticated Supabase client with user context
 * @param query - Search query string
 * @param limit - Maximum number of results (default: 20)
 */
export async function searchUsers(
  client: SupabaseClient<Database>,
  query: string,
  limit = 20
): Promise<UserProfile[]> {
  const result = await getAllUsers(client, { search: query, limit })
  return result.users
}

/**
 * Get users by role
 * @param client - Authenticated Supabase client with user context
 * @param role - User role to filter by
 * @param limit - Maximum number of results (default: 100)
 */
export async function getUsersByRole(
  client: SupabaseClient<Database>,
  role: 'user' | 'site_owner' | 'admin',
  limit = 100
): Promise<UserProfile[]> {
  const result = await getAllUsers(client, { role, limit })
  return result.users
}

/**
 * Get active/inactive users
 * @param client - Authenticated Supabase client with user context
 * @param isActive - Filter by active status
 * @param limit - Maximum number of results (default: 100)
 */
export async function getUsersByStatus(
  client: SupabaseClient<Database>,
  isActive: boolean,
  limit = 100
): Promise<UserProfile[]> {
  const result = await getAllUsers(client, { status: isActive, limit })
  return result.users
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * Minimum 8 characters, at least one letter and one number
 */
export function validatePassword(password: string): {
  valid: boolean
  message?: string
} {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }

  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter' }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }

  return { valid: true }
}

/**
 * Validate role value
 */
export function validateRole(role: string): role is 'user' | 'site_owner' | 'admin' {
  return ['user', 'site_owner', 'admin'].includes(role)
}
