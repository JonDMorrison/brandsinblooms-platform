'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUser: (attributes: { email?: string; password?: string; data?: any }) => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Fetch initial session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        setSession(session)
        setUser(session?.user ?? null)
      } catch (err) {
        console.error('Error fetching session:', err)
        setError(err as AuthError)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          router.refresh()
        } else if (event === 'SIGNED_OUT') {
          router.push('/login')
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refreshed successfully
        } else if (event === 'USER_UPDATED') {
          // Refresh user data
          const { data: { user } } = await supabase.auth.getUser()
          setUser(user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (err) {
      setError(err as AuthError)
      throw err
    }
  }, [router, supabase])

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err as AuthError)
      throw err
    }
  }, [supabase])

  const signOut = useCallback(async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (err) {
      setError(err as AuthError)
      throw err
    }
  }, [router, supabase])

  const signInWithProvider = useCallback(async (provider: 'google' | 'github') => {
    try {
      setError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err as AuthError)
      throw err
    }
  }, [supabase])

  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
    } catch (err) {
      setError(err as AuthError)
      throw err
    }
  }, [supabase])

  const updateUser = useCallback(async (attributes: { 
    email?: string; 
    password?: string; 
    data?: any 
  }) => {
    try {
      setError(null)
      const { error } = await supabase.auth.updateUser(attributes)
      if (error) throw error
    } catch (err) {
      setError(err as AuthError)
      throw err
    }
  }, [supabase])

  const refreshSession = useCallback(async () => {
    try {
      setError(null)
      const { data: { session }, error } = await supabase.auth.refreshSession()
      if (error) throw error
      setSession(session)
      setUser(session?.user ?? null)
    } catch (err) {
      setError(err as AuthError)
      throw err
    }
  }, [supabase])

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithProvider,
    resetPassword,
    updateUser,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for checking if user is authenticated
export const useIsAuthenticated = () => {
  const { user, loading } = useAuth()
  return {
    isAuthenticated: !!user,
    isLoading: loading,
  }
}

// Hook for requiring authentication
export const useRequireAuth = (redirectTo = '/login') => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading }
}