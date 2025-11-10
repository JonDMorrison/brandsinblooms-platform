/**
 * Edit Session Management
 * SERVER-SIDE ONLY - Handles authentication and permissions for full site editor
 *
 * NOTE: Do not import this file in client components.
 * Use '@/src/lib/site-editor/edit-session-client' for client-side utilities.
 */

import { createClient } from '@/src/lib/supabase/server'
import { cookies } from 'next/headers'
import { getSharedCookieDomain } from '@/src/lib/cookies/domain-config'

const EDIT_MODE_COOKIE = 'x-site-edit-mode'
const EDIT_SESSION_COOKIE = 'x-site-edit-session'

export interface EditPermissions {
  canEdit: boolean
  canManage: boolean
  canPublish: boolean
  role: 'owner' | 'admin' | 'editor' | 'viewer' | null
}

export interface EditSession {
  userId: string
  siteId: string
  permissions: EditPermissions
  expiresAt: Date
}

/**
 * Check if user has edit permissions for a site
 */
export async function checkEditPermissions(
  userId: string,
  siteId: string
): Promise<EditPermissions> {
  try {
    const supabase = await createClient()

    // Check site membership
    const { data: membership, error } = await supabase
      .from('site_memberships')
      .select('role, is_active')
      .eq('user_id', userId)
      .eq('site_id', siteId)
      .eq('is_active', true)
      .single()

    if (error || !membership) {
      return {
        canEdit: false,
        canManage: false,
        canPublish: false,
        role: null
      }
    }

    const role = membership.role as 'owner' | 'admin' | 'editor' | 'viewer'

    // Determine permissions based on role
    const permissions: EditPermissions = {
      canEdit: ['owner', 'admin', 'editor'].includes(role),
      canManage: ['owner', 'admin'].includes(role),
      canPublish: ['owner', 'admin'].includes(role),
      role
    }

    return permissions
  } catch (error) {
    console.error('Error checking edit permissions:', error)
    return {
      canEdit: false,
      canManage: false,
      canPublish: false,
      role: null
    }
  }
}

/**
 * Set edit mode session
 */
export async function setEditModeSession(
  userId: string,
  siteId: string
): Promise<boolean> {
  try {
    const permissions = await checkEditPermissions(userId, siteId)

    if (!permissions.canEdit) {
      return false
    }

    // Create session data
    const session: EditSession = {
      userId,
      siteId,
      permissions,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }

    // Set cookies with shared domain for cross-subdomain access
    const cookieStore = await cookies()
    const cookieDomain = getSharedCookieDomain()

    cookieStore.set(EDIT_MODE_COOKIE, 'true', {
      domain: cookieDomain,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    cookieStore.set(EDIT_SESSION_COOKIE, JSON.stringify(session), {
      domain: cookieDomain,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    return true
  } catch (error) {
    console.error('Error setting edit mode session:', error)
    return false
  }
}

/**
 * Get current edit mode session
 */
export async function getEditModeSession(): Promise<EditSession | null> {
  try {
    const cookieStore = await cookies()
    const editMode = cookieStore.get(EDIT_MODE_COOKIE)
    const sessionData = cookieStore.get(EDIT_SESSION_COOKIE)

    if (!editMode || !sessionData) {
      return null
    }

    const session: EditSession = JSON.parse(sessionData.value)

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await clearEditModeSession()
      return null
    }

    return session
  } catch (error) {
    console.error('Error getting edit mode session:', error)
    return null
  }
}

/**
 * Clear edit mode session
 * IMPORTANT: Must delete cookies with the same domain they were set with
 */
export async function clearEditModeSession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const cookieDomain = getSharedCookieDomain()

    // Delete cookies with same domain used when setting them
    // This is critical for proper cookie deletion across subdomains
    // Next.js cookies().delete() requires options in a specific format
    cookieStore.delete({
      name: EDIT_MODE_COOKIE,
      domain: cookieDomain,
      path: '/'
    })
    cookieStore.delete({
      name: EDIT_SESSION_COOKIE,
      domain: cookieDomain,
      path: '/'
    })
  } catch (error) {
    console.error('Error clearing edit mode session:', error)
  }
}

/**
 * Validate edit session for current request
 */
export async function validateEditSession(
  siteId: string
): Promise<{ valid: boolean; session: EditSession | null; permissions: EditPermissions }> {
  const session = await getEditModeSession()

  if (!session) {
    return {
      valid: false,
      session: null,
      permissions: {
        canEdit: false,
        canManage: false,
        canPublish: false,
        role: null
      }
    }
  }

  // Verify session site ID matches current site
  if (session.siteId !== siteId) {
    await clearEditModeSession()
    return {
      valid: false,
      session: null,
      permissions: {
        canEdit: false,
        canManage: false,
        canPublish: false,
        role: null
      }
    }
  }

  // Re-validate permissions (in case they changed)
  const currentPermissions = await checkEditPermissions(session.userId, siteId)

  if (!currentPermissions.canEdit) {
    await clearEditModeSession()
    return {
      valid: false,
      session: null,
      permissions: currentPermissions
    }
  }

  return {
    valid: true,
    session,
    permissions: currentPermissions
  }
}
