'use client'

import React, { createContext, useContext, ReactNode, useEffect } from 'react'
import { useSiteTheme } from '@/hooks/useSiteTheme'
import { useApplyTheme, useThemeCSS } from '@/hooks/useThemeCSS'
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
  const { cssVariables, themeStyles, fullCSS } = useThemeCSS(theme)
  
  // Apply theme to document if requested
  useApplyTheme(theme, applyToDocument)
  
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
 */
export function ThemeWrapper({ children, className = '', style }: ThemeWrapperProps) {
  const { theme, fullCSS } = useSiteThemeContext()
  
  if (!theme) {
    return <div className={className} style={style}>{children}</div>
  }
  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: fullCSS }} />
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

/**
 * Isolated theme wrapper that doesn't rely on context (useful for previews)
 */
interface IsolatedThemeWrapperProps extends ThemeWrapperProps {
  theme: ThemeSettings | null
}

export function IsolatedThemeWrapper({ theme, children, className = '', style }: IsolatedThemeWrapperProps) {
  const { fullCSS } = useThemeCSS(theme)
  
  if (!theme) {
    return <div className={className} style={style}>{children}</div>
  }
  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: fullCSS }} />
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