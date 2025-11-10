/**
 * Middleware-specific helpers for edit session management
 * These work with NextRequest/NextResponse cookies
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSharedCookieDomain } from '@/src/lib/cookies/domain-config'

const EDIT_MODE_COOKIE = 'x-site-edit-mode'
const EDIT_SESSION_COOKIE = 'x-site-edit-session'

export interface EditSession {
  userId: string
  siteId: string
  permissions: {
    canEdit: boolean
    canManage: boolean
    canPublish: boolean
    role: 'owner' | 'admin' | 'editor' | 'viewer' | null
  }
  expiresAt: string
}

/**
 * Check if edit mode is enabled in request
 */
export function isEditModeEnabled(request: NextRequest): boolean {
  return request.cookies.get(EDIT_MODE_COOKIE)?.value === 'true'
}

/**
 * Get edit session from request cookies
 */
export function getEditSession(request: NextRequest): EditSession | null {
  try {
    const editMode = request.cookies.get(EDIT_MODE_COOKIE)
    const sessionData = request.cookies.get(EDIT_SESSION_COOKIE)

    if (!editMode || !sessionData) {
      return null
    }

    const session: EditSession = JSON.parse(sessionData.value)

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      return null
    }

    return session
  } catch (error) {
    console.error('Error parsing edit session:', error)
    return null
  }
}

/**
 * Set edit mode headers on response
 */
export function setEditModeHeaders(
  response: NextResponse,
  session: EditSession
): void {
  response.headers.set('x-edit-mode', 'true')
  response.headers.set('x-edit-user-id', session.userId)
  response.headers.set('x-edit-permissions', JSON.stringify(session.permissions))
}

/**
 * Clear edit mode cookies on response
 */
export function clearEditModeCookies(response: NextResponse): void {
  const cookieDomain = getSharedCookieDomain()

  // Delete with domain to ensure cookies are cleared across subdomains
  response.cookies.set(EDIT_MODE_COOKIE, '', {
    domain: cookieDomain,
    maxAge: 0,
    path: '/'
  })
  response.cookies.set(EDIT_SESSION_COOKIE, '', {
    domain: cookieDomain,
    maxAge: 0,
    path: '/'
  })
}

/**
 * Validate edit session for site
 */
export function validateEditSessionForSite(
  request: NextRequest,
  siteId: string
): { valid: boolean; session: EditSession | null } {
  const session = getEditSession(request)

  if (!session) {
    return { valid: false, session: null }
  }

  // Verify session site ID matches current site
  if (session.siteId !== siteId) {
    return { valid: false, session: null }
  }

  // Verify permissions
  if (!session.permissions.canEdit) {
    return { valid: false, session: null }
  }

  return { valid: true, session }
}
