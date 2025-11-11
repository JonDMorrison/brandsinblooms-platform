'use client'

import { useCurrentSite } from '@/src/contexts/SiteContext'
import { useAuth } from '@/src/contexts/AuthContext'
import { Flower, AlertCircle } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import Link from 'next/link'
import { SiteThemeProvider, ThemeWrapper } from '@/src/components/theme/ThemeProvider'
import { SiteLayout } from '@/src/components/layout/SiteLayout'
import { ProductCatalog } from '@/src/components/site/ProductCatalog'

interface SiteHomepageProps {
  fallbackContent?: React.ReactNode
}

export function SiteHomepage({ fallbackContent }: SiteHomepageProps) {
  const { site, loading, error, isLoaded } = useCurrentSite()
  const { user, loading: authLoading } = useAuth()

  // Check if we're on the main app domain (needs to happen before loading check)
  // During SSR (window undefined), assume we might be on main domain if we have fallback
  const isMainDomain = typeof window !== 'undefined' ? (
    window.location.hostname === 'localhost' ||
    (window.location.hostname.includes('staging') && !window.location.hostname.includes('.')) ||
    window.location.hostname.includes('.railway.app') ||
    window.location.hostname === process.env.NEXT_PUBLIC_APP_DOMAIN
  ) : true // During SSR, assume main domain if we have fallback content

  // On main domain with fallback content, show fallback immediately without waiting for site loading
  // This ensures the platform landing page loads instantly on localhost
  // During SSR, if fallback exists, show it to avoid loading spinner flash
  if (isMainDomain && fallbackContent) {
    return <>{fallbackContent}</>
  }

  // Show loading state for site domains or when no fallback is available
  if (loading || authLoading) {
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

  // If user is authenticated and this is their site
  if (user && site) {
    // On site-specific domains, show the authenticated site view
    return <AuthenticatedSiteView site={site} user={user} />
  }

  // Show site homepage for unauthenticated users or public view
  return (
    <SiteLayout>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
            <div className="brand-container">
              <div className="text-center space-y-8">
                {/* Welcome Message */}
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-6xl font-brand-heading">
                    Welcome to {site?.name || 'Our Store'}
                  </h1>
                  
                  {site?.description && (
                    <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto">
                      {site.description}
                    </p>
                  )}
                </div>

                {/* Call to Action */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/products">
                    <Button size="lg" className="btn-theme-primary min-w-[160px]">
                      Shop Now
                    </Button>
                  </Link>
                  
                  <Link href="/about">
                    <Button variant="outline" size="lg" className="min-w-[160px]">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
          
          {/* Featured Products Section */}
          <section className="py-16">
            <div className="brand-container">
              <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
              <ProductCatalog featured={true} limit={8} />
            </div>
          </section>
          
          {/* Categories Section */}
          <section className="py-16 bg-muted/20">
            <div className="brand-container">
              <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Category cards would go here */}
                <div className="text-center p-6 rounded-lg border bg-white hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold">Flowers</h3>
                </div>
                <div className="text-center p-6 rounded-lg border bg-white hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold">Plants</h3>
                </div>
                <div className="text-center p-6 rounded-lg border bg-white hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold">Gifts</h3>
                </div>
                <div className="text-center p-6 rounded-lg border bg-white hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold">Occasions</h3>
                </div>
              </div>
            </div>
          </section>
    </SiteLayout>
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
    <SiteThemeProvider applyToDocument={false}>
      <ThemeWrapper className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="brand-container">
          <div className="text-center space-y-6">
            <SiteBranding site={site} />
            
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-brand-heading">
                Welcome back to {site.name}!
              </h1>
              
              <p className="text-lg text-gray-500">
                Hello {user.email}, ready to continue?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="btn-theme-primary min-w-[160px]">
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
      </ThemeWrapper>
    </SiteThemeProvider>
  )
}


function SiteHomepageLoading() {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="flex items-center justify-center">
        <div className="flex items-center justify-center w-10 h-10 bg-transparent rounded-lg">
          <Flower className="h-6 w-6 animate-spin" style={{color: 'var(--theme-primary, #10b981)'}} />
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
          <AlertCircle className="h-8 w-8 text-gray-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-brand-heading text-gray-900">
            Site Not Found
          </h1>
          <p className="text-gray-500">
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