'use client'

/**
 * Viewport Wrapper for Full Site Editor
 * Provides container query context and viewport-specific width constraints
 * Enables responsive breakpoints (@md, @lg, etc.) to work based on container width
 */

import React, { ReactNode } from 'react'
import { cn } from '@/src/lib/utils'

export type ViewportSize = 'mobile' | 'tablet' | 'desktop'

interface ViewportWrapperProps {
  viewport: ViewportSize
  children: ReactNode
}

/**
 * Wraps content with viewport-responsive container
 * - Enables @container CSS context for container queries
 * - Applies width constraints based on selected viewport
 * - Centers content with proper padding
 */
export function ViewportWrapper({ viewport, children }: ViewportWrapperProps) {
  // Get viewport-specific width classes
  const getViewportClass = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-[375px]'
      case 'tablet':
        return 'max-w-[768px]'
      case 'desktop':
        return 'w-full max-w-[1920px]'
      default:
        return 'w-full'
    }
  }

  return (
    <div className="flex justify-center bg-muted/20 min-h-screen w-full">
      <div
        className={cn(
          'w-full transition-all duration-300 ease-in-out',
          '@container', // Enable container queries
          getViewportClass()
        )}
        style={{
          // Ensure container query context is established
          containerType: 'inline-size'
        }}
      >
        {children}
      </div>
    </div>
  )
}
