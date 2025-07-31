'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  allowedRoles?: string[]
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/login',
  allowedRoles 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }

    // Check for role-based access if roles are specified
    if (!loading && user && allowedRoles) {
      const userRole = user.user_metadata?.role || user.app_metadata?.role
      if (!allowedRoles.includes(userRole)) {
        router.push('/unauthorized')
      }
    }
  }, [user, loading, router, redirectTo, allowedRoles])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't render children if not authenticated
  if (!user) {
    return null
  }

  // Check role-based access
  if (allowedRoles) {
    const userRole = user.user_metadata?.role || user.app_metadata?.role
    if (!allowedRoles.includes(userRole)) {
      return null
    }
  }

  return <>{children}</>
}