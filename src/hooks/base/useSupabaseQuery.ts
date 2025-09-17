'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { handleError } from '@/lib/types/error-handling'

export interface UseSupabaseQueryOptions<T> {
  enabled?: boolean
  initialData?: T | null
  persistKey?: string
  staleTime?: number // milliseconds
  refetchInterval?: number | false
  refetchOnMount?: boolean
  refetchOnReconnect?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: ErrorType) => void
}

export interface UseSupabaseQueryResult<T> {
  data: T | null
  loading: boolean
  error: ErrorType | null
  isStale: boolean
  lastFetch: Date | null
  refresh: () => Promise<void>
  cancel: () => void
}

export type ErrorType = ReturnType<typeof handleError>

/**
 * Generic Supabase query hook following SiteContext pattern
 * 
 * Features:
 * - AbortController for request cancellation
 * - localStorage persistence with optional persistKey
 * - Stale data management
 * - Auto-refetch options
 * - Follows established error handling patterns
 */
export function useSupabaseQuery<T>(
  queryFn: (signal: AbortSignal) => Promise<T>,
  options: UseSupabaseQueryOptions<T> = {},
  deps?: React.DependencyList // Add dependencies array to track when to refetch
): UseSupabaseQueryResult<T> {
  const {
    enabled = true,
    initialData = null,
    persistKey,
    staleTime = 10 * 60 * 1000, // Increased to 10 minutes for better performance
    refetchInterval = false,
    refetchOnMount = false, // Only refetch if no data or explicitly refreshed
    refetchOnReconnect = true,
    onSuccess,
    onError
  } = options

  // State management following SiteContext pattern
  const [data, setData] = useState<T | null>(() => {
    // Try to load from localStorage if persistKey provided
    if (persistKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(persistKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          const cachedData = parsed.data || initialData
          console.log('[CACHE_DEBUG] Initializing with cached data:', {
            persistKey,
            hasCachedData: !!cachedData,
            cacheTimestamp: parsed.timestamp,
            dataType: typeof cachedData,
            dataKeys: cachedData && typeof cachedData === 'object' ? Object.keys(cachedData) : 'n/a'
          })
          return cachedData
        }
      } catch (error) {
        console.warn('[CACHE_DEBUG] Failed to parse cached data:', { persistKey, error })
        // Ignore parse errors and clear invalid cache
        try {
          localStorage.removeItem(persistKey)
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('[CACHE_DEBUG] No cached data, using initialData:', { persistKey, hasInitialData: !!initialData })
    return initialData
  })

  // STALE-WHILE-REVALIDATE: Only show loading when no cache exists
  const [loading, setLoading] = useState(() => {
    const hasData = data !== null && data !== undefined
    const shouldShowLoading = !hasData // Only show loading skeleton when no cached data
    console.log('[LOADING_DEBUG] Initial loading state (fixed):', {
      persistKey,
      hasData,
      enabled,
      shouldShowLoading,
      dataType: typeof data,
      cacheExists: hasData ? 'yes - show immediately' : 'no - show skeleton'
    })
    return shouldShowLoading
  })

  const [error, setError] = useState<ErrorType | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [isStale, setIsStale] = useState(false)

  // AbortController ref for cancelling in-flight requests
  const abortRef = useRef<AbortController>()
  const intervalRef = useRef<NodeJS.Timeout>()

  // Execute query function with stale-while-revalidate pattern
  const execute = useCallback(async (isBackgroundRefresh = false) => {
    const hasCurrentData = data !== null && data !== undefined

    console.log('[LOADING_DEBUG] execute() called:', {
      persistKey,
      currentLoading: loading,
      hasCurrentData,
      enabled,
      isBackgroundRefresh,
      strategy: hasCurrentData ? 'background-refresh' : 'normal-fetch'
    })

    // Cancel any previous request
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    try {
      // STALE-WHILE-REVALIDATE: Only show loading for fresh fetches (no cache)
      if (!hasCurrentData && !isBackgroundRefresh) {
        console.log('[LOADING_DEBUG] Setting loading = true (fresh fetch):', { persistKey })
        setLoading(true)
      } else {
        console.log('[LOADING_DEBUG] Background refresh - keeping loading = false:', { persistKey })
      }
      setError(null)

      const result = await queryFn(signal)

      // Check if request was aborted
      if (signal.aborted) {
        console.log('[LOADING_DEBUG] Request was aborted:', { persistKey })
        return
      }

      console.log('[LOADING_DEBUG] Query completed successfully:', {
        persistKey,
        hasResult: !!result,
        resultType: typeof result
      })

      setData(result)
      setLastFetch(new Date())
      setIsStale(false)

      // Persist to localStorage if key provided
      if (persistKey && typeof window !== 'undefined') {
        try {
          const toStore = {
            data: result,
            timestamp: new Date().toISOString()
          }
          localStorage.setItem(persistKey, JSON.stringify(toStore))
          console.log('[CACHE_DEBUG] Data cached successfully:', { persistKey })
        } catch (e) {
          console.error('[CACHE_DEBUG] Failed to persist data:', { persistKey, error: e })
        }
      }

      // Call success callback
      onSuccess?.(result)

    } catch (err) {
      // Don't set error if request was aborted
      if (!signal.aborted) {
        console.log('[LOADING_DEBUG] Query failed:', { persistKey, error: err })
        const handledError = handleError(err)
        setError(handledError)
        onError?.(handledError)
      }
    } finally {
      if (!signal.aborted && !hasCurrentData && !isBackgroundRefresh) {
        console.log('[LOADING_DEBUG] Setting loading = false (fresh fetch complete):', { persistKey })
        setLoading(false)
      } else if (!signal.aborted) {
        console.log('[LOADING_DEBUG] Background refresh complete, loading state unchanged:', { persistKey })
      }
    }
  }, [queryFn, persistKey, onSuccess, onError, data])

  // Check if data is stale
  useEffect(() => {
    if (lastFetch && staleTime > 0) {
      const checkStale = () => {
        const now = new Date()
        const timeSinceLastFetch = now.getTime() - lastFetch.getTime()
        setIsStale(timeSinceLastFetch > staleTime)
      }

      const interval = setInterval(checkStale, 1000)
      return () => clearInterval(interval)
    }
  }, [lastFetch, staleTime])

  // SIMPLIFIED: Listen for site switch events to invalidate cache (only for site switching)
  useEffect(() => {
    if (typeof window === 'undefined' || !persistKey) return

    const handleSiteSwitch = (event: CustomEvent) => {
      console.log('[CACHE_DEBUG] Received siteSwitch event, clearing cache for:', persistKey)

      try {
        localStorage.removeItem(persistKey)
        // Reset to force fresh fetch on next mount/dependency change
        setData(initialData)
        setIsStale(true)
        setLastFetch(null)
      } catch (error) {
        console.warn('[CACHE_DEBUG] Failed to clear cache on site switch:', error)
      }
    }

    window.addEventListener('siteSwitch', handleSiteSwitch as EventListener)
    return () => {
      window.removeEventListener('siteSwitch', handleSiteSwitch as EventListener)
    }
  }, [persistKey, initialData])

  // Track if this is the first render to prevent duplicate initial fetches
  const isFirstRenderRef = useRef(true)

  // STALE-WHILE-REVALIDATE: Smart fetch logic based on cache state
  useEffect(() => {
    if (!enabled) {
      console.log('[LOADING_DEBUG] Query disabled, skipping fetch:', { persistKey })
      return
    }

    // Determine if we should fetch and how
    const isFirstRender = isFirstRenderRef.current
    const hasData = data !== null && data !== undefined
    const shouldFetch = isFirstRender ? (!hasData || refetchOnMount) : true // Always refetch on dependency changes
    const isBackgroundRefresh = hasData && (refetchOnMount || !isFirstRender)

    console.log('[LOADING_DEBUG] Fetch decision (stale-while-revalidate):', {
      persistKey,
      enabled,
      isFirstRender,
      hasData,
      refetchOnMount,
      shouldFetch,
      isBackgroundRefresh,
      strategy: hasData ? 'background-refresh' : 'fresh-fetch',
      deps: deps?.length || 0
    })

    if (shouldFetch) {
      execute(isBackgroundRefresh)
    }

    // Mark that we've passed the first render
    isFirstRenderRef.current = false

    // Setup refetch interval if specified (but only once) - always background refresh
    if (refetchInterval && refetchInterval > 0 && !intervalRef.current) {
      intervalRef.current = setInterval(() => execute(true), refetchInterval)
    }

    // Cleanup
    return () => {
      abortRef.current?.abort()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null as any
      }
    }
  }, deps ? [enabled, ...deps] : [enabled]) // Remove cacheVersion from dependencies

  // Handle reconnect
  useEffect(() => {
    if (!refetchOnReconnect || !enabled) return

    const handleOnline = () => {
      if (isStale) {
        const hasCurrentData = data !== null && data !== undefined
        execute(hasCurrentData) // Background refresh if we have data
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [refetchOnReconnect, enabled, isStale, execute, data])

  // Manual refresh function - always treat as background refresh if we have data
  const refresh = useCallback(() => {
    const hasCurrentData = data !== null && data !== undefined
    return execute(hasCurrentData) // Background refresh if we have data, normal fetch if not
  }, [execute, data])

  // Cancel function
  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    isStale,
    lastFetch,
    refresh,
    cancel
  }
}