/**
 * Supabase Service Role Client
 *
 * SECURITY WARNING: This client uses the service role key which bypasses ALL RLS policies.
 * NEVER import or use this client in browser-side code.
 * Only use in server-side API routes with proper authentication checks.
 *
 * The service role client provides admin-level access to:
 * - User management (create, update, delete users)
 * - Password management (reset passwords without email)
 * - Auth operations that bypass RLS
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database/types'

/**
 * Lazy-initialized Supabase admin client
 * Created on first use to avoid requiring env vars at build time
 */
let _supabaseAdmin: SupabaseClient<Database> | null = null

/**
 * Get the service role client for admin operations
 * Uses service_role key which bypasses RLS
 *
 * This function uses lazy initialization to avoid requiring
 * environment variables at build time (Next.js static analysis)
 */
function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!_supabaseAdmin) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY - This is required for admin operations')
    }

    _supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }

  return _supabaseAdmin
}

/**
 * Admin User Management Functions
 * These functions use the service role client to perform admin-level operations
 */

export interface CreateUserParams {
  email: string
  password: string
  full_name?: string
  role?: 'user' | 'site_owner' | 'admin'
}

export interface UpdateUserPasswordParams {
  userId: string
  newPassword: string
}

/**
 * Create a new user (admin only)
 * Creates auth user and profile record
 */
export async function createUser(params: CreateUserParams) {
  const { email, password, full_name, role = 'user' } = params
  const supabaseAdmin = getSupabaseAdmin()

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email for admin-created users
    user_metadata: {
      full_name: full_name || null,
    },
  })

  if (authError || !authData.user) {
    throw new Error(`Failed to create user: ${authError?.message || 'Unknown error'}`)
  }

  // Profile should be created automatically via trigger, but ensure it has the right role
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ role, full_name: full_name || null })
    .eq('user_id', authData.user.id)

  if (profileError) {
    // Profile might not exist yet, try insert
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email,
        full_name: full_name || null,
        role,
      })

    if (insertError) {
      console.error('Failed to create/update profile:', insertError)
      // Don't throw here - user is created, profile can be fixed later
    }
  }

  return authData.user
}

/**
 * Update user password (admin only)
 * Bypasses the need for email confirmation
 */
export async function updateUserPassword(params: UpdateUserPasswordParams) {
  const { userId, newPassword } = params
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  )

  if (error) {
    throw new Error(`Failed to update password: ${error.message}`)
  }

  return data.user
}

/**
 * Delete user (admin only)
 * Permanently deletes user and cascades to profiles/memberships
 */
export async function deleteUser(userId: string) {
  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`)
  }

  return true
}

/**
 * Get user by ID (admin only)
 * Returns full user details from auth.users
 */
export async function getUserById(userId: string) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)

  if (error) {
    throw new Error(`Failed to get user: ${error.message}`)
  }

  return data.user
}

/**
 * List all users (admin only)
 * Returns paginated list of users from auth.users
 */
export async function listUsers(page = 1, perPage = 1000) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page,
    perPage,
  })

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`)
  }

  return data
}

/**
 * Generate a secure random password
 * Used for admin password resets
 */
export function generateTempPassword(length = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const randomValues = new Uint8Array(length)

  // Use crypto.getRandomValues for secure randomness
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues)
  } else {
    // Fallback for environments without crypto (shouldn't happen in Node.js)
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * charset.length)
    }
  }

  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length]
  }

  return password
}
