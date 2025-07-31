'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAdminAuth } from '@/src/contexts/AdminAuthContext'
import { InitialAdminSignup } from './InitialAdminSignup'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Skeleton } from '@/src/components/ui/skeleton'

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const {
    isAdmin,
    isLoading,
    adminExists,
    error,
    checkAdminExists,
    clearError
  } = useAdminAuth()

  // Check admin existence on mount if not already checked
  useEffect(() => {
    if (adminExists === null && !isLoading) {
      checkAdminExists()
    }
  }, [adminExists, isLoading, checkAdminExists])

  // Handle redirects for authentication
  useEffect(() => {
    // Don't redirect if still loading or if already on the right page
    if (isLoading || adminExists === null) return

    // If no admin exists and not on root admin page, redirect to admin root for signup
    if (adminExists === false && pathname !== '/admin') {
      router.push('/admin')
      return
    }

    // If admin exists but user is not authenticated and not on login page, redirect to login
    if (adminExists === true && !isAdmin && pathname !== '/admin/login') {
      router.push('/admin/login')
      return
    }

    // If user is authenticated as admin but on login page, redirect to admin dashboard
    if (isAdmin && pathname === '/admin/login') {
      router.push('/admin')
      return
    }
  }, [isAdmin, isLoading, adminExists, pathname, router])

  // Clear errors when component unmounts or admin status changes
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  // Show loading state
  if (isLoading || adminExists === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-6 w-48 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No admin exists - show initial admin signup (only on /admin root)
  if (adminExists === false && pathname === '/admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <InitialAdminSignup />
      </div>
    )
  }

  // Admin exists but user is not authenticated - show login form (only on /admin/login)
  if (adminExists === true && !isAdmin && pathname === '/admin/login') {
    return <>{children}</>
  }

  // Show loading while redirects happen
  if (
    (!isAdmin && (
      (adminExists === false && pathname !== '/admin') ||
      (adminExists === true && pathname !== '/admin/login')
    )) ||
    (isAdmin && pathname === '/admin/login') // Admin on login page (redirecting to dashboard)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Skeleton className="h-8 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is authenticated as admin - show protected content
  if (isAdmin) {
    return <>{children}</>
  }

  // Fallback content
  return (
    <>
      {fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  You do not have permission to access this area.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}