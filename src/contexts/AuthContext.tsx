'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/src/lib/supabase/client'
import { validateUserSession, InactiveUserError } from '@/src/lib/auth/session-validator'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Validate session if user is signed in
      if (session?.user) {
        const validation = await validateUserSession(supabase, session.user.id)

        if (!validation.isActive) {
          // User is deactivated - sign them out
          console.warn('[Auth] Deactivated user detected during init, signing out')
          await supabase.auth.signOut()
          setSession(null)
          setUser(null)
        } else {
          setSession(session)
          setUser(session.user)
        }
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }).catch((error) => {
      console.error('[AuthContext] Error getting session:', error)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Debounce auth state changes to prevent token refresh storms
        // Clear any pending timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }

        // Set new debounced timer (150ms delay - enough to prevent storms, fast enough to be imperceptible)
        debounceTimerRef.current = setTimeout(async () => {
          // Validate session if user is signed in
          if (session?.user) {
            const validation = await validateUserSession(supabase, session.user.id)

            if (!validation.isActive) {
              // User is deactivated - sign them out
              console.warn('[Auth] Deactivated user detected in auth state change, signing out')
              await supabase.auth.signOut()
              setSession(null)
              setUser(null)
            } else {
              setSession(session)
              setUser(session.user)
            }
          } else {
            setSession(session)
            setUser(session?.user ?? null)
          }
          setLoading(false)
        }, 150)
      }
    )

    return () => {
      // Clean up debounce timer and subscription
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    // Validate that the user account is active
    if (data?.user) {
      const validation = await validateUserSession(supabase, data.user.id)

      if (!validation.isActive) {
        // User is deactivated - sign them out immediately
        await supabase.auth.signOut()
        const errorMessage = validation.reason || 'Your account has been deactivated. Please contact an administrator.'
        throw new InactiveUserError(errorMessage)
      }
    }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email.split('@')[0], // Use email username as default full name
        }
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // Clear site-related cookies when signing out to ensure clean state
    if (typeof window !== 'undefined') {
      document.cookie = 'x-site-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'x-site-subdomain=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'x-site-custom-domain=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}