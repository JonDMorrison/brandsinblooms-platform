/**
 * Auto-Enable Edit Mode
 *
 * Automatically enables edit mode for authenticated users with edit permissions
 * when they land on a customer site from the dashboard.
 *
 * This module enables seamless cross-domain authentication by:
 * 1. Detecting if a user is authenticated (via shared Supabase cookies)
 * 2. Checking if they have edit permissions for the current site
 * 3. Automatically enabling edit mode session if they do
 */

import { getUser } from '@/src/lib/auth/server'
import {
  checkEditPermissions,
  setEditModeSession,
  getEditModeSession
} from '@/src/lib/site-editor/edit-session'

/**
 * Automatically enable edit mode if the user is authenticated and has edit permissions
 *
 * This function should be called on customer site pages before rendering to ensure
 * that authenticated site owners/editors automatically see the edit toolbar.
 *
 * @param siteId - The ID of the site to check permissions for
 * @returns Promise<boolean> - true if edit mode was enabled or already active, false otherwise
 *
 * @example
 * ```typescript
 * // In a customer site page component
 * export default async function CustomerSitePage() {
 *   const siteId = '...' // Get from context/headers
 *   await autoEnableEditModeIfOwner(siteId)
 *
 *   // Now check edit mode status as usual
 *   const editModeStatus = await getEditModeStatus()
 *   // ...
 * }
 * ```
 */
export async function autoEnableEditModeIfOwner(siteId: string): Promise<boolean> {
  try {
    // Check if edit mode is already active
    const existingSession = await getEditModeSession()
    if (existingSession && existingSession.siteId === siteId) {
      // Edit mode already enabled for this site
      return true
    }

    // Check if user is authenticated (via shared Supabase cookies)
    const user = await getUser()
    if (!user) {
      // User not authenticated - can't enable edit mode
      return false
    }

    // Check if user has edit permissions for this site
    const permissions = await checkEditPermissions(user.id, siteId)
    if (!permissions.canEdit) {
      // User doesn't have edit permissions
      return false
    }

    // User is authenticated and has permissions - enable edit mode
    const success = await setEditModeSession(user.id, siteId)

    if (success) {
      console.log(`[Auto Edit Mode] Enabled for user ${user.id} on site ${siteId}`)
    }

    return success
  } catch (error) {
    console.error('[Auto Edit Mode] Error enabling edit mode:', error)
    return false
  }
}

/**
 * Check if the current user should have edit access to the site
 *
 * This is a read-only check that doesn't modify any session state.
 * Useful for determining whether to show edit-related UI elements.
 *
 * @param siteId - The ID of the site to check
 * @returns Promise<boolean> - true if user has edit permissions, false otherwise
 */
export async function userCanEditSite(siteId: string): Promise<boolean> {
  try {
    const user = await getUser()
    if (!user) {
      return false
    }

    const permissions = await checkEditPermissions(user.id, siteId)
    return permissions.canEdit
  } catch (error) {
    console.error('[Auto Edit Mode] Error checking edit permissions:', error)
    return false
  }
}
