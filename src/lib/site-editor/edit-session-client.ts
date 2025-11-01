/**
 * Edit Session Client Utilities
 * CLIENT-SIDE ONLY - Safe to import in client components
 * Uses browser APIs only (document.cookie, window.location, fetch)
 */

// Cookie names (shared constants)
export const EDIT_MODE_COOKIE = 'x-site-edit-mode'
export const EDIT_SESSION_COOKIE = 'x-site-edit-session'

/**
 * Client-side utilities for edit mode
 * Safe to use in 'use client' components
 */
export const editSessionUtils = {
  EDIT_MODE_COOKIE,
  EDIT_SESSION_COOKIE,

  /**
   * Check if edit mode is enabled (client-side cookie check)
   */
  isEditModeEnabled: (): boolean => {
    if (typeof document === 'undefined') return false
    return document.cookie.includes(`${EDIT_MODE_COOKIE}=true`)
  },

  /**
   * Enable edit mode (redirect to login on main app domain)
   * @param returnUrl - URL to return to after login
   *
   * Note: This is a fallback method. Components should prefer using
   * useAuthModal() context to open an in-place modal instead of redirecting.
   */
  enableEditMode: (returnUrl?: string): void => {
    // Get main app domain from environment
    const mainAppDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3001'
    const protocol = window.location.protocol

    // Create URL pointing to main app login page
    const url = new URL(`${protocol}//${mainAppDomain}/login`)

    if (returnUrl) {
      // If returnUrl is a path, prepend current origin to make it absolute
      const absoluteReturnUrl = returnUrl.startsWith('http')
        ? returnUrl
        : `${window.location.origin}${returnUrl.startsWith('/') ? returnUrl : '/' + returnUrl}`
      url.searchParams.set('returnUrl', absoluteReturnUrl)
    }
    url.searchParams.set('enableEdit', 'true')
    window.location.href = url.toString()
  },

  /**
   * Disable edit mode (client-side)
   * Calls API endpoint to clear session
   */
  disableEditMode: async (): Promise<void> => {
    try {
      await fetch('/api/site-editor/exit', { method: 'POST' })
      window.location.reload()
    } catch (error) {
      console.error('Error disabling edit mode:', error)
    }
  }
}
