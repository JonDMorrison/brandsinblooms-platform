'use client'

import { 
  createContext, 
  useContext,
  useEffect,
  ReactNode 
} from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from './AuthContext'
import { useSiteContextQuery } from '@/src/hooks/useSiteContext'
import { Site } from '@/src/lib/database/aliases'
import { UserSiteAccess, SiteQueryError } from '@/src/lib/site/queries'
import { SiteResolution } from '@/src/lib/site/resolution'

export interface SiteContextType {
  // Current site state
  currentSite: Site | null
  siteResolution: SiteResolution | null
  loading: boolean
  error: SiteQueryError | null

  // User access to current site
  userAccess: UserSiteAccess | null
  canEdit: boolean
  canManage: boolean

  // All user sites
  userSites: UserSiteAccess[]
  userSitesLoading: boolean
  userSitesError: SiteQueryError | null

  // Actions
  switchSite: (siteId: string | null) => Promise<void>
  refreshSite: () => Promise<void>
  refreshUserSites: () => Promise<void>
  resolveSiteFromUrl: (url: string) => Promise<void>
}

const SiteContext = createContext<SiteContextType | undefined>(undefined)

export interface SiteProviderProps {
  children: ReactNode
  initialSiteId?: string
  initialHostname?: string
  initialSiteData?: Site | null
}

/**
 * Refactored SiteProvider using React Query hooks
 * Significantly simplified with automatic caching and background updates
 */
export function SiteProvider({ 
  children, 
  initialSiteId,
  initialHostname,
  initialSiteData 
}: SiteProviderProps) {
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const {
    currentSite,
    isLoading,
    error,
    userSites,
    userSitesLoading,
    userSitesError,
    userAccess,
    canEdit,
    canManage,
    switchSite: switchSiteMutation,
    isSwitching,
    switchError,
    refreshSite: refetchSite,
    refreshUserSites: refetchUserSites,
  } = useSiteContextQuery()
  
  // Auto-select site on initial load if no site in URL
  useEffect(() => {
    // Skip if auth is loading or we're already loading
    if (authLoading || isLoading || userSitesLoading) return
    
    // Skip if we already have a site selected
    const urlSiteId = searchParams.get('site')
    if (urlSiteId || currentSite) return
    
    // Skip if no user or no sites available
    if (!user?.id || !userSites || userSites.length === 0) return
    
    // Priority: initialSiteId > localStorage > first available site
    let siteToSelect: string | null = null
    
    if (initialSiteId) {
      const hasAccess = userSites.some(s => s.site.id === initialSiteId)
      if (hasAccess) {
        siteToSelect = initialSiteId
      }
    }
    
    if (!siteToSelect) {
      const storedSiteId = localStorage.getItem('selectedSiteId')
      if (storedSiteId) {
        const hasAccess = userSites.some(s => s.site.id === storedSiteId)
        if (hasAccess) {
          siteToSelect = storedSiteId
        }
      }
    }
    
    if (!siteToSelect && userSites.length > 0) {
      siteToSelect = userSites[0].site.id
    }
    
    if (siteToSelect) {
      switchSiteMutation(siteToSelect)
    }
  }, [
    authLoading,
    isLoading,
    userSitesLoading,
    currentSite,
    userSites,
    user?.id,
    initialSiteId,
    switchSiteMutation,
    searchParams
  ])
  
  // Wrapper for async switchSite to match original API
  const switchSite = async (siteId: string | null): Promise<void> => {
    return new Promise((resolve, reject) => {
      switchSiteMutation(siteId, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      })
    })
  }
  
  // Wrapper for refresh functions to match original API
  const refreshSite = async (): Promise<void> => {
    await refetchSite()
  }
  
  const refreshUserSites = async (): Promise<void> => {
    await refetchUserSites()
  }
  
  // Placeholder for resolveSiteFromUrl - this functionality should be moved to a separate hook
  const resolveSiteFromUrl = async (url: string): Promise<void> => {
    console.warn('resolveSiteFromUrl is deprecated in the refactored SiteContext')
    // This functionality would be better handled by a specific mutation hook
    // that resolves domains to sites
  }
  
  // Convert errors to the expected format
  const formattedError: SiteQueryError | null = error ? {
    code: 'QUERY_ERROR',
    message: error instanceof Error ? error.message : 'An error occurred',
    details: error
  } : switchError ? {
    code: 'SWITCH_ERROR', 
    message: switchError instanceof Error ? switchError.message : 'Failed to switch site',
    details: switchError
  } : null
  
  const formattedUserSitesError: SiteQueryError | null = userSitesError ? {
    code: 'LOAD_FAILED',
    message: userSitesError instanceof Error ? userSitesError.message : 'Failed to load user sites',
    details: userSitesError
  } : null
  
  const value: SiteContextType = {
    // Current site state
    currentSite: currentSite || initialSiteData || null,
    siteResolution: null, // Domain resolution moved to separate concern
    loading: isLoading || isSwitching,
    error: formattedError,
    
    // User access
    userAccess,
    canEdit,
    canManage,
    
    // User sites
    userSites,
    userSitesLoading,
    userSitesError: formattedUserSitesError,
    
    // Actions
    switchSite,
    refreshSite,
    refreshUserSites,
    resolveSiteFromUrl,
  }

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  )
}

/**
 * Hook to use the SiteContext
 */
export function useSiteContext() {
  const context = useContext(SiteContext)
  if (context === undefined) {
    throw new Error('useSiteContext must be used within a SiteProvider')
  }
  return context
}