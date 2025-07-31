'use client'

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  ReactNode 
} from 'react'
import { useAdminAuth } from './AdminAuthContext'
import { supabase } from '@/src/lib/supabase/client'
import { 
  globalSessionExpiryManager, 
  initializeSessionManagers,
  cleanupSessionManagers 
} from '@/src/lib/admin/session-cleanup'
import { toast } from 'sonner'

// Impersonation session types
export interface ImpersonationSession {
  session_id: string
  session_token: string
  admin_user_id: string
  admin_email: string
  admin_name: string
  site_id: string
  site_name: string
  site_subdomain: string
  site_custom_domain?: string
  impersonated_user_id?: string
  impersonated_user_email?: string
  impersonated_user_name?: string
  created_at: string
  expires_at: string
  purpose?: string
  allowed_actions?: string[]
  restrictions?: Record<string, any>
}

export interface ActiveImpersonationSession {
  id: string
  admin_user_id: string
  admin_email: string
  admin_name: string
  site_id: string
  site_name: string
  site_subdomain: string
  impersonated_user_id?: string
  impersonated_user_email?: string
  impersonated_user_name?: string
  created_at: string
  expires_at: string
  last_used_at: string
  purpose?: string
  ip_address?: string
  allowed_actions?: string[]
}

export interface ImpersonationContextType {
  // Current impersonation state
  currentSession: ImpersonationSession | null
  isImpersonating: boolean
  loading: boolean
  error: string | null

  // Active sessions management
  activeSessions: ActiveImpersonationSession[]
  activeSessionsLoading: boolean
  activeSessionsError: string | null

  // Actions
  startImpersonation: (params: StartImpersonationParams) => Promise<ImpersonationSession | null>
  endCurrentImpersonation: () => Promise<void>
  endImpersonationSession: (sessionId: string) => Promise<void>
  validateCurrentSession: () => Promise<boolean>
  refreshActiveSessions: () => Promise<void>
  clearError: () => void

  // Utilities
  getTimeRemaining: () => number | null // minutes remaining
  isSessionExpiringSoon: () => boolean // within 10 minutes
}

export interface StartImpersonationParams {
  siteId: string
  impersonatedUserId?: string
  purpose?: string
  durationHours?: number
  allowedActions?: string[]
}

const AdminImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined)

const IMPERSONATION_TOKEN_KEY = 'admin_impersonation_token'
const SESSION_REFRESH_INTERVAL = 60000 // 1 minute
const EXPIRY_WARNING_MINUTES = 10

interface AdminImpersonationProviderProps {
  children: ReactNode
}

