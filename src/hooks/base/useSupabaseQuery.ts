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
        // Ignore parse errors
      }
    }
    return initialData
  })

  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<ErrorType | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [isStale, setIsStale] = useState(false)

  // AbortController ref for cancelling in-flight requests
  const abortRef = useRef<AbortController>()
  const intervalRef = useRef<NodeJS.Timeout>()

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

  // Initial fetch and refetch logic
  useEffect(() => {
    if (!enabled) return

    // Initial fetch
    if (refetchOnMount || !data) {
      execute()
    }

    // Setup refetch interval if specified
    if (refetchInterval && refetchInterval > 0) {
      intervalRef.current = setInterval(execute, refetchInterval)
    }

    // Cleanup
    return () => {
      abortRef.current?.abort()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, refetchOnMount, refetchInterval]) // Intentionally not including execute or queryFn

  // Re-fetch when dependencies change (like siteId)
  useEffect(() => {
    if (!enabled) return
    execute()
  }, deps ? [enabled, ...deps] : [enabled]) // Only re-run if deps provided and changed

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