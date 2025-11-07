'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { handleError } from '@/lib/types/error-handling'

export interface UseInfiniteSupabaseOptions<T> {
  enabled?: boolean
  pageSize?: number
  persistKey?: string
  onSuccess?: (data: T[]) => void
  onError?: (error: ErrorType) => void
}

export interface UseInfiniteSupabaseResult<T> {
  data: T[]
  loading: boolean
  loadingMore: boolean
  error: ErrorType | null
  hasMore: boolean
  cursor: string | null
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  reset: () => void
  cancel: () => void
}

export type ErrorType = ReturnType<typeof handleError>

export interface PageData<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

/**
 * Generic Supabase infinite query hook for cursor-based pagination
 * 
 * Features:
 * - Cursor-based pagination
 * - AbortController for cancellation
 * - localStorage persistence
 * - Incremental loading states
 */
export function useInfiniteSupabase<T>(
  queryFn: (cursor: string | null, pageSize: number, signal: AbortSignal) => Promise<PageData<T>>,
  options: UseInfiniteSupabaseOptions<T> = {}
): UseInfiniteSupabaseResult<T> {
  const {
    enabled = true,
    pageSize = 20,
    persistKey,
    onSuccess,
    onError
  } = options

  // State management
  const [data, setData] = useState<T[]>(() => {
    // Try to load from localStorage if persistKey provided
    if (persistKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(persistKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          return parsed.data || []
        }
      } catch {
        // Ignore parse errors
      }
    }
    return []
  })

  // Only start with loading true if enabled
  const [loading, setLoading] = useState(enabled)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<ErrorType | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // AbortController refs
  const loadAbortRef = useRef<AbortController>()
  const loadMoreAbortRef = useRef<AbortController>()

  // Initial load
  const loadInitial = useCallback(async () => {
    // Cancel any previous requests
    loadAbortRef.current?.abort()
    loadAbortRef.current = new AbortController()
    const signal = loadAbortRef.current.signal

    try {
      setLoading(true)
      setError(null)
      setCursor(null)
      setData([])

      const result = await queryFn(null, pageSize, signal)

      // Check if request was aborted
      if (signal.aborted) return

      setData(result.items)
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)
      setIsInitialized(true)

      // Persist to localStorage if key provided
      if (persistKey && typeof window !== 'undefined') {
        try {
          const toStore = {
            data: result.items,
            cursor: result.nextCursor,
            hasMore: result.hasMore,
            timestamp: new Date().toISOString()
          }
          localStorage.setItem(persistKey, JSON.stringify(toStore))
        } catch (e) {
          console.error('Failed to persist data:', e)
        }
      }

      onSuccess?.(result.items)

    } catch (err) {
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
  }, [queryFn, pageSize, persistKey, onSuccess, onError])

  // Load more items
  const loadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return

    // Cancel any previous load more request
    loadMoreAbortRef.current?.abort()
    loadMoreAbortRef.current = new AbortController()
    const signal = loadMoreAbortRef.current.signal

    try {
      setLoadingMore(true)
      setError(null)

      const result = await queryFn(cursor, pageSize, signal)

      // Check if request was aborted
      if (signal.aborted) return

      const newData = [...data, ...result.items]
      setData(newData)
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)

      // Persist updated data
      if (persistKey && typeof window !== 'undefined') {
        try {
          const toStore = {
            data: newData,
            cursor: result.nextCursor,
            hasMore: result.hasMore,
            timestamp: new Date().toISOString()
          }
          localStorage.setItem(persistKey, JSON.stringify(toStore))
        } catch (e) {
          console.error('Failed to persist data:', e)
        }
      }

      onSuccess?.(newData)

    } catch (err) {
      if (!signal.aborted) {
        const handledError = handleError(err)
        setError(handledError)
        onError?.(handledError)
      }
    } finally {
      if (!signal.aborted) {
        setLoadingMore(false)
      }
    }
  }, [data, cursor, hasMore, loading, loadingMore, queryFn, pageSize, persistKey, onSuccess, onError])

  // Refresh (reload from beginning)
  const refresh = useCallback(async () => {
    await loadInitial()
  }, [loadInitial])

  // Reset state
  const reset = useCallback(() => {
    setData([])
    setCursor(null)
    setHasMore(true)
    setError(null)
    setLoading(false)
    setLoadingMore(false)
    setIsInitialized(false)
    
    // Clear persisted data
    if (persistKey && typeof window !== 'undefined') {
      localStorage.removeItem(persistKey)
    }
  }, [persistKey])

  // Cancel any in-flight requests
  const cancel = useCallback(() => {
    loadAbortRef.current?.abort()
    loadMoreAbortRef.current?.abort()
    setLoading(false)
    setLoadingMore(false)
  }, [])

  // Initial load effect
  useEffect(() => {
    if (enabled && !isInitialized) {
      loadInitial()
    } else if (!enabled && loading) {
      // If disabled, set loading to false
      setLoading(false)
    }

    return () => {
      loadAbortRef.current?.abort()
      loadMoreAbortRef.current?.abort()
    }
  }, [enabled]) // Intentionally not including loadInitial

  // Load from localStorage on mount if available
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined' && !isInitialized) {
      try {
        const stored = localStorage.getItem(persistKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.cursor !== undefined) {
            setCursor(parsed.cursor)
          }
          if (parsed.hasMore !== undefined) {
            setHasMore(parsed.hasMore)
          }
          setIsInitialized(true)
          setLoading(false) // Data was loaded from cache
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [persistKey]) // Run only on mount

  // Listen for order status changes to refresh list
  useEffect(() => {
    if (typeof window === 'undefined' || !persistKey) return

    const handleOrderStatusChange = (event: CustomEvent) => {
      // Trigger refresh to reload the entire list
      refresh().catch(error => {
        console.error('Failed to refresh after order status change:', error)
      })
    }

    window.addEventListener('orderStatusChanged', handleOrderStatusChange as EventListener)
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChange as EventListener)
    }
  }, [persistKey, refresh])

  return {
    data,
    loading,
    loadingMore,
    error,
    hasMore,
    cursor,
    loadMore,
    refresh,
    reset,
    cancel
  }
}