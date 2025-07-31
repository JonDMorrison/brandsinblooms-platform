'use client'

import { useCurrentSite, useSitePermissions } from '@/src/contexts/SiteContext'
import { useAuth } from '@/src/contexts/AuthContext'
import { Flower, AlertCircle, Settings, Users, Home } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/src/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

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
    <div className="min-h-screen bg-background">
      {/* Site Navigation */}
      {showNavigation && (
        <SiteNavigation 
          site={site}
          user={user}
          canEdit={canEdit}
          canManage={canManage}
          onSignOut={signOut}
        />
      )}

      {/* Main Content */}
      <main className={showNavigation ? 'pt-16' : ''}>
        {children}
      </main>

      {/* Site Footer */}
      {showNavigation && <SiteFooter site={site} />}
    </div>
  )
}

function SiteNavigation({ 
  site, 
  user, 
  canEdit, 
  canManage, 
  onSignOut 
}: {
  site: any
  user: any
  canEdit: boolean
  canManage: boolean
  onSignOut: () => void
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <nav className="brand-container">
        <div className="flex items-center justify-between h-16">
          {/* Site Branding */}
          <Link href="/" className="flex items-center space-x-3">
            {site?.logo_url ? (
              <img 
                src={site.logo_url} 
                alt={`${site.name} logo`}
                className="w-8 h-8 rounded object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded">
                <Flower className="h-4 w-4 text-white" />
              </div>
            )}
            
            <span className="font-brand-heading text-lg text-gradient-primary">
              {site?.name || 'Site'}
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            
            {user && (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                
                {canEdit && (
                  <Link 
                    href="/editor" 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Editor
                  </Link>
                )}
                
                {canManage && (
                  <Link 
                    href="/settings" 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Settings
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <UserMenu user={user} onSignOut={onSignOut} />
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="btn-gradient-primary">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

function UserMenu({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  const router = useRouter()

  const handleSignOut = async () => {
    await onSignOut()
    router.push('/')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{user.user_metadata?.full_name || user.email}</p>
            <p className="w-[200px] truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/sites" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            My Sites
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Profile Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SiteFooter({ site }: { site: any }) {
  return (
    <footer className="border-t bg-muted/50">
      <div className="brand-container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            {site?.logo_url ? (
              <img 
                src={site.logo_url} 
                alt={`${site.name} logo`}
                className="w-6 h-6 rounded object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-6 h-6 bg-gradient-primary rounded">
                <Flower className="h-3 w-3 text-white" />
              </div>
            )}
            
            <span className="text-sm text-muted-foreground">
              {site?.name || 'Site'} - Powered by Brands & Blooms
            </span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SiteLayoutLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded">
          <Flower className="h-4 w-4 text-white animate-spin" />
        </div>
        <span className="text-sm text-muted-foreground">Loading site...</span>
      </div>
    </div>
  )
}

function SiteLayoutError({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md text-center space-y-6">
        <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full mx-auto">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-brand-heading text-foreground">
            Authentication Required
          </h1>
          <p className="text-muted-foreground">
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md text-center space-y-6">
        <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full mx-auto">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-brand-heading text-foreground">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You don't have permission to access this site.
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