import { supabase } from '@/lib/supabase/client'

/**
 * Client-side session cleanup utilities
 */

export interface CleanupResult {
  success: boolean
  expiredSessionsCount: number
  error?: string
}

/**
 * Clean up expired impersonation sessions (admin-only function)
 */
export async function cleanupExpiredSessions(): Promise<CleanupResult> {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_impersonation_sessions')

    if (error) {
      console.error('Error cleaning up expired sessions:', error)
      return {
        success: false,
        expiredSessionsCount: 0,
        error: error.message
      }
    }

    const result = data as unknown as { success: boolean; expired_sessions_count: number }
    return {
      success: result.success,
      expiredSessionsCount: result.expired_sessions_count
    }
  } catch (err) {
    console.error('Unexpected error during session cleanup:', err)
    return {
      success: false,
      expiredSessionsCount: 0,
      error: 'Unexpected error occurred during cleanup'
    }
  }
}

/**
 * Check if current user's session is valid and refresh if needed
 */
export async function validateCurrentSession(sessionToken: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('get_impersonation_context', {
      token: sessionToken
    })

    if (error) {
      console.error('Error validating session:', error)
      return false
    }

    const result = data as unknown as { valid?: boolean }
    return result?.valid === true
  } catch (err) {
    console.error('Unexpected error validating session:', err)
    return false
  }
}

/**
 * Auto-cleanup expired sessions periodically (for admin dashboard)
 */
export class SessionCleanupManager {
  private cleanupInterval: NodeJS.Timeout | null = null
  private readonly cleanupIntervalMs: number

  constructor(intervalMinutes: number = 30) {
    this.cleanupIntervalMs = intervalMinutes * 60 * 1000
  }

  /**
   * Start automatic cleanup
   */
  start(): void {
    if (this.cleanupInterval) {
      this.stop()
    }

    // Run cleanup immediately
    this.runCleanup()

    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup()
    }, this.cleanupIntervalMs)

    console.log(`Session cleanup manager started (interval: ${this.cleanupIntervalMs / 60000} minutes)`)
  }

  /**
   * Stop automatic cleanup
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
      console.log('Session cleanup manager stopped')
    }
  }

  /**
   * Run cleanup once
   */
  private async runCleanup(): Promise<void> {
    try {
      const result = await cleanupExpiredSessions()
      
      if (result.success && result.expiredSessionsCount > 0) {
        console.log(`Cleaned up ${result.expiredSessionsCount} expired impersonation sessions`)
      }
      
      if (!result.success && result.error) {
        console.warn('Session cleanup failed:', result.error)
      }
    } catch (err) {
      console.error('Error during automatic session cleanup:', err)
    }
  }

  /**
   * Check if cleanup is running
   */
  isRunning(): boolean {
    return this.cleanupInterval !== null
  }
}

/**
 * Session expiry warning utilities
 */
export class SessionExpiryManager {
  private warningTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private readonly warningMinutes: number[]

  constructor(warningMinutes: number[] = [10, 5, 1]) {
    this.warningMinutes = warningMinutes.sort((a, b) => b - a) // Sort descending
  }

  /**
   * Schedule expiry warnings for a session
   */
  scheduleWarnings(
    sessionId: string,
    expiresAt: string,
    onWarning: (minutesRemaining: number) => void,
    onExpired: () => void
  ): void {
    // Clear existing warnings for this session
    this.clearWarnings(sessionId)

    const expiryTime = new Date(expiresAt).getTime()
    const now = Date.now()

    // Schedule warnings
    for (const warningMinutes of this.warningMinutes) {
      const warningTime = expiryTime - (warningMinutes * 60 * 1000)
      const timeUntilWarning = warningTime - now

      if (timeUntilWarning > 0) {
        const timeoutId = setTimeout(() => {
          onWarning(warningMinutes)
        }, timeUntilWarning)

        this.warningTimeouts.set(`${sessionId}-${warningMinutes}`, timeoutId)
      }
    }

    // Schedule expiry notification
    const timeUntilExpiry = expiryTime - now
    if (timeUntilExpiry > 0) {
      const expiredTimeoutId = setTimeout(() => {
        onExpired()
        this.clearWarnings(sessionId)
      }, timeUntilExpiry)

      this.warningTimeouts.set(`${sessionId}-expired`, expiredTimeoutId)
    }
  }

  /**
   * Clear warnings for a specific session
   */
  clearWarnings(sessionId: string): void {
    for (const [key, timeoutId] of this.warningTimeouts.entries()) {
      if (key.startsWith(sessionId)) {
        clearTimeout(timeoutId)
        this.warningTimeouts.delete(key)
      }
    }
  }

  /**
   * Clear all warnings
   */
  clearAllWarnings(): void {
    for (const timeoutId of this.warningTimeouts.values()) {
      clearTimeout(timeoutId)
    }
    this.warningTimeouts.clear()
  }

  /**
   * Get time remaining until expiry
   */
  getTimeRemaining(expiresAt: string): number {
    const expiryTime = new Date(expiresAt).getTime()
    const now = Date.now()
    return Math.max(0, Math.floor((expiryTime - now) / (1000 * 60))) // minutes
  }
}

/**
 * Global session cleanup manager instance
 */
export const globalSessionCleanupManager = new SessionCleanupManager(30) // 30 minutes

/**
 * Global session expiry manager instance
 */
export const globalSessionExpiryManager = new SessionExpiryManager([10, 5, 1])

/**
 * Initialize cleanup and expiry managers
 * Should be called in admin layouts or contexts
 */
export function initializeSessionManagers(): void {
  // Start cleanup manager if not already running
  if (!globalSessionCleanupManager.isRunning()) {
    globalSessionCleanupManager.start()
  }

  // Cleanup on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      globalSessionCleanupManager.stop()
      globalSessionExpiryManager.clearAllWarnings()
    })
  }
}

/**
 * Cleanup session managers
 * Should be called when leaving admin area
 */
export function cleanupSessionManagers(): void {
  globalSessionCleanupManager.stop()
  globalSessionExpiryManager.clearAllWarnings()
}