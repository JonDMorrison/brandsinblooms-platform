'use client'

import { useEffect } from 'react'
import { debug } from '@/src/lib/utils/debug'

/**
 * Category change event types
 */
export type CategoryEventType = 'category:created' | 'category:updated' | 'category:deleted'

/**
 * Category change event detail
 */
export interface CategoryEventDetail {
  siteId: string
  categoryId?: string
}

/**
 * Emit a category change event to notify all listening components
 *
 * This allows cross-component communication for cache invalidation
 * and automatic data refreshing without manual page reloads.
 *
 * @param event - The type of category event
 * @param data - Event details including siteId and optional categoryId
 */
export function emitCategoryChange(event: CategoryEventType, data: CategoryEventDetail): void {
  if (typeof window === 'undefined') return

  debug.content('Emitting category change event:', {
    event,
    siteId: data.siteId,
    categoryId: data.categoryId
  })

  const customEvent = new CustomEvent(event, {
    detail: data,
    bubbles: true,
    composed: true
  })

  window.dispatchEvent(customEvent)
}

/**
 * Hook to listen for category change events and trigger a callback
 *
 * This hook automatically filters events to only those matching the current site
 * and calls the provided callback when relevant category changes occur.
 *
 * @param callback - Function to call when categories change
 * @param siteId - Current site ID to filter events
 *
 * @example
 * ```tsx
 * useCategoryChangeListener(() => {
 *   refetch()
 * }, currentSiteId)
 * ```
 */
export function useCategoryChangeListener(
  callback: () => void,
  siteId: string | null
): void {
  useEffect(() => {
    if (!siteId) return

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<CategoryEventDetail>
      const detail = customEvent.detail

      // Only trigger callback for events matching current site
      if (detail.siteId === siteId) {
        debug.content('Category change event received, triggering callback:', {
          event: e.type,
          siteId: detail.siteId,
          categoryId: detail.categoryId
        })
        callback()
      }
    }

    // Listen to all category event types
    window.addEventListener('category:created', handler)
    window.addEventListener('category:updated', handler)
    window.addEventListener('category:deleted', handler)

    debug.content('Category change listener registered for site:', siteId)

    return () => {
      window.removeEventListener('category:created', handler)
      window.removeEventListener('category:updated', handler)
      window.removeEventListener('category:deleted', handler)
      debug.content('Category change listener unregistered for site:', siteId)
    }
  }, [callback, siteId])
}

/**
 * Hook to listen for specific category item changes
 *
 * Similar to useCategoryChangeListener but filters to only trigger
 * for changes to a specific category item.
 *
 * @param callback - Function to call when the specific category changes
 * @param siteId - Current site ID
 * @param categoryId - Specific category ID to watch
 */
export function useCategoryItemChangeListener(
  callback: () => void,
  siteId: string | null,
  categoryId: string | null
): void {
  useEffect(() => {
    if (!siteId || !categoryId) return

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<CategoryEventDetail>
      const detail = customEvent.detail

      // Only trigger for the specific category item
      if (detail.siteId === siteId && detail.categoryId === categoryId) {
        debug.content('Specific category item change event received:', {
          event: e.type,
          siteId: detail.siteId,
          categoryId: detail.categoryId
        })
        callback()
      }
    }

    window.addEventListener('category:updated', handler)
    window.addEventListener('category:deleted', handler)

    debug.content('Category item listener registered:', { siteId, categoryId })

    return () => {
      window.removeEventListener('category:updated', handler)
      window.removeEventListener('category:deleted', handler)
      debug.content('Category item listener unregistered:', { siteId, categoryId })
    }
  }, [callback, siteId, categoryId])
}
