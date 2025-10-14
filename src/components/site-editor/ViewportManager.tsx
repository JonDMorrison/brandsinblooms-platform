'use client'

/**
 * Viewport Manager for Full Site Editor
 * Conditionally wraps content with ViewportWrapper based on editor mode
 * In edit mode: Applies viewport constraints and container query context
 * In navigate mode: Renders content normally without viewport wrapper
 */

import React, { ReactNode } from 'react'
import { useFullSiteEditor } from '@/src/contexts/FullSiteEditorContext'
import { ViewportWrapper } from './ViewportWrapper'

interface ViewportManagerProps {
  children: ReactNode
}

/**
 * Manages viewport wrapping based on editor mode
 * Must be used within FullSiteEditorProvider context
 */
export function ViewportManager({ children }: ViewportManagerProps) {
  const { editorMode, viewportSize } = useFullSiteEditor()

  // In navigate mode, render children without viewport wrapper
  // This allows normal responsive behavior with media queries
  if (editorMode === 'navigate') {
    return <>{children}</>
  }

  // In edit mode, wrap with viewport container
  // This enables container queries and viewport-specific sizing
  return (
    <ViewportWrapper viewport={viewportSize}>
      {children}
    </ViewportWrapper>
  )
}