export function AdminImpersonationProvider({ children }: AdminImpersonationProviderProps) {
  // Core state
  const [currentSession, setCurrentSession] = useState<ImpersonationSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Active sessions state
  const [activeSessions, setActiveSessions] = useState<ActiveImpersonationSession[]>([])
  const [activeSessionsLoading, setActiveSessionsLoading] = useState(false)
  const [activeSessionsError, setActiveSessionsError] = useState<string | null>(null)

  const { isAdmin, user } = useAdminAuth()

  const isImpersonating = Boolean(currentSession)

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null)
    setActiveSessionsError(null)
  }, [])

  // Get remaining time in minutes
  const getTimeRemaining = useCallback((): number | null => {
    if (!currentSession) return null
    
    const expiryTime = new Date(currentSession.expires_at).getTime()
    const now = Date.now()
    const remaining = Math.max(0, expiryTime - now)
    
    return Math.floor(remaining / (1000 * 60)) // minutes
  }, [currentSession])

  // Check if session is expiring soon
  const isSessionExpiringSoon = useCallback((): boolean => {
    const remaining = getTimeRemaining()
    return remaining !== null && remaining <= EXPIRY_WARNING_MINUTES
  }, [getTimeRemaining])

  // Start impersonation session
  const startImpersonation = useCallback(async (
    params: StartImpersonationParams
  ): Promise<ImpersonationSession | null> => {
    if (!isAdmin) {
      setError('Admin privileges required')
      return null
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('start_admin_impersonation', {
        site_uuid: params.siteId,
        impersonated_user_uuid: params.impersonatedUserId || null,
        purpose_text: params.purpose || null,
        duration_hours: params.durationHours || 2,
        allowed_actions_list: params.allowedActions || null,
        ip_addr: null, // Will be populated by the function if needed
        user_agent_val: typeof navigator !== 'undefined' ? navigator.userAgent : null
      })

      if (rpcError) {
        console.error('Error starting impersonation:', rpcError)
        setError(rpcError.message)
        return null
      }

      if (!data) {
        setError('Failed to start impersonation session')
        return null
      }

      // Validate the session with the server
      const sessionContext = await validateSession(data.session_token)
      if (!sessionContext) {
        setError('Failed to validate impersonation session')
        return null
      }

      // Store token securely
      if (typeof window !== 'undefined') {
        localStorage.setItem(IMPERSONATION_TOKEN_KEY, data.session_token)
      }

      setCurrentSession(sessionContext)
      
      // Set up expiry warnings for this session
      globalSessionExpiryManager.scheduleWarnings(
        sessionContext.session_id,
        sessionContext.expires_at,
        (minutesRemaining) => {
          toast.warning(`Impersonation session expiring in ${minutesRemaining} minutes`, {
            description: `Session for ${sessionContext.site_name} will expire soon`
          })
        },
        () => {
          toast.error('Impersonation session has expired', {
            description: 'You have been logged out of the impersonation session'
          })
          // Clear expired session
          setCurrentSession(null)
          if (typeof window !== 'undefined') {
            localStorage.removeItem(IMPERSONATION_TOKEN_KEY)
          }
        }
      )
      
      // Refresh active sessions list
      refreshActiveSessions()

      return sessionContext

    } catch (err) {
      console.error('Unexpected error starting impersonation:', err)
      setError('Failed to start impersonation session')
      return null
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  // Validate session with server
  const validateSession = useCallback(async (token: string): Promise<ImpersonationSession | null> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_impersonation_context', {
        token
      })

      if (rpcError) {
        console.error('Error validating impersonation session:', rpcError)
        return null
      }

      if (!data || !data.valid) {
        return null
      }

      // Transform the response to match our interface
      return {
        session_id: data.session_id,
        session_token: token,
        admin_user_id: data.admin_user_id,
        admin_email: data.admin_email,
        admin_name: data.admin_name,
        site_id: data.site_id,
        site_name: data.site_name,
        site_subdomain: data.site_subdomain,
        site_custom_domain: data.site_custom_domain,
        impersonated_user_id: data.impersonated_user_id,
        impersonated_user_email: data.impersonated_user_email,
        impersonated_user_name: data.impersonated_user_name,
        created_at: data.created_at,
        expires_at: data.expires_at,
        purpose: data.purpose,
        allowed_actions: data.allowed_actions,
        restrictions: data.restrictions
      }
    } catch (err) {
      console.error('Unexpected error validating session:', err)
      return null
    }
  }, [])

  // Validate current session
  const validateCurrentSession = useCallback(async (): Promise<boolean> => {
    if (!currentSession) return false

    const validatedSession = await validateSession(currentSession.session_token)
    if (validatedSession) {
      setCurrentSession(validatedSession)
      return true
    } else {
      // Session is invalid, clear it
      setCurrentSession(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(IMPERSONATION_TOKEN_KEY)
      }
      return false
    }
  }, [currentSession, validateSession])

  // End current impersonation session
  const endCurrentImpersonation = useCallback(async (): Promise<void> => {
    if (!currentSession) return

    try {
      setLoading(true)
      setError(null)

      const { error: rpcError } = await supabase.rpc('end_impersonation_session', {
        session_token_param: currentSession.session_token,
        session_id_param: null,
        end_reason_param: 'manual'
      })

      if (rpcError) {
        console.error('Error ending impersonation:', rpcError)
        setError(rpcError.message)
        return
      }

      // Clear expiry warnings
      globalSessionExpiryManager.clearWarnings(currentSession.session_id)
      
      // Clear local state
      setCurrentSession(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(IMPERSONATION_TOKEN_KEY)
      }

      // Refresh active sessions list
      refreshActiveSessions()

    } catch (err) {
      console.error('Unexpected error ending impersonation:', err)
      setError('Failed to end impersonation session')
    } finally {
      setLoading(false)
    }
  }, [currentSession])

  // End specific impersonation session
  const endImpersonationSession = useCallback(async (sessionId: string): Promise<void> => {
    if (!isAdmin) {
      setError('Admin privileges required')
      return
    }

    try {
      setActiveSessionsLoading(true)
      setActiveSessionsError(null)

      const { error: rpcError } = await supabase.rpc('end_impersonation_session', {
        session_token_param: null,
        session_id_param: sessionId,
        end_reason_param: 'manual'
      })

      if (rpcError) {
        console.error('Error ending impersonation session:', rpcError)
        setActiveSessionsError(rpcError.message)
        return
      }

      // If this was our current session, clear it
      if (currentSession && currentSession.session_id === sessionId) {
        setCurrentSession(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem(IMPERSONATION_TOKEN_KEY)
        }
      }

      // Refresh active sessions list
      await refreshActiveSessions()

    } catch (err) {
      console.error('Unexpected error ending impersonation session:', err)
      setActiveSessionsError('Failed to end impersonation session')
    } finally {
      setActiveSessionsLoading(false)
    }
  }, [isAdmin, currentSession])

  // Refresh active sessions
  const refreshActiveSessions = useCallback(async (): Promise<void> => {
    if (!isAdmin) return

    try {
      setActiveSessionsLoading(true)
      setActiveSessionsError(null)

      const { data, error: rpcError } = await supabase.rpc('get_active_impersonation_sessions', {
        admin_user_uuid: null, // Get all sessions for monitoring
        site_uuid: null,
        limit_count: 100
      })

      if (rpcError) {
        console.error('Error fetching active sessions:', rpcError)
        setActiveSessionsError(rpcError.message)
        return
      }

      setActiveSessions(data?.sessions || [])

    } catch (err) {
      console.error('Unexpected error fetching active sessions:', err)
      setActiveSessionsError('Failed to fetch active sessions')
    } finally {
      setActiveSessionsLoading(false)
    }
  }, [isAdmin])

  // Initialize impersonation state on mount
  useEffect(() => {
    if (!isAdmin || typeof window === 'undefined') return

    // Initialize session managers
    initializeSessionManagers()

    const storedToken = localStorage.getItem(IMPERSONATION_TOKEN_KEY)
    if (storedToken) {
      // Validate stored session
      validateSession(storedToken).then(session => {
        if (session) {
          setCurrentSession(session)
        } else {
          // Invalid session, remove stored token
          localStorage.removeItem(IMPERSONATION_TOKEN_KEY)
        }
      })
    }

    // Load active sessions
    refreshActiveSessions()

    // Cleanup on unmount
    return () => {
      cleanupSessionManagers()
    }
  }, [isAdmin, validateSession, refreshActiveSessions])

  // Set up session validation interval
  useEffect(() => {
    if (!currentSession) return

    const interval = setInterval(() => {
      validateCurrentSession()
    }, SESSION_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [currentSession, validateCurrentSession])

  // Auto-refresh active sessions periodically
  useEffect(() => {
    if (!isAdmin) return

    const interval = setInterval(() => {
      refreshActiveSessions()
    }, SESSION_REFRESH_INTERVAL * 2) // Less frequent than session validation

    return () => clearInterval(interval)
  }, [isAdmin, refreshActiveSessions])

  const value: ImpersonationContextType = {
    // Current session state
    currentSession,
    isImpersonating,
    loading,
    error,

    // Active sessions management
    activeSessions,
    activeSessionsLoading,
    activeSessionsError,

    // Actions
    startImpersonation,
    endCurrentImpersonation,
    endImpersonationSession,
    validateCurrentSession,
    refreshActiveSessions,
    clearError,

    // Utilities
    getTimeRemaining,
    isSessionExpiringSoon,
  }

  return (
    <AdminImpersonationContext.Provider value={value}>
      {children}
    </AdminImpersonationContext.Provider>
  )
}

/**
 * Hook to access admin impersonation context
 */
export const useAdminImpersonation = () => {
  const context = useContext(AdminImpersonationContext)
  if (context === undefined) {
    throw new Error('useAdminImpersonation must be used within an AdminImpersonationProvider')
  }
  return context
}

/**
 * Hook to access current impersonation session
 */
export const useCurrentImpersonation = () => {
  const { currentSession, isImpersonating, loading, error, getTimeRemaining, isSessionExpiringSoon } = useAdminImpersonation()
  
  return {
    session: currentSession,
    isActive: isImpersonating,
    loading,
    error,
    timeRemaining: getTimeRemaining(),
    isExpiringSoon: isSessionExpiringSoon()
  }
}

/**
 * Hook for managing impersonation sessions
 */
export const useImpersonationManager = () => {
  const { 
    startImpersonation, 
    endCurrentImpersonation, 
    endImpersonationSession,
    activeSessions,
    activeSessionsLoading,
    activeSessionsError,
    refreshActiveSessions,
    loading,
    error,
    clearError
  } = useAdminImpersonation()
  
  return {
    startImpersonation,
    endCurrentImpersonation,
    endSession: endImpersonationSession,
    activeSessions,
    loading: loading || activeSessionsLoading,
    error: error || activeSessionsError,
    refreshSessions: refreshActiveSessions,
    clearError
  }
}