'use client'

import { useEffect } from 'react'
import { debug } from '@/src/lib/utils/debug'

/**
 * Content change event types
 */
export type ContentEventType = 'content:created' | 'content:updated' | 'content:deleted'

/**
 * Content change event detail
 */
export interface ContentEventDetail {
  siteId: string
  contentId?: string
}

/**
 * Emit a content change event to notify all listening components
 *
 * This allows cross-component communication for cache invalidation
 * and automatic data refreshing without manual page reloads.
 *
 * @param event - The type of content event
 * @param data - Event details including siteId and optional contentId
 */
export function emitContentChange(event: ContentEventType, data: ContentEventDetail): void {
  if (typeof window === 'undefined') return

  debug.content('Emitting content change event:', {
    event,
    siteId: data.siteId,
    contentId: data.contentId
  })

  const customEvent = new CustomEvent(event, {
    detail: data,
    bubbles: true,
    composed: true
  })

  window.dispatchEvent(customEvent)
}

/**
 * Hook to listen for content change events and trigger a callback
 *
 * This hook automatically filters events to only those matching the current site
 * and calls the provided callback when relevant content changes occur.
 *
 * @param callback - Function to call when content changes
 * @param siteId - Current site ID to filter events
 *
 * @example
 * ```tsx
 * useContentChangeListener(() => {
 *   refetch()
 *   refetchStats()
 * }, currentSiteId)
 * ```
 */
export function useContentChangeListener(
  callback: () => void,
  siteId: string
): void {
  useEffect(() => {
    if (!siteId) return

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<ContentEventDetail>
      const detail = customEvent.detail

      // Only trigger callback for events matching current site
      if (detail.siteId === siteId) {
        debug.content('Content change event received, triggering callback:', {
          event: e.type,
          siteId: detail.siteId,
          contentId: detail.contentId
        })
        callback()
      }
    }

    // Listen to all content event types
    window.addEventListener('content:created', handler)
    window.addEventListener('content:updated', handler)
    window.addEventListener('content:deleted', handler)

    debug.content('Content change listener registered for site:', siteId)

    return () => {
      window.removeEventListener('content:created', handler)
      window.removeEventListener('content:updated', handler)
      window.removeEventListener('content:deleted', handler)
      debug.content('Content change listener unregistered for site:', siteId)
    }
  }, [callback, siteId])
}

/**
 * Hook to listen for specific content item changes
 *
 * Similar to useContentChangeListener but filters to only trigger
 * for changes to a specific content item.
 *
 * @param callback - Function to call when the specific content changes
 * @param siteId - Current site ID
 * @param contentId - Specific content ID to watch
 */
export function useContentItemChangeListener(
  callback: () => void,
  siteId: string,
  contentId: string
): void {
  useEffect(() => {
    if (!siteId || !contentId) return

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<ContentEventDetail>
      const detail = customEvent.detail

      // Only trigger for the specific content item
      if (detail.siteId === siteId && detail.contentId === contentId) {
        debug.content('Specific content item change event received:', {
          event: e.type,
          siteId: detail.siteId,
          contentId: detail.contentId
        })
        callback()
      }
    }

    window.addEventListener('content:updated', handler)
    window.addEventListener('content:deleted', handler)

    debug.content('Content item listener registered:', { siteId, contentId })

    return () => {
      window.removeEventListener('content:updated', handler)
      window.removeEventListener('content:deleted', handler)
      debug.content('Content item listener unregistered:', { siteId, contentId })
    }
  }, [callback, siteId, contentId])
}
