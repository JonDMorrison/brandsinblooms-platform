'use client'

import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery'
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { 
  getSiteById,
  getUserSites,
  checkUserSiteAccess,
  UserSiteAccess
} from '@/src/lib/site/queries'
import { Site } from '@/src/lib/database/aliases'

/**
 * Hook to fetch the current site based on URL parameter
 * Replaces the manual state management in SiteContext
 */
export function useCurrentSite() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const siteId = searchParams.get('site')
  
  return useSupabaseQuery<Site | null>(
    async (signal) => {
      if (!siteId || !user?.id) return null
      
      const result = await checkUserSiteAccess(user.id, siteId)
      if (result.error) throw result.error
      return result.data?.site || null
    },
    {
      enabled: !!siteId && !!user?.id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      persistKey: siteId ? `current-site-${siteId}` : undefined,
    }
  )
}

/**
 * Hook to fetch all sites the user has access to
 * Uses React Query for automatic caching and background updates
 */
export function useUserSites() {
  const { user } = useAuth()
  
  return useSupabaseQuery<UserSiteAccess[]>(
    async (signal) => {
      if (!user?.id) return []
      
      const result = await getUserSites(user.id)
      if (result.error) throw result.error
      return result.data || []
    },
    {
      enabled: !!user?.id,
      staleTime: 5 * 60 * 1000,
      persistKey: user?.id ? `user-sites-${user.id}` : undefined,
    }
  )
}

/**
 * Hook to check user access to a specific site
 */
export function useSiteAccess(siteId: string | null) {
  const { user } = useAuth()
  
  return useSupabaseQuery<UserSiteAccess | null>(
    async (signal) => {
      if (!user?.id || !siteId) return null
      
      const result = await checkUserSiteAccess(user.id, siteId)
      if (result.error) throw result.error
      return result.data
    },
    {
      enabled: !!user?.id && !!siteId,
      staleTime: 5 * 60 * 1000,
      persistKey: user?.id && siteId ? `site-access-${user.id}-${siteId}` : undefined,
    }
  )
}

/**
 * Mutation hook for switching sites
 * Handles URL updates, cache invalidation, and optimistic updates
 */
export function useSwitchSite() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  return useSupabaseMutation<UserSiteAccess | null, string | null>(
    async (siteId: string | null, signal: AbortSignal) => {
      if (!user?.id) throw new Error('User not authenticated')
      
      if (!siteId) {
        // Clear site selection
        return null
      }
      
      // Check access before switching
      const result = await checkUserSiteAccess(user.id, siteId)
      if (result.error) throw result.error
      if (!result.data) throw new Error('Access denied to this site')
      
      return result.data
    },
    {
      onSuccess: (data, siteId) => {
        // Update URL with new site parameter
        const params = new URLSearchParams(searchParams)
        
        if (siteId) {
          params.set('site', siteId)
        } else {
          params.delete('site')
        }
        
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        
        // Update localStorage for fallback
        if (siteId) {
          localStorage.setItem('selectedSiteId', siteId)
        } else {
          localStorage.removeItem('selectedSiteId')
        }
      },
      showSuccessToast: false,
      showErrorToast: true
    }
  )
}

/**
 * Combined hook that provides all site context functionality
 * This replaces the complex SiteContext logic with React Query
 */
export function useSiteContextQuery() {
  const currentSiteQuery = useCurrentSite()
  const userSitesQuery = useUserSites()
  const switchSiteMutation = useSwitchSite()
  const searchParams = useSearchParams()
  const siteId = searchParams.get('site')
  const siteAccessQuery = useSiteAccess(siteId)
  
  return {
    // Current site data
    currentSite: currentSiteQuery.data,
    isLoading: currentSiteQuery.loading,
    error: currentSiteQuery.error,
    
    // User sites data
    userSites: userSitesQuery.data || [],
    userSitesLoading: userSitesQuery.loading,
    userSitesError: userSitesQuery.error,
    
    // Site access
    userAccess: siteAccessQuery.data,
    canEdit: siteAccessQuery.data?.canEdit || false,
    canManage: siteAccessQuery.data?.canManage || false,
    
    // Actions
    switchSite: switchSiteMutation.mutate,
    isSwitching: switchSiteMutation.loading,
    switchError: switchSiteMutation.error,
    
    // Refresh functions
    refreshSite: () => currentSiteQuery.refresh(),
    refreshUserSites: () => userSitesQuery.refresh(),
  }
}