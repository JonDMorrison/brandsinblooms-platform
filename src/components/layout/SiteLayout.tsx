'use client'

import { useCurrentSite, useSitePermissions } from '@/src/contexts/SiteContext'
import { useAuth } from '@/src/contexts/AuthContext'
import { CartProvider } from '@/src/contexts/CartContext'
import { SiteNavigation } from '@/src/components/site/SiteNavigation'
import { SiteFooter } from '@/src/components/site/SiteFooter'
import { MobileNavigation } from '@/src/components/site/MobileNavigation'
import { SiteThemeProvider, ThemeWrapper } from '@/src/components/theme/ThemeProvider'
import { useThemeCSS } from '@/src/hooks/useThemeCSS'
import { Flower, AlertCircle } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import Link from 'next/link'

interface SiteLayoutProps {
  children: React.ReactNode
  showNavigation?: boolean
  requireAuth?: boolean
  requireSiteAccess?: boolean
}

export function SiteLayout({ 
  children, 
  showNavigation = true,
  requireAuth = false,
  requireSiteAccess = false 
}: SiteLayoutProps) {
  const { site, loading, error } = useCurrentSite()
  const { user, loading: authLoading, signOut } = useAuth()
  const { hasAccess, canEdit, canManage } = useSitePermissions()

  // Show loading state
  if (loading || authLoading) {
    return <SiteLayoutLoading />
  }

  // Handle authentication requirements
  if (requireAuth && !user) {
    return <AuthenticationRequired />
  }

  // Handle site access requirements
  if (requireSiteAccess && !hasAccess) {
    return <SiteAccessRequired />
  }

  // Show error state
  if (error) {
    return <SiteLayoutError error={error.message} />
  }

  return (
    <SiteThemeProvider applyToDocument={true}>
      <CartProvider>
        <ThemeWrapper className="min-h-screen flex flex-col">
          {/* Site Navigation */}
          {showNavigation && <SiteNavigation />}

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Mobile Navigation - Bottom Bar */}
          {showNavigation && <MobileNavigation />}

          {/* Site Footer */}
          {showNavigation && <SiteFooter />}
        </ThemeWrapper>
      </CartProvider>
    </SiteThemeProvider>
  )
}

function SiteLayoutLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded">
          <Flower className="h-4 w-4 text-white animate-spin" />
        </div>
        <span className="text-sm text-gray-500">Loading site...</span>
      </div>
    </div>
  )
}

function SiteLayoutError({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md text-center space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Site error: {error}
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          Reload Site
        </Button>
      </div>
    </div>
  )
}

function AuthenticationRequired() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md text-center space-y-6">
        <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full mx-auto">
          <AlertCircle className="h-8 w-8 text-gray-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-brand-heading text-gray-900">
            Authentication Required
          </h1>
          <p className="text-gray-500">
            You need to sign in to access this page.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button className="btn-gradient-primary">
              Sign In
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="outline">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function SiteAccessRequired() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md text-center space-y-6">
        <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full mx-auto">
          <AlertCircle className="h-8 w-8 text-gray-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-brand-heading text-gray-900">
            Access Denied
          </h1>
          <p className="text-gray-500">
            You don&apos;t have permission to access this site.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sites">
            <Button className="btn-gradient-primary">
              My Sites
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="outline">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SiteLayout