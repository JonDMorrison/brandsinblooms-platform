'use client'

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback,
  useRef, 
  ReactNode 
} from 'react'
import { useAuth } from './AuthContext'
import { 
  Site
} from '@/src/lib/database/aliases'
import { 
  getSite, 
  getUserSites,
  checkUserSiteAccess,
  UserSiteAccess,
  SiteQueryError 
} from '@/src/lib/site/queries'
import { 
  resolveSiteFromHost, 
  extractHostname,
  SiteResolution 
} from '@/src/lib/site/resolution'

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

export function SiteProvider({ 
  children, 
  initialSiteId,
  initialHostname,
  initialSiteData 
}: SiteProviderProps) {
  // Site state
  const [currentSite, setCurrentSite] = useState<Site | null>(initialSiteData || null)
  const [siteResolution, setSiteResolution] = useState<SiteResolution | null>(null)
  const [loading, setLoading] = useState(!initialSiteData)
  const [error, setError] = useState<SiteQueryError | null>(null)

  // User access state
  const [userAccess, setUserAccess] = useState<UserSiteAccess | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [canManage, setCanManage] = useState(false)

  // User sites state
  const [userSites, setUserSites] = useState<UserSiteAccess[]>([])
  const [userSitesLoading, setUserSitesLoading] = useState(false)
  const [userSitesError, setUserSitesError] = useState<SiteQueryError | null>(null)

  const { user, loading: authLoading } = useAuth()

  // AbortController refs for cancelling in-flight requests
  const siteLoadAbortRef = useRef<AbortController>()
  const userSitesAbortRef = useRef<AbortController>()

  /**
   * Comprehensive cache clearing for site-related data
   * Clears all localStorage keys related to a specific site
   */
  const clearAllSiteCaches = useCallback((siteId: string) => {
    if (typeof window === 'undefined') return

    console.log('[SITE_DEBUG] clearAllSiteCaches - Clearing caches for siteId:', siteId)

    try {
      const keys = Object.keys(localStorage)
      const siteKeys = keys.filter(key => {
        return (
          // Content-related caches
          (key.includes('content-') && key.includes(`-${siteId}-`)) ||
          // Design/theme caches
          (key.includes('design-') && key.includes(`-${siteId}-`)) ||
          (key.includes('theme-') && key.includes(`-${siteId}-`)) ||
          // Stats caches
          (key.includes('stats-') && key.includes(`-${siteId}-`)) ||
          // Product caches
          (key.includes('product-') && key.includes(`-${siteId}-`)) ||
          // Order caches
          (key.includes('order-') && key.includes(`-${siteId}-`)) ||
          // General site caches
          (key.includes('site-') && key.includes(`-${siteId}`)) ||
          // Any other cache that mentions this siteId
          key.includes(`-${siteId}-`) ||
          key.includes(`-${siteId}`)
        )
      })

      console.log('[SITE_DEBUG] clearAllSiteCaches - Found cache keys to clear:', siteKeys)

      siteKeys.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn('[SITE_DEBUG] Failed to clear cache key:', key, error)
        }
      })

      console.log('[SITE_DEBUG] clearAllSiteCaches - Cleared', siteKeys.length, 'cache keys')
    } catch (error) {
      console.error('[SITE_DEBUG] clearAllSiteCaches - Error during cache clearing:', error)
    }
  }, [])

  /**
   * Clears all caches and resets query states when switching sites
   */
  const resetAllQueries = useCallback(() => {
    if (typeof window === 'undefined') return

    console.log('[SITE_DEBUG] resetAllQueries - Dispatching cache reset event')

    // Dispatch a custom event that query hooks can listen to for cache invalidation
    window.dispatchEvent(new CustomEvent('siteSwitch', {
      detail: { timestamp: Date.now() }
    }))
  }, [])

  /**
   * Resolves and loads a site from hostname
   */
  const resolveSiteFromUrl = useCallback(async (url: string) => {
    console.log('[SITE_DEBUG] resolveSiteFromUrl - Starting resolution for URL:', url);

    try {
      setLoading(true)
      setError(null)

      const hostname = extractHostname(url)
      console.log('[SITE_DEBUG] resolveSiteFromUrl - Extracted hostname:', hostname);
      
      // Check if this is the main app domain - if so, don't try to resolve it as a site
      const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'blooms.cc'
      const isMainDomain = hostname === appDomain ||
                          hostname.endsWith('.vercel.app') ||
                          hostname.endsWith('.railway.app') ||
                          hostname === 'localhost'

      console.log('[SITE_DEBUG] resolveSiteFromUrl - Domain check:', {
        hostname,
        appDomain,
        isMainDomain,
        envDomain: process.env.NEXT_PUBLIC_APP_DOMAIN
      });

      if (isMainDomain) {
        console.log('[SITE_DEBUG] resolveSiteFromUrl - Main domain detected, skipping site resolution');
        setSiteResolution(null)
        // Don't set currentSite to null - let the URL/localStorage logic handle it
        setLoading(false)
        return
      }
      
      const resolution = resolveSiteFromHost(hostname)
      setSiteResolution(resolution)

      console.log('[SITE_DEBUG] resolveSiteFromUrl - Site resolution result:', {
        isValid: resolution.isValid,
        type: resolution.type,
        value: resolution.value
      });

      if (!resolution.isValid) {
        console.log('[SITE_DEBUG] resolveSiteFromUrl - Invalid hostname format');
        setError({
          code: 'INVALID_HOSTNAME',
          message: 'Invalid hostname format'
        })
        setCurrentSite(null)
        setUserAccess(null)
        return
      }

      // Try to get the site
      console.log('[SITE_DEBUG] resolveSiteFromUrl - Querying site with:', {
        value: resolution.value,
        type: resolution.type
      });
      const siteResult = await getSite(resolution.value, resolution.type)

      console.log('[SITE_DEBUG] resolveSiteFromUrl - Site query result:', {
        hasData: !!siteResult.data,
        hasError: !!siteResult.error,
        error: siteResult.error,
        siteId: siteResult.data?.id,
        siteName: siteResult.data?.name
      });

      if (siteResult.error) {
        console.log('[SITE_DEBUG] resolveSiteFromUrl - Site query error:', siteResult.error);
        setError(siteResult.error)
        setCurrentSite(null)
        setUserAccess(null)
        return
      }

      if (!siteResult.data) {
        console.log('[SITE_DEBUG] resolveSiteFromUrl - Site not found');
        setError({
          code: 'SITE_NOT_FOUND',
          message: `Site not found for ${resolution.type}: ${resolution.value}`
        })
        setCurrentSite(null)
        setUserAccess(null)
        return
      }

      console.log('[SITE_DEBUG] resolveSiteFromUrl - Setting current site:', {
        id: siteResult.data.id,
        name: siteResult.data.name,
        subdomain: siteResult.data.subdomain
      });
      setCurrentSite(siteResult.data)

      // If user is authenticated, check their access to this site
      if (user?.id) {
        const accessResult = await checkUserSiteAccess(user.id, siteResult.data.id)
        
        if (accessResult.data) {
          setUserAccess(accessResult.data)
          setCanEdit(accessResult.data.canEdit)
          setCanManage(accessResult.data.canManage)
        } else {
          // User has no access to this site
          setUserAccess(null)
          setCanEdit(false)
          setCanManage(false)
        }
      }

    } catch (err) {
      setError({
        code: 'RESOLVE_FAILED',
        message: 'Failed to resolve site from URL',
        details: err
      })
      setCurrentSite(null)
      setUserAccess(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  /**
   * Loads a site by ID and sets it as current
   */
  const loadSiteById = useCallback(async (siteId: string) => {
    // Cancel any previous load operation
    siteLoadAbortRef.current?.abort()
    siteLoadAbortRef.current = new AbortController()
    const abortSignal = siteLoadAbortRef.current.signal
    
    try {
      setLoading(true)
      setError(null)

      // Check if user has access to this site
      if (!user?.id) {
        setError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        })
        return
      }

      const accessResult = await checkUserSiteAccess(user.id, siteId)
      
      // Check if request was aborted
      if (abortSignal.aborted) return
      
      if (accessResult.error) {
        if (!abortSignal.aborted) {
          setError(accessResult.error)
          setCurrentSite(null)
          setUserAccess(null)
        }
        return
      }

      if (!accessResult.data) {
        if (!abortSignal.aborted) {
          setError({
            code: 'ACCESS_DENIED',
            message: 'User does not have access to this site'
          })
          setCurrentSite(null)
          setUserAccess(null)
        }
        return
      }

      // Final check before updating state
      if (abortSignal.aborted) return

      setCurrentSite(accessResult.data.site)
      setUserAccess(accessResult.data)
      setCanEdit(accessResult.data.canEdit)
      setCanManage(accessResult.data.canManage)

      // Clear site resolution since we're loading by ID
      setSiteResolution(null)
      
      // Save to localStorage when site is successfully loaded
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedSiteId', siteId)
      }

    } catch (err) {
      setError({
        code: 'LOAD_FAILED',
        message: 'Failed to load site',
        details: err
      })
      setCurrentSite(null)
      setUserAccess(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  /**
   * Loads all sites the user has access to
   */
  const refreshUserSites = useCallback(async () => {
    if (!user?.id) {
      setUserSites([])
      return
    }

    // Cancel any previous user sites load operation
    userSitesAbortRef.current?.abort()
    userSitesAbortRef.current = new AbortController()
    const abortSignal = userSitesAbortRef.current.signal

    try {
      setUserSitesLoading(true)
      setUserSitesError(null)

      const result = await getUserSites(user.id)
      
      // Check if request was aborted
      if (abortSignal.aborted) return
      
      if (result.error) {
        if (!abortSignal.aborted) {
          setUserSitesError(result.error)
          setUserSites([])
        }
        return
      }

      // Final check before updating state
      if (!abortSignal.aborted) {
        setUserSites(result.data || [])
      }
    } catch (err) {
      setUserSitesError({
        code: 'LOAD_FAILED',
        message: 'Failed to load user sites',
        details: err
      })
      setUserSites([])
    } finally {
      setUserSitesLoading(false)
    }
  }, [user?.id])

  /**
   * Switches to a different site with comprehensive cache clearing
   */
  const switchSite = useCallback(async (siteId: string | null) => {
    console.log('[SITE_DEBUG] switchSite - Starting site switch:', {
      fromSiteId: currentSite?.id,
      toSiteId: siteId,
      timestamp: Date.now()
    })

    try {
      // Cancel any ongoing requests
      siteLoadAbortRef.current?.abort()
      userSitesAbortRef.current?.abort()

      // Set loading state immediately
      setLoading(true)
      setError(null)

      // Clear caches for the current site before switching
      if (currentSite?.id && currentSite.id !== siteId) {
        console.log('[SITE_DEBUG] switchSite - Clearing caches for previous site:', currentSite.id)
        clearAllSiteCaches(currentSite.id)
      }

      // Reset all query states by dispatching siteSwitch event
      resetAllQueries()

      if (siteId) {
        // Clear any caches for the target site too (in case of stale data)
        clearAllSiteCaches(siteId)

        console.log('[SITE_DEBUG] switchSite - Loading new site:', siteId)
        await loadSiteById(siteId)
      } else {
        // Clear site selection completely
        console.log('[SITE_DEBUG] switchSite - Clearing site selection')

        setCurrentSite(null)
        setUserAccess(null)
        setCanEdit(false)
        setCanManage(false)
        setSiteResolution(null)

        // Clear from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('selectedSiteId')
        }

        setLoading(false)
      }

      console.log('[SITE_DEBUG] switchSite - Site switch completed successfully')
    } catch (error) {
      console.error('[SITE_DEBUG] switchSite - Error during site switch:', error)
      setError({
        code: 'SWITCH_FAILED',
        message: 'Failed to switch sites',
        details: error
      })
      setLoading(false)
    }
  }, [currentSite?.id, clearAllSiteCaches, resetAllQueries, loadSiteById])

  /**
   * Refreshes the current site data
   */
  const refreshSite = useCallback(async () => {
    if (currentSite?.id) {
      await loadSiteById(currentSite.id)
    } else if (siteResolution && typeof window !== 'undefined') {
      await resolveSiteFromUrl(window.location.href)
    }
  }, [currentSite?.id, siteResolution, loadSiteById, resolveSiteFromUrl])

  // Initialize site resolution on mount
  useEffect(() => {
    console.log('[SITE_DEBUG] SiteProvider - Initial effect triggered:', {
      authLoading,
      hasInitialSiteData: !!initialSiteData,
      initialSiteId,
      initialHostname,
      windowAvailable: typeof window !== 'undefined'
    });

    if (authLoading) {
      console.log('[SITE_DEBUG] SiteProvider - Auth still loading, waiting');
      return
    }

    // If we already have initial site data, don't reload
    if (initialSiteData) {
      console.log('[SITE_DEBUG] SiteProvider - Using initial site data:', {
        id: initialSiteData.id,
        name: initialSiteData.name,
        subdomain: initialSiteData.subdomain
      });
      setLoading(false)
      return
    }

    // Priority: initialSiteId > initialHostname > current URL
    if (initialSiteId) {
      console.log('[SITE_DEBUG] SiteProvider - Loading by initial siteId:', initialSiteId);
      setTimeout(() => {
        loadSiteById(initialSiteId)
      }, 0)
    } else if (initialHostname) {
      console.log('[SITE_DEBUG] SiteProvider - Resolving by initial hostname:', initialHostname);
      setTimeout(() => {
        resolveSiteFromUrl(`https://${initialHostname}`)
      }, 0)
    } else if (typeof window !== 'undefined') {
      // Check if we're on the main app domain
      const hostname = window.location.hostname
      const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'blooms.cc'
      const isMainDomain = hostname === 'localhost' ||
                          hostname === appDomain ||
                          hostname.includes('staging') ||
                          hostname.endsWith('.vercel.app') ||
                          hostname.endsWith('.railway.app')

      console.log('[SITE_DEBUG] SiteProvider - Browser environment detected:', {
        hostname,
        appDomain,
        isMainDomain,
        currentUrl: window.location.href
      });

      if (!isMainDomain) {
        // Only try to resolve from URL if we're on a site-specific domain
        console.log('[SITE_DEBUG] SiteProvider - Site-specific domain detected, resolving from URL');
        setTimeout(() => {
          resolveSiteFromUrl(window.location.href)
        }, 0)
      } else {
        // On main domain, let the URL/localStorage effect handle site selection
        console.log('[SITE_DEBUG] SiteProvider - Main domain detected, skipping URL resolution');
        setLoading(false)
      }
    } else {
      console.log('[SITE_DEBUG] SiteProvider - Server-side, setting loading false');
      setLoading(false)
    }
  }, [authLoading, initialSiteId, initialHostname, initialSiteData]) // Remove function dependencies to prevent infinite loops

  // Load user sites when user changes
  useEffect(() => {
    if (!authLoading && user?.id) {
      setTimeout(() => {
        refreshUserSites()
      }, 0)
    } else if (!user?.id) {
      setUserSites([])
      setUserAccess(null)
      setCanEdit(false)
      setCanManage(false)
    }
  }, [user?.id, authLoading]) // Remove function dependencies to prevent infinite loops

  // Auto-select site based on localStorage or first available
  useEffect(() => {
    // Only run on main app domain where we need site selection
    if (typeof window === 'undefined') return
    
    const hostname = window.location.hostname
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'blooms.cc'
    
    // Skip if we're on a site-specific domain
    if (!hostname.includes(appDomain) && !hostname.includes('localhost') && !hostname.includes('staging')) {
      return
    }
    
    // Skip if user sites are still loading
    if (userSitesLoading) {
      return
    }
    
    // If no sites available after loading, that's OK - user might not have any sites
    if (userSites.length === 0) {
      return
    }
    
    // Skip auto-select if we already have a current site
    if (currentSite) {
      return
    }
    
    // 1. Check localStorage first
    const storedSiteId = localStorage.getItem('selectedSiteId')
    if (storedSiteId) {
      const storedSite = userSites.find(s => s.site.id === storedSiteId)
      if (storedSite) {
        setTimeout(() => {
          loadSiteById(storedSiteId)
        }, 0)
        return
      }
    }
    
    // 2. Auto-select first available site
    if (userSites.length > 0) {
      const firstSiteId = userSites[0].site.id
      setTimeout(() => {
        loadSiteById(firstSiteId)
      }, 0)
    }
  }, [userSites, userSitesLoading, currentSite]) // Remove function dependencies to prevent infinite loops

  // Update user access when current site or user changes
  useEffect(() => {
    if (currentSite?.id && user?.id && !userAccess) {
      // Re-check access if we don't have it yet
      setTimeout(() => {
        checkUserSiteAccess(user.id, currentSite.id).then(result => {
          if (result.data) {
            setUserAccess(result.data)
            setCanEdit(result.data.canEdit)
            setCanManage(result.data.canManage)
          }
        })
      }, 0)
    }
  }, [currentSite?.id, user?.id, userAccess])

  // Cleanup on unmount - cancel any pending requests
  useEffect(() => {
    return () => {
      siteLoadAbortRef.current?.abort()
      userSitesAbortRef.current?.abort()
    }
  }, [])

  const value: SiteContextType = {
    // Current site state
    currentSite,
    siteResolution,
    loading,
    error,

    // User access
    userAccess,
    canEdit,
    canManage,

    // User sites
    userSites,
    userSitesLoading,
    userSitesError,

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
 * Hook to access site context
 */
export const useSiteContext = () => {
  const context = useContext(SiteContext)
  if (context === undefined) {
    throw new Error('useSiteContext must be used within a SiteProvider')
  }
  return context
}

/**
 * Hook to access current site with loading state
 */
export const useCurrentSite = () => {
  const { currentSite, loading, error, userSitesLoading } = useSiteContext()
  
  // For main domain (localhost, staging, etc.), consider loaded when:
  // - Not loading AND
  // - Either have a current site OR user sites have finished loading
  const isMainDomain = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('staging') ||
    window.location.hostname.includes('.vercel.app') ||
    window.location.hostname.includes('.railway.app')
  )
  
  const isLoaded = !loading && !error && (
    currentSite !== null || 
    (isMainDomain && !userSitesLoading)
  )
  
  return { 
    site: currentSite, 
    loading, 
    error,
    isLoaded
  }
}

/**
 * Hook to access user's sites
 */
export const useUserSites = () => {
  const { 
    userSites, 
    userSitesLoading, 
    userSitesError, 
    refreshUserSites 
  } = useSiteContext()
  
  return { 
    sites: userSites, 
    loading: userSitesLoading, 
    error: userSitesError,
    refresh: refreshUserSites
  }
}

/**
 * Hook to access user permissions for current site
 */
export const useSitePermissions = () => {
  const { userAccess, canEdit, canManage } = useSiteContext()
  
  return {
    access: userAccess,
    canEdit,
    canManage,
    role: userAccess?.role || null,
    hasAccess: userAccess !== null
  }
}

/**
 * Hook for site switching functionality
 */
export const useSiteSwitcher = () => {
  const { switchSite, userSites, currentSite } = useSiteContext()
  
  return {
    switchSite,
    availableSites: userSites,
    currentSiteId: currentSite?.id || null
  }
}

/**
 * Hook to get just the current site ID
 */
export const useSiteId = () => {
  const { currentSite } = useSiteContext()
  const siteId = currentSite?.id || null

  console.log('[SITE_DEBUG] useSiteId - Returning siteId:', {
    siteId,
    siteName: currentSite?.name,
    hasCurrentSite: !!currentSite
  });

  return siteId
}