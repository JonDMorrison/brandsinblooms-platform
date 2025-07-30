/**
 * Enhanced useSite hook that integrates with middleware-resolved site context
 * This is the primary hook that should be used throughout the application
 */

'use client'

import { useEffect, useState } from 'react'
import { Site } from '@/src/lib/database/types'

// Import hooks from SiteContext
import {
  useSiteContext,
} from '@/src/contexts/SiteContext'

// Re-export existing hooks from SiteContext
export { 
  useSiteContext,
  useCurrentSite,
  useUserSites,
  useSitePermissions,
  useSiteSwitcher
} from '@/src/contexts/SiteContext'

// Re-export types for convenience
export type { SiteContextType } from '@/src/contexts/SiteContext'
export type { 
  Site, 
  SiteMembership, 
  SiteMembershipRole
} from '@/src/lib/database/types'

export interface UseSiteResult {
  // Current site data
  site: Site | null
  loading: boolean
  error: Error | null
  
  // Site resolution info
  resolvedFromDomain: boolean
  hostname: string | null
  isCustomDomain: boolean
  isSubdomain: boolean
  
  // Site status
  isPublished: boolean
  isActive: boolean
  
  // Utility functions
  getSiteUrl: (path?: string) => string
  refreshSite: () => Promise<void>
}

/**
 * Main hook for accessing current site data with middleware integration
 */
export function useSite(): UseSiteResult {
  const siteContext = useSiteContext()
  const [resolvedFromDomain, setResolvedFromDomain] = useState(false)
  const [hostname, setHostname] = useState<string | null>(null)

  useEffect(() => {
    // Try to get site info from middleware headers/cookies
    if (typeof window !== 'undefined') {
      const currentHostname = window.location.hostname
      setHostname(currentHostname)

      // Check if we have middleware-resolved site data in cookies
      const siteId = getCookie('x-site-id')
      const subdomain = getCookie('x-site-subdomain')
      const customDomain = getCookie('x-site-custom-domain')

      if (siteId && (subdomain || customDomain)) {
        // We have middleware-resolved site data
        setResolvedFromDomain(true)
        
        // If we don't have the site in context yet, try to resolve it
        if (!siteContext.currentSite || siteContext.currentSite.id !== siteId) {
          siteContext.resolveSiteFromUrl(window.location.href)
        }
      } else if (!siteContext.currentSite && !siteContext.loading) {
        // No middleware data and no site in context - try to resolve from URL
        siteContext.resolveSiteFromUrl(window.location.href)
      }
    }
  }, [siteContext])

  // Primary site source is the SiteContext (which may be populated by middleware)
  const site = siteContext.currentSite
  const loading = siteContext.loading
  const error = siteContext.error ? new Error(siteContext.error.message) : null

  // Site status checks
  const isPublished = site?.is_published ?? false
  const isActive = site?.is_active ?? false
  
  // Domain type detection
  const isCustomDomain = Boolean(site?.custom_domain && hostname === site.custom_domain)
  const isSubdomain = Boolean(site?.subdomain && hostname?.includes(site.subdomain))

  // Utility function to build site URLs
  const getSiteUrl = (path: string = ''): string => {
    if (!site) return ''

    const cleanPath = path.startsWith('/') ? path : `/${path}`
    
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol
      const currentHost = window.location.hostname
      const port = window.location.port
      const portSuffix = port && port !== '80' && port !== '443' ? `:${port}` : ''
      
      return `${protocol}//${currentHost}${portSuffix}${cleanPath}`
    }

    // Fallback for SSR
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    
    if (isCustomDomain && site.custom_domain) {
      return `${protocol}://${site.custom_domain}${cleanPath}`
    }
    
    if (site.subdomain) {
      const baseDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'blooms.cc'
      return `${protocol}://${site.subdomain}.${baseDomain}${cleanPath}`
    }

    return cleanPath
  }

  return {
    site,
    loading,
    error,
    resolvedFromDomain,
    hostname,
    isCustomDomain,
    isSubdomain,
    isPublished,
    isActive,
    getSiteUrl,
    refreshSite: siteContext.refreshSite,
  }
}

/**
 * Hook for accessing site metadata and SEO information
 */
export function useSiteMetadata(): {
  title: string
  description: string
  logoUrl: string | null
  primaryColor: string | null
  businessName: string | null
  businessInfo: {
    email: string | null
    phone: string | null
    address: string | null
    hours: any
  }
} {
  const { site } = useSite()

  return {
    title: site?.name || 'Site',
    description: site?.description || '',
    logoUrl: site?.logo_url || null,
    primaryColor: site?.primary_color || null,
    businessName: site?.business_name || site?.name || null,
    businessInfo: {
      email: site?.business_email || null,
      phone: site?.business_phone || null,
      address: site?.business_address || null,
      hours: site?.business_hours || null,
    },
  }
}

/**
 * Server-side function to extract site context from request headers
 * Use this in Server Components and API routes
 */
export function extractSiteFromHeaders(headers: Headers): {
  siteId: string | null
  subdomain: string | null
  customDomain: string | null
  siteName: string | null
  hostname: string | null
} {
  return {
    siteId: headers.get('x-site-id'),
    subdomain: headers.get('x-site-subdomain'),
    customDomain: headers.get('x-site-custom-domain'),
    siteName: headers.get('x-site-name'),
    hostname: headers.get('x-hostname'),
  }
}

/**
 * Development environment site switching utilities
 */
export function useDevSiteSwitcher(): {
  isDevMode: boolean
  switchToSite: (siteIdOrSubdomain: string) => void
  switchToSubdomain: (subdomain: string) => void
  getCurrentDevSite: () => string | null
} {
  const isDevMode = process.env.NODE_ENV === 'development'

  const switchToSite = (siteIdOrSubdomain: string) => {
    if (!isDevMode || typeof window === 'undefined') return

    const url = new URL(window.location.href)
    url.searchParams.set('site', siteIdOrSubdomain)
    window.location.href = url.toString()
  }

  const switchToSubdomain = (subdomain: string) => {
    if (!isDevMode || typeof window === 'undefined') return

    // For development, navigate to subdomain.localhost:3000
    const port = window.location.port
    const portSuffix = port ? `:${port}` : ''
    const url = `${window.location.protocol}//${subdomain}.localhost${portSuffix}${window.location.pathname}`
    
    window.location.href = url
  }

  const getCurrentDevSite = (): string | null => {
    if (!isDevMode || typeof window === 'undefined') return null

    const params = new URLSearchParams(window.location.search)
    return params.get('site')
  }

  return {
    isDevMode,
    switchToSite,
    switchToSubdomain,
    getCurrentDevSite,
  }
}

/**
 * Utility function to get cookie value
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift()
    return cookieValue || null
  }
  
  return null
}