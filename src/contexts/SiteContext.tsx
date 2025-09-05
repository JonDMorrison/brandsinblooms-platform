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
   * Resolves and loads a site from hostname
   */
  const resolveSiteFromUrl = useCallback(async (url: string) => {
    try {
      setLoading(true)
      setError(null)

      const hostname = extractHostname(url)
      
      // Check if this is the main app domain - if so, don't try to resolve it as a site
      const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'blooms.cc'
      const isMainDomain = hostname === appDomain || 
                          hostname.endsWith('.vercel.app') || 
                          hostname.endsWith('.railway.app') ||
                          hostname === 'localhost' ||
                          hostname === 'staging.blooms.cc'
                          
      if (isMainDomain) {
        setSiteResolution(null)
        // Don't set currentSite to null - let the URL/localStorage logic handle it
        setLoading(false)
        return
      }
      
      const resolution = resolveSiteFromHost(hostname)
      setSiteResolution(resolution)

      if (!resolution.isValid) {
        setError({
          code: 'INVALID_HOSTNAME',
          message: 'Invalid hostname format'
        })
        setCurrentSite(null)
        setUserAccess(null)
        return
      }

      // Try to get the site
      const siteResult = await getSite(resolution.value, resolution.type)
      
      if (siteResult.error) {
        setError(siteResult.error)
        setCurrentSite(null)
        setUserAccess(null)
        return
      }

      if (!siteResult.data) {
        setError({
          code: 'SITE_NOT_FOUND',
          message: `Site not found for ${resolution.type}: ${resolution.value}`
        })
        setCurrentSite(null)
        setUserAccess(null)
        return
      }

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
   * Switches to a different site
   */
  const switchSite = useCallback(async (siteId: string | null) => {
    if (siteId) {
      await loadSiteById(siteId)
    } else {
      // Clear site selection
      setCurrentSite(null)
      setUserAccess(null)
      setCanEdit(false)
      setCanManage(false)
      setSiteResolution(null)
      
      // Clear from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedSiteId')
      }
    }
  }, [loadSiteById])

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
    if (authLoading) {
      return
    }

    // If we already have initial site data, don't reload
    if (initialSiteData) {
      setLoading(false)
      return
    }

    // Priority: initialSiteId > initialHostname > current URL
    if (initialSiteId) {
      loadSiteById(initialSiteId)
    } else if (initialHostname) {
      resolveSiteFromUrl(`https://${initialHostname}`)
    } else if (typeof window !== 'undefined') {
      // Check if we're on the main app domain
      const hostname = window.location.hostname
      const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'blooms.cc'
      const isMainDomain = hostname === 'localhost' || 
                          hostname.includes(appDomain) || 
                          hostname.includes('staging') ||
                          hostname.endsWith('.vercel.app') || 
                          hostname.endsWith('.railway.app')
      
      if (!isMainDomain) {
        // Only try to resolve from URL if we're on a site-specific domain
        resolveSiteFromUrl(window.location.href)
      } else {
        // On main domain, let the URL/localStorage effect handle site selection
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [authLoading, initialSiteId, initialHostname, initialSiteData, loadSiteById, resolveSiteFromUrl])

  // Load user sites when user changes
  useEffect(() => {
    if (!authLoading && user?.id) {
      refreshUserSites()
    } else if (!user?.id) {
      setUserSites([])
      setUserAccess(null)
      setCanEdit(false)
      setCanManage(false)
    }
  }, [user?.id, authLoading, refreshUserSites])

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
        loadSiteById(storedSiteId)
        return
      }
    }
    
    // 2. Auto-select first available site
    if (userSites.length > 0) {
      const firstSiteId = userSites[0].site.id
      loadSiteById(firstSiteId)
    }
  }, [userSites, userSitesLoading, currentSite, loadSiteById])

  // Update user access when current site or user changes
  useEffect(() => {
    if (currentSite?.id && user?.id && !userAccess) {
      // Re-check access if we don't have it yet
      checkUserSiteAccess(user.id, currentSite.id).then(result => {
        if (result.data) {
          setUserAccess(result.data)
          setCanEdit(result.data.canEdit)
          setCanManage(result.data.canManage)
        }
      })
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
  return currentSite?.id || null
}