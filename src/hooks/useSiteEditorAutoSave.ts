'use client'

/**
 * Auto-save hook for full site editor
 * Automatically saves changes after a period of inactivity
 */

import { useEffect, useRef } from 'react'
import { useFullSiteEditor } from '@/src/contexts/FullSiteEditorContext'

interface AutoSaveOptions {
  enabled?: boolean
  delay?: number // milliseconds
}

export function useSiteEditorAutoSave(options: AutoSaveOptions = {}) {
  const {
    enabled = true,
    delay = 2000 // 2 seconds default
  } = options

  const {
    hasUnsavedChanges,
    isSaving,
    savePage,
    pageContent
  } = useFullSiteEditor()

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Don't auto-save if:
    // - Auto-save is disabled
    // - No unsaved changes
    // - Already saving
    // - No page content
    if (!enabled || !hasUnsavedChanges || isSaving || !pageContent) {
      return
    }

    // Set up auto-save timeout
    timeoutRef.current = setTimeout(() => {
      console.log('Auto-saving changes...')
      savePage()
    }, delay)

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [hasUnsavedChanges, isSaving, pageContent, savePage, delay, enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isAutoSaveEnabled: enabled,
    hasUnsavedChanges,
    isSaving
  }
}
