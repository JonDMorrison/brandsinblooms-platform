'use client'

import { useState, useCallback, useRef } from 'react'
import { handleError } from '@/lib/types/error-handling'
import { toast } from 'sonner'

export interface UseSupabaseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>
  onError?: (error: ErrorType, variables: TVariables) => void
  onSettled?: (data: TData | undefined, error: ErrorType | null, variables: TVariables) => void
  showSuccessToast?: boolean | string
  showErrorToast?: boolean
  optimisticUpdate?: (variables: TVariables) => void
  rollbackOnError?: () => void
}

export interface UseSupabaseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | undefined>
  mutateAsync: (variables: TVariables) => Promise<TData>
  data: TData | null
  loading: boolean
  error: ErrorType | null
  reset: () => void
  cancel: () => void
}

export type ErrorType = ReturnType<typeof handleError>

/**
 * Generic Supabase mutation hook following established patterns
 * 
 * Features:
 * - Optimistic updates with rollback
 * - AbortController for cancellation
 * - Toast notifications
 * - Follows error handling patterns
 */
export function useSupabaseMutation<TData = unknown, TVariables = void>(
  mutationFn: (variables: TVariables, signal: AbortSignal) => Promise<TData>,
  options: UseSupabaseMutationOptions<TData, TVariables> = {}
): UseSupabaseMutationResult<TData, TVariables> {
  const {
    onSuccess,
    onError,
    onSettled,
    showSuccessToast = false,
    showErrorToast = true,
    optimisticUpdate,
    rollbackOnError
  } = options

  const [data, setData] = useState<TData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorType | null>(null)

  // AbortController ref for cancelling in-flight requests
  const abortRef = useRef<AbortController>()

  // Core mutation execution
  const executeMutation = useCallback(async (variables: TVariables): Promise<TData | undefined> => {
    // Cancel any previous request
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    try {
      setLoading(true)
      setError(null)

      // Apply optimistic update if provided
      optimisticUpdate?.(variables)

      const result = await mutationFn(variables, signal)

      // Check if request was aborted
      if (signal.aborted) return undefined

      setData(result)

      // Success toast
      if (showSuccessToast) {
        const message = typeof showSuccessToast === 'string' 
          ? showSuccessToast 
          : 'Operation completed successfully'
        toast.success(message)
      }

      // Success callback
      await onSuccess?.(result, variables)

      // Settled callback
      onSettled?.(result, null, variables)

      return result

    } catch (err) {
      // Don't handle if aborted
      if (signal.aborted) return undefined

      const handledError = handleError(err)
      setError(handledError)

      // Rollback optimistic update on error
      rollbackOnError?.()

      // Error toast
      if (showErrorToast) {
        toast.error(handledError.message)
      }

      // Error callback
      onError?.(handledError, variables)

      // Settled callback
      onSettled?.(undefined, handledError, variables)

      return undefined
    } finally {
      if (!signal.aborted) {
        setLoading(false)
      }
    }
  }, [
    mutationFn,
    onSuccess,
    onError,
    onSettled,
    showSuccessToast,
    showErrorToast,
    optimisticUpdate,
    rollbackOnError
  ])

  // Async mutation that throws on error
  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData> => {
    const result = await executeMutation(variables)
    if (result === undefined && error) {
      throw error
    }
    return result as TData
  }, [executeMutation, error])

  // Reset state
  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  // Cancel mutation
  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setLoading(false)
  }, [])

  return {
    mutate: executeMutation,
    mutateAsync,
    data,
    loading,
    error,
    reset,
    cancel
  }
}