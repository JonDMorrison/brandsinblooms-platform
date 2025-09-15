'use client'

import React from 'react'
import { SiteThemeProvider, ThemeWrapper } from '@/src/components/theme/ThemeProvider'
import { SiteLayout } from '@/src/components/layout/SiteLayout'
import { PreviewModeProvider, PreviewMode } from '@/src/components/preview/PreviewModeProvider'

interface SiteRendererProps {
  siteId: string
  mode: PreviewMode
  showNavigation?: boolean
  className?: string
  children?: React.ReactNode
}

/**
 * Unified site renderer that works across all preview contexts:
 * - iframe: Design preview embedded in dashboard
 * - live: Customer-facing site
 */
export function SiteRenderer({ 
  siteId, 
  mode, 
  showNavigation = true,
  className,
  children 
}: SiteRendererProps) {
  // Determine if we should apply theme to document (not for iframe mode)
  const applyToDocument = mode !== 'iframe'
  
  // Determine if we should show navigation (not for iframe mode by default)
  const shouldShowNavigation = showNavigation && mode !== 'iframe'
  
  return (
    <PreviewModeProvider mode={mode}>
      <SiteThemeProvider applyToDocument={applyToDocument}>
        <ThemeWrapper
          className={`min-h-screen flex flex-col ${className || ''}`}
          data-preview-mode={mode}
        >
          <SiteLayout
            showNavigation={shouldShowNavigation}
            requireAuth={false}
            requireSiteAccess={false}
          >
            {children}
          </SiteLayout>
        </ThemeWrapper>
      </SiteThemeProvider>
    </PreviewModeProvider>
  )
}