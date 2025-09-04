'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { queryKeys } from '@/src/lib/queries/keys'
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
  
  return useQuery({
    queryKey: queryKeys.sites.detail(siteId || 'none'),
    queryFn: async () => {
      if (!siteId || !user?.id) return null
      
      const result = await checkUserSiteAccess(user.id, siteId)
      if (result.error) throw result.error
      return result.data?.site || null
    },
    enabled: !!siteId && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch all sites the user has access to
 * Uses React Query for automatic caching and background updates
 */
export function useUserSites() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: queryKeys.sites.userSites(user?.id || 'none'),
    queryFn: async () => {
      if (!user?.id) return []
      
      const result = await getUserSites(user.id)
      if (result.error) throw result.error
      return result.data || []
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook to check user access to a specific site
 */
export function useSiteAccess(siteId: string | null) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: queryKeys.sites.access(user?.id || 'none', siteId || 'none'),
    queryFn: async () => {
      if (!user?.id || !siteId) return null
      
      const result = await checkUserSiteAccess(user.id, siteId)
      if (result.error) throw result.error
      return result.data
    },
    enabled: !!user?.id && !!siteId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Mutation hook for switching sites
 * Handles URL updates, cache invalidation, and optimistic updates
 */
export function useSwitchSite() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async (siteId: string | null) => {
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
    
    onMutate: async (siteId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.sites.all()
      })
      
      // Save previous data for rollback
      const previousSite = queryClient.getQueryData(
        queryKeys.sites.detail(searchParams.get('site') || 'none')
      )
      
      // Optimistically update the current site
      if (siteId) {
        const userSites = queryClient.getQueryData<UserSiteAccess[]>(
          queryKeys.sites.userSites(user?.id || 'none')
        )
        
        const newSite = userSites?.find(s => s.site.id === siteId)
        if (newSite) {
          queryClient.setQueryData(
            queryKeys.sites.detail(siteId),
            newSite.site
          )
        }
      } else {
        // Clear current site
        const oldSiteId = searchParams.get('site')
        if (oldSiteId) {
          queryClient.setQueryData(
            queryKeys.sites.detail(oldSiteId),
            null
          )
        }
      }
      
      return { previousSite }
    },
    
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
      
      // Invalidate all site-scoped queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.content.all(siteId || '') 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.all(siteId || '') 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categories.all(siteId || '') 
      })
      
      // Invalidate design settings and other site-specific queries
      if (siteId) {
        queryClient.invalidateQueries({ 
          queryKey: ['site', siteId] 
        })
      }
      
      // Also invalidate the old site's queries if switching away
      const previousSiteId = searchParams.get('site')
      if (previousSiteId && previousSiteId !== siteId) {
        queryClient.invalidateQueries({ 
          queryKey: ['site', previousSiteId] 
        })
      }
    },
    
    onError: (error, siteId, context) => {
      // Rollback on error
      if (context?.previousSite) {
        const oldSiteId = searchParams.get('site')
        if (oldSiteId) {
          queryClient.setQueryData(
            queryKeys.sites.detail(oldSiteId),
            context.previousSite
          )
        }
      }
      
      console.error('Failed to switch site:', error)
    },
    
    onSettled: () => {
      // Always refetch site data after mutation
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.sites.all() 
      })
    }
  })
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
    isLoading: currentSiteQuery.isLoading,
    error: currentSiteQuery.error,
    
    // User sites data
    userSites: userSitesQuery.data || [],
    userSitesLoading: userSitesQuery.isLoading,
    userSitesError: userSitesQuery.error,
    
    // Site access
    userAccess: siteAccessQuery.data,
    canEdit: siteAccessQuery.data?.canEdit || false,
    canManage: siteAccessQuery.data?.canManage || false,
    
    // Actions
    switchSite: switchSiteMutation.mutate,
    isSwitching: switchSiteMutation.isPending,
    switchError: switchSiteMutation.error,
    
    // Refresh functions
    refreshSite: () => currentSiteQuery.refetch(),
    refreshUserSites: () => userSitesQuery.refetch(),
  }
}