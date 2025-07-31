import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'

/**
 * Get the current user from the server-side Supabase client.
 * This function is cached per request to avoid multiple database calls.
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // Don't log auth session missing errors as they're expected for non-authenticated users
  if (error && error.message !== 'Auth session missing!') {
    console.error('Error fetching user:', error)
  }
  
  return user || null
})

/**
 * Get the current session from the server-side Supabase client.
 * This function is cached per request to avoid multiple database calls.
 */
export const getSession = cache(async () => {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  // Don't log auth session missing errors as they're expected for non-authenticated users
  if (error && error.message !== 'Auth session missing!') {
    console.error('Error fetching session:', error)
  }
  
  return session || null
})

/**
 * Check if the user is authenticated.
 * Returns true if authenticated, false otherwise.
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getUser()
  return !!user
}

/**
 * Require authentication for a server component or route handler.
 * Redirects to login page if not authenticated.
 */
export const requireAuth = async (redirectTo = '/login') => {
  const user = await getUser()
  
  if (!user) {
    redirect(redirectTo)
  }
  
  return user
}

/**
 * Require the user to be unauthenticated (for login/signup pages).
 * Redirects to dashboard if already authenticated.
 */
export const requireGuest = async (redirectTo = '/dashboard') => {
  const user = await getUser()
  
  if (user) {
    redirect(redirectTo)
  }
}

/**
 * Sign out the user from the server side.
 * This is useful for server actions.
 */
export const signOut = async () => {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
  
  redirect('/login')
}

/**
 * Refresh the user's session from the server side.
 */
export const refreshSession = async () => {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.refreshSession()
  
  if (error) {
    console.error('Error refreshing session:', error)
    throw error
  }
  
  return session
}

/**
 * Get user profile data with additional fields from the database.
 * This assumes you have a profiles table linked to auth.users.
 */
export const getUserProfile = cache(async () => {
  const user = await getUser()
  if (!user) return null
  
  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  
  return {
    ...user,
    profile,
  }
})

/**
 * Check if user has a specific role.
 * This assumes roles are stored in user metadata or a separate table.
 */
export const hasRole = async (role: string): Promise<boolean> => {
  const user = await getUser()
  if (!user) return false
  
  // Check if role is in user metadata
  const userRole = user.user_metadata?.role || user.app_metadata?.role
  return userRole === role
}

/**
 * Check if user has any of the specified roles.
 */
export const hasAnyRole = async (roles: string[]): Promise<boolean> => {
  const user = await getUser()
  if (!user) return false
  
  const userRole = user.user_metadata?.role || user.app_metadata?.role
  return roles.includes(userRole)
}

/**
 * Server action for updating user metadata.
 */
export const updateUserMetadata = async (metadata: Record<string, any>) => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  })
  
  if (error) {
    console.error('Error updating user metadata:', error)
    throw error
  }
  
  return data.user
}