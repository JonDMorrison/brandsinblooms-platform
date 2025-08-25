'use client'

import { useCurrentSite } from '@/src/contexts/SiteContext'
import { useAuth } from '@/src/contexts/AuthContext'
import { Flower, AlertCircle } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import Link from 'next/link'

interface SiteHomepageProps {
  fallbackContent?: React.ReactNode
}

export function SiteHomepage({ fallbackContent }: SiteHomepageProps) {
  const { site, loading, error, isLoaded } = useCurrentSite()
  const { user, loading: authLoading } = useAuth()

  // Debug logging
  console.log('[SiteHomepage] Render state:', {
    site: site?.id || 'null',
    siteName: site?.name || 'null',
    loading,
    authLoading,
    error,
    isLoaded,
    user: user?.email || 'null',
    hasFallback: !!fallbackContent,
    timestamp: new Date().toISOString()
  })

  // Show loading state
  if (loading || authLoading) {
    console.log('[SiteHomepage] Showing loading because:', {
      siteLoading: loading,
      authLoading: authLoading
    })
    return <SiteHomepageLoading />
  }

  // Show error state
  if (error) {
    return <SiteHomepageError error={error.message} />
  }

  // Show site not found if no site and no fallback
  if (!site && !fallbackContent) {
    return <SiteNotFound />
  }

  // If no site but we have fallback content, show that
  if (!site && fallbackContent) {
    return <>{fallbackContent}</>
  }

  // If user is authenticated and this is their site, redirect to dashboard
  if (user && site) {
    return <AuthenticatedSiteView site={site} user={user} />
  }

  // Show site homepage for unauthenticated users or public view
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Site Header */}
      <header className="relative z-10">
        <nav className="brand-container py-6">
          <div className="flex items-center justify-between">
            <SiteBranding site={site} />
            
            {/* Authentication Links */}
            <div className="flex items-center space-x-4">
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
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="brand-container">
          <div className="text-center space-y-8">
            {/* Welcome Message */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-brand-heading text-gradient-primary">
                Welcome to {site?.name || 'Our Site'}
              </h1>
              
              {site?.description && (
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  {site.description}
                </p>
              )}
            </div>

            {/* Call to Action */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="btn-gradient-primary min-w-[160px]">
                  Get Started
                </Button>
              </Link>
              
              <Link href="/about">
                <Button variant="outline" size="lg" className="min-w-[160px]">
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Future: Site Features can be added here when settings are implemented */}
          </div>
        </div>
      </main>

      {/* Fallback content if provided */}
      {fallbackContent && (
        <section className="py-12 border-t">
          <div className="brand-container">
            {fallbackContent}
          </div>
        </section>
      )}
    </div>
  )
}

function SiteBranding({ site }: { site: any }) {
  return (
    <div className="flex items-center space-x-3">
      {site?.logo_url ? (
        <img 
          src={site.logo_url} 
          alt={`${site.name} logo`}
          className="w-10 h-10 rounded-lg object-cover"
        />
      ) : (
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg">
          <Flower className="h-6 w-6 text-white" />
        </div>
      )}
      
      <div>
        <h1 className="text-xl font-brand-heading text-gradient-primary">
          {site?.name || 'Brands & Blooms'}
        </h1>
      </div>
    </div>
  )
}

function AuthenticatedSiteView({ site, user }: { site: any; user: any }) {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="brand-container">
        <div className="text-center space-y-6">
          <SiteBranding site={site} />
          
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-brand-heading text-gradient-primary">
              Welcome back to {site.name}!
            </h1>
            
            <p className="text-lg text-muted-foreground">
              Hello {user.email}, ready to continue?
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="btn-gradient-primary min-w-[160px]">
                Go to Dashboard
              </Button>
            </Link>
            
            {/* Temporarily hidden - My Sites page not ready yet
            <Link href="/sites">
              <Button variant="outline" size="lg" className="min-w-[160px]">
                My Sites
              </Button>
            </Link> */}
          </div>
        </div>
      </div>
    </div>
  )
}


function SiteHomepageLoading() {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg">
          <Flower className="h-6 w-6 text-white animate-spin" />
        </div>
        <div>
          <h1 className="text-xl font-brand-heading text-gradient-primary">
            Loading...
          </h1>
        </div>
      </div>
    </div>
  )
}

function SiteHomepageError({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="brand-container max-w-md">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load site: {error}
          </AlertDescription>
        </Alert>
        
        <div className="mt-6 text-center">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}

function SiteNotFound() {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="brand-container max-w-md text-center space-y-6">
        <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full mx-auto">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-brand-heading text-foreground">
            Site Not Found
          </h1>
          <p className="text-muted-foreground">
            The site you&apos;re looking for doesn&apos;t exist or isn&apos;t available.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="btn-gradient-primary">
              Go Home
            </Button>
          </Link>
          
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SiteHomepage