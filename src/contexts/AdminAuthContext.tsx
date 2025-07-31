'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/src/lib/supabase/client'
import { Profile } from '@/src/lib/database/types'

interface AdminAuthContextType {
  user: User | null
  session: Session | null
  adminProfile: Profile | null
  isAdmin: boolean
  isLoading: boolean
  adminExists: boolean | null
  error: string | null
  
  // Actions
  checkAdminExists: () => Promise<boolean>
  createInitialAdmin: (userId: string, fullName: string) => Promise<boolean>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [adminProfile, setAdminProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [adminExists, setAdminExists] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = Boolean(adminProfile?.role === 'admin')

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Check if any admin exists in the system
  const checkAdminExists = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)
      const { data, error } = await supabase.rpc('admin_exists')
      
      if (error) {
        console.error('Error checking admin existence:', error)
        setError('Failed to check admin status')
        return false
      }
      
      const exists = Boolean(data)
      setAdminExists(exists)
      return exists
    } catch (err) {
      console.error('Unexpected error checking admin existence:', err)
      setError('Unexpected error occurred')
      return false
    }
  }, [])

  // Create initial admin user
  const createInitialAdmin = useCallback(async (userId: string, fullName: string): Promise<boolean> => {
    try {
      setError(null)
      const { data, error } = await supabase.rpc('create_initial_admin', {
        target_user_id: userId,
        admin_full_name: fullName
      })
      
      if (error) {
        console.error('Error creating initial admin:', error)
        setError(error.message)
        return false
      }
      
      if (data) {
        // Refresh admin status and profile
        await checkAdminExists()
        await fetchAdminProfile(userId)
        return true
      }
      
      return false
    } catch (err) {
      console.error('Unexpected error creating initial admin:', err)
      setError('Failed to create initial admin')
      return false
    }
  }, [checkAdminExists])

  // Fetch admin profile for current user
  const fetchAdminProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single()
      
      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          console.error('Error fetching admin profile:', error)
        }
        setAdminProfile(null)
        return
      }
      
      setAdminProfile(data)
    } catch (err) {
      console.error('Unexpected error fetching admin profile:', err)
      setAdminProfile(null)
    }
  }, [])

  // Sign in admin user
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      setIsLoading(true)
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setError(error.message)
        throw error
      }
    } catch (err) {
      console.error('Sign in error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Sign in failed')
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Sign out admin user
  const signOut = useCallback(async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setError(error.message)
        throw error
      }
      
      // Clear admin state
      setAdminProfile(null)
    } catch (err) {
      console.error('Sign out error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Sign out failed')
      }
      throw err
    }
  }, [])

  // Initialize auth state and listen for changes
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setError('Failed to get session')
          return
        }

        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          
          // Check admin existence on load
          await checkAdminExists()
          
          // If user is signed in, check if they're an admin
          if (session?.user) {
            await fetchAdminProfile(session.user.id)
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        if (mounted) {
          setError('Failed to initialize authentication')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // User signed in - check if they're an admin
          await fetchAdminProfile(session.user.id)
        } else {
          // User signed out - clear admin profile
          setAdminProfile(null)
        }
        
        setIsLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [checkAdminExists, fetchAdminProfile])

  const value: AdminAuthContextType = {
    user,
    session,
    adminProfile,
    isAdmin,
    isLoading,
    adminExists,
    error,
    checkAdminExists,
    createInitialAdmin,
    signIn,
    signOut,
    clearError,
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}