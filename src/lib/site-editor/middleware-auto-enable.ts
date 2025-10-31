/**
 * Middleware Auto-Enable Edit Mode
 *
 * Middleware-specific version of auto-enable edit mode that works with NextResponse cookies.
 * This runs in middleware before pages load, enabling seamless authentication across domains.
 */

import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { getEditSession } from './middleware-helpers'
import { getSharedCookieDomain } from '@/lib/cookies/domain-config'
import { debug } from '@/src/lib/utils/debug'

const EDIT_MODE_COOKIE = 'x-site-edit-mode'
const EDIT_SESSION_COOKIE = 'x-site-edit-session'

interface EditPermissions {
  canEdit: boolean
  canManage: boolean
  canPublish: boolean
  role: 'owner' | 'admin' | 'editor' | 'viewer' | null
}

interface EditSession {
  userId: string
  siteId: string
  permissions: EditPermissions
  expiresAt: string
}

/**
 * Check if user has edit permissions for a site
 * Middleware version - uses passed SupabaseClient
 */
async function checkEditPermissions(
  supabase: SupabaseClient,
  userId: string,
  siteId: string
): Promise<EditPermissions> {
  try {
    console.log('🔧 [PERMISSIONS] Checking permissions for:', { userId, siteId })
    debug.middleware(`[Auto Edit Mode] Checking permissions for user ${userId} on site ${siteId}`)

    // Check site membership
    const { data: membership, error } = await supabase
      .from('site_memberships')
      .select('role, is_active')
      .eq('user_id', userId)
      .eq('site_id', siteId)
      .eq('is_active', true)
      .single()

    console.log('🔧 [PERMISSIONS] Query result:', { membership, error: error?.message })

    if (error || !membership) {
      console.log('🔧 [PERMISSIONS] ❌ No active membership found')
      debug.middleware(`[Auto Edit Mode] No active membership found: ${error?.message || 'membership not found'}`)
      return {
        canEdit: false,
        canManage: false,
        canPublish: false,
        role: null
      }
    }

    const role = membership.role as 'owner' | 'admin' | 'editor' | 'viewer'
    console.log('🔧 [PERMISSIONS] User role:', role)
    debug.middleware(`[Auto Edit Mode] User has role: ${role}`)

    // Determine permissions based on role
    const permissions: EditPermissions = {
      canEdit: ['owner', 'admin', 'editor'].includes(role),
      canManage: ['owner', 'admin'].includes(role),
      canPublish: ['owner', 'admin'].includes(role),
      role
    }

    debug.middleware(`[Auto Edit Mode] Permissions: canEdit=${permissions.canEdit}, canManage=${permissions.canManage}`)
    return permissions
  } catch (error) {
    console.error('[Auto Edit Mode] Error checking edit permissions:', error)
    return {
      canEdit: false,
      canManage: false,
      canPublish: false,
      role: null
    }
  }
}

/**
 * Automatically enable edit mode in middleware for authenticated users with permissions
 *
 * This function should be called in middleware when handling customer site requests.
 * It checks if the user is authenticated and has edit permissions, then sets edit mode cookies.
 *
 * @param request - Next request object
 * @param response - Next response object (will be modified to set cookies)
 * @param supabase - Supabase client instance
 * @param userId - The authenticated user's ID
 * @param siteId - The site ID being accessed
 * @returns Promise<boolean> - true if edit mode was enabled, false otherwise
 */
export async function autoEnableEditModeInMiddleware(
  request: NextRequest,
  response: NextResponse,
  supabase: SupabaseClient,
  userId: string,
  siteId: string
): Promise<boolean> {
  try {
    console.log('🔧 [AUTO-ENABLE-FN] Called with:', { userId, siteId })
    debug.middleware(`[Auto Edit Mode] Attempting auto-enable for user ${userId} on site ${siteId}`)

    // Check if edit mode is already active for this site
    const existingSession = getEditSession(request)
    if (existingSession && existingSession.siteId === siteId) {
      console.log('🔧 [AUTO-ENABLE-FN] Already active for this site')
      debug.middleware(`[Auto Edit Mode] Edit mode already active for this site`)
      return true
    }

    // Check if user has edit permissions for this site
    console.log('🔧 [AUTO-ENABLE-FN] Checking permissions...')
    const permissions = await checkEditPermissions(supabase, userId, siteId)
    console.log('🔧 [AUTO-ENABLE-FN] Permissions result:', permissions)

    if (!permissions.canEdit) {
      console.log('🔧 [AUTO-ENABLE-FN] ❌ User does not have edit permissions')
      debug.middleware(`[Auto Edit Mode] User does not have edit permissions`)
      return false
    }

    // Create session data
    const session: EditSession = {
      userId,
      siteId,
      permissions,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }

    // Set cookies with shared domain for cross-subdomain access
    const cookieDomain = getSharedCookieDomain()
    console.log('🔧 [AUTO-ENABLE-FN] Setting cookies with domain:', cookieDomain)
    debug.middleware(`[Auto Edit Mode] Setting edit mode cookies with domain: ${cookieDomain}`)

    response.cookies.set(EDIT_MODE_COOKIE, 'true', {
      domain: cookieDomain,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    response.cookies.set(EDIT_SESSION_COOKIE, JSON.stringify(session), {
      domain: cookieDomain,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    console.log('🔧 [AUTO-ENABLE-FN] ✅ Cookies set successfully!')
    debug.middleware(`[Auto Edit Mode] ✅ Successfully enabled edit mode for user ${userId} on site ${siteId}`)
    return true
  } catch (error) {
    console.error('[Auto Edit Mode] Error enabling edit mode in middleware:', error)
    return false
  }
}
