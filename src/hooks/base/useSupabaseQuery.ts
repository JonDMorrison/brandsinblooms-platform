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
          return parsed.data || initialData
        }
      } catch {
        // Ignore parse errors and clear invalid cache
        try {
          localStorage.removeItem(persistKey)
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    return initialData
  })

  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<ErrorType | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [isStale, setIsStale] = useState(false)
  const [cacheVersion, setCacheVersion] = useState(0)

  // AbortController ref for cancelling in-flight requests
  const abortRef = useRef<AbortController>()
  const intervalRef = useRef<NodeJS.Timeout>()
  const previousDepsRef = useRef<React.DependencyList | undefined>(deps)

  // Execute query function
  const execute = useCallback(async () => {
    // Cancel any previous request
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    try {
      setLoading(true)
      setError(null)

      const result = await queryFn(signal)

      // Check if request was aborted
      if (signal.aborted) return

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
        } catch (e) {
          console.error('Failed to persist data:', e)
        }
      }

      // Call success callback
      onSuccess?.(result)

    } catch (err) {
      // Don't set error if request was aborted
      if (!signal.aborted) {
        const handledError = handleError(err)
        setError(handledError)
        onError?.(handledError)
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false)
      }
    }
  }, [queryFn, persistKey, onSuccess, onError])

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

  // Listen for site switch events to invalidate cache
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleSiteSwitch = (event: CustomEvent) => {
      console.log('[QUERY_DEBUG] Received siteSwitch event, invalidating cache for:', persistKey)

      // Clear cache and reset data
      if (persistKey) {
        try {
          localStorage.removeItem(persistKey)
        } catch (error) {
          console.warn('[QUERY_DEBUG] Failed to clear cache on site switch:', error)
        }
      }

      // Increment cache version to trigger refetch
      setCacheVersion(prev => prev + 1)
      setData(initialData)
      setIsStale(true)
      setLastFetch(null)
    }

    window.addEventListener('siteSwitch', handleSiteSwitch as EventListener)
    return () => {
      window.removeEventListener('siteSwitch', handleSiteSwitch as EventListener)
    }
  }, [persistKey, initialData])

  // Detect when critical dependencies change (like siteId) and clear cache
  useEffect(() => {
    const currentDeps = deps || []
    const previousDeps = previousDepsRef.current || []

    // Check if any dependency changed (especially siteId which is usually first)
    const depsChanged = currentDeps.length !== previousDeps.length ||
                       currentDeps.some((dep, index) => dep !== previousDeps[index])

    if (depsChanged && !isFirstRenderRef.current) {
      console.log('[QUERY_DEBUG] Dependencies changed, clearing cache:', {
        persistKey,
        previousDeps,
        currentDeps
      })

      // Clear cache when dependencies change
      if (persistKey && typeof window !== 'undefined') {
        try {
          localStorage.removeItem(persistKey)
        } catch (error) {
          console.warn('[QUERY_DEBUG] Failed to clear cache on dependency change:', error)
        }
      }

      // Reset state to force refetch
      setData(initialData)
      setIsStale(true)
      setLastFetch(null)
      setCacheVersion(prev => prev + 1)
    }

    previousDepsRef.current = currentDeps
  }, deps)

  // Track if this is the first render to prevent duplicate initial fetches
  const isFirstRenderRef = useRef(true)

  // Combined fetch logic - consolidate initial fetch and dependency-based refetch
  useEffect(() => {
    if (!enabled) return

    // On first render, always fetch if no data or refetchOnMount is true
    // On subsequent renders (dependency changes or cache invalidation), always fetch
    const shouldFetch = !isFirstRenderRef.current || !data || refetchOnMount || cacheVersion > 0

    if (shouldFetch) {
      console.log('[QUERY_DEBUG] Triggering fetch:', {
        persistKey,
        isFirstRender: isFirstRenderRef.current,
        hasData: !!data,
        refetchOnMount,
        cacheVersion,
        reason: !isFirstRenderRef.current ? 'dependency-change' :
                !data ? 'no-data' :
                refetchOnMount ? 'refetch-on-mount' :
                cacheVersion > 0 ? 'cache-invalidated' : 'unknown'
      })
      execute()
    }

    // Mark that we've passed the first render
    isFirstRenderRef.current = false

    // Setup refetch interval if specified (but only once)
    if (refetchInterval && refetchInterval > 0 && !intervalRef.current) {
      intervalRef.current = setInterval(execute, refetchInterval)
    }

    // Cleanup
    return () => {
      abortRef.current?.abort()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null as any
      }
    }
  }, deps ? [enabled, cacheVersion, ...deps] : [enabled, cacheVersion])

  // Handle reconnect
  useEffect(() => {
    if (!refetchOnReconnect || !enabled) return

    const handleOnline = () => {
      if (isStale) {
        execute()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [refetchOnReconnect, enabled, isStale, execute])

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
    refresh: execute,
    cancel
  }
}