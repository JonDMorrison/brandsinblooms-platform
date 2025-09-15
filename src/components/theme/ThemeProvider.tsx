'use client'

import React, { createContext, useContext, ReactNode, useEffect } from 'react'
import { useSiteTheme } from '@/hooks/useSiteTheme'
import { useApplyTheme, useThemeCSS } from '@/hooks/useThemeCSS'
import { usePreviewModeOptional } from '@/src/components/preview/PreviewModeProvider'
import { ThemeSettings } from '@/lib/queries/domains/theme'

interface SiteThemeContextType {
  theme: ThemeSettings | null
  isLoading: boolean
  error: Error | null
  cssVariables: string
  themeStyles: string
  fullCSS: string
}

const SiteThemeContext = createContext<SiteThemeContextType | undefined>(undefined)

interface SiteThemeProviderProps {
  children: ReactNode
  applyToDocument?: boolean
}

export function SiteThemeProvider({ children, applyToDocument = false }: SiteThemeProviderProps) {
  const { theme, isLoading, error } = useSiteTheme()
  const previewMode = usePreviewModeOptional()
  const mode = previewMode?.mode || 'live'
  const { cssVariables, themeStyles, fullCSS } = useThemeCSS(theme, mode)

  // Debug logging for SiteThemeProvider
  console.log('[THEME_DEBUG] SiteThemeProvider - Provider state:', {
    hasTheme: !!theme,
    isLoading,
    error: error?.message,
    mode,
    applyToDocument,
    fullCSSLength: fullCSS.length
  });

  if (theme) {
    console.log('[THEME_DEBUG] SiteThemeProvider - Theme colors:', theme.colors);
  }

  // Apply theme to document if requested
  useApplyTheme(theme, applyToDocument, mode)
  
  const value: SiteThemeContextType = {
    theme,
    isLoading,
    error: error as Error | null,
    cssVariables,
    themeStyles,
    fullCSS
  }
  
  return (
    <SiteThemeContext.Provider value={value}>
      {children}
    </SiteThemeContext.Provider>
  )
}

export function useSiteThemeContext() {
  const context = useContext(SiteThemeContext)
  if (context === undefined) {
    throw new Error('useSiteThemeContext must be used within a SiteThemeProvider')
  }
  return context
}

interface ThemeWrapperProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

/**
 * Wrapper component that applies site theme styling to its children
 * Uses React.useMemo to prevent style recreation on every render
 */
export function ThemeWrapper({ children, className = '', style }: ThemeWrapperProps) {
  const { theme, fullCSS } = useSiteThemeContext()
  const previewMode = usePreviewModeOptional()
  const mode = previewMode?.mode || 'live'
  
  // Memoize the style element to prevent recreation
  const memoizedStyle = React.useMemo(() => {
    if (!theme || !fullCSS) return null
    return <style dangerouslySetInnerHTML={{ __html: fullCSS }} />
  }, [theme, fullCSS])
  
  if (!theme) {
    return <div className={className} style={style}>{children}</div>
  }
  
  // Determine data attributes based on mode
  const dataAttributes = {
    ...(mode === 'iframe' ? { 'data-preview-mode': 'iframe' } :
        { 'data-theme-applied': 'true' }),
    'data-header-style': theme.layout.headerStyle,
    'data-footer-style': theme.layout.footerStyle,
    'data-menu-style': theme.layout.menuStyle,
    'data-logo-position': theme.logo?.position || 'left',
    'data-logo-size': theme.logo?.size || 'medium'
  }
  
  return (
    <>
      {memoizedStyle}
      <div
        className={className}
        style={style}
        {...dataAttributes}
      >
        {children}
      </div>
    </>
  )
}

/**
 * Isolated theme wrapper that doesn't rely on context (useful for previews)
 */
interface IsolatedThemeWrapperProps extends ThemeWrapperProps {
  theme: ThemeSettings | null
  styleId?: string
}

export function IsolatedThemeWrapper({ theme, children, className = '', style }: IsolatedThemeWrapperProps) {
  const { fullCSS } = useThemeCSS(theme)
  
  // Memoize the style element to prevent recreation
  const memoizedStyle = React.useMemo(() => {
    if (!theme || !fullCSS) return null
    return <style dangerouslySetInnerHTML={{ __html: fullCSS }} />
  }, [theme, fullCSS])
  
  if (!theme) {
    return <div className={className} style={style}>{children}</div>
  }
  
  return (
    <>
      {memoizedStyle}
      <div
        className={className}
        style={style}
        data-theme-applied="true"
        data-header-style={theme.layout.headerStyle}
        data-footer-style={theme.layout.footerStyle}
        data-menu-style={theme.layout.menuStyle}
        data-logo-position={theme.logo?.position || 'left'}
        data-logo-size={theme.logo?.size || 'medium'}
      >
        {children}
      </div>
    </>
  )
}