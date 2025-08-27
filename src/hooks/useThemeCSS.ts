'use client'

import { useMemo } from 'react'
import { ThemeSettings } from '@/lib/queries/domains/theme'

/**
 * Hook for generating consistent theme CSS across all components
 */
export function useThemeCSS(theme: ThemeSettings | null) {
  const cssVariables = useMemo(() => {
    if (!theme) return ''

    const { colors, typography, layout, logo } = theme
    
    // Font size mapping
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    }
    
    return `
      :root {
        /* Theme Colors */
        --theme-primary: ${colors.primary};
        --theme-secondary: ${colors.secondary};
        --theme-accent: ${colors.accent};
        --theme-background: ${colors.background};
        --theme-text: ${colors.text || '#1a1a1a'};
        
        /* Theme Typography */
        --theme-font-heading: '${typography.headingFont}', system-ui, sans-serif;
        --theme-font-body: '${typography.bodyFont}', system-ui, sans-serif;
        --theme-font-size-base: ${fontSizeMap[typography.fontSize] || '16px'};
        --theme-font-weight-heading: ${typography.headingWeight || '700'};
        --theme-font-weight-body: ${typography.bodyWeight || '400'};
        
        /* Theme Layout */
        --theme-header-style: ${layout.headerStyle};
        --theme-footer-style: ${layout.footerStyle};
        --theme-menu-style: ${layout.menuStyle};
        
        /* Theme Logo */
        --theme-logo-url: ${logo?.url ? `url(${logo.url})` : 'none'};
        --theme-logo-position: ${logo?.position || 'left'};
        --theme-logo-size: ${logo?.size || 'medium'};
        
        /* Derived theme colors for components */
        --theme-primary-rgb: ${hexToRgb(colors.primary)};
        --theme-secondary-rgb: ${hexToRgb(colors.secondary)};
        --theme-accent-rgb: ${hexToRgb(colors.accent)};
        --theme-background-rgb: ${hexToRgb(colors.background)};
      }
    `
  }, [theme])
  
  const themeStyles = useMemo(() => {
    if (!theme) return ''
    
    const { layout } = theme
    
    return `
      /* Base theme styles */
      body[data-theme-applied="true"] {
        background-color: var(--theme-background);
        color: var(--theme-text);
        font-family: var(--theme-font-body);
        font-size: var(--theme-font-size-base);
        font-weight: var(--theme-font-weight-body);
      }
      
      [data-theme-applied="true"] h1, 
      [data-theme-applied="true"] h2, 
      [data-theme-applied="true"] h3, 
      [data-theme-applied="true"] h4, 
      [data-theme-applied="true"] h5, 
      [data-theme-applied="true"] h6 {
        font-family: var(--theme-font-heading);
        font-weight: var(--theme-font-weight-heading);
        color: var(--theme-primary);
      }
      
      [data-theme-applied="true"] a {
        color: var(--theme-primary);
        text-decoration: none;
      }
      
      [data-theme-applied="true"] a:hover {
        color: var(--theme-secondary);
      }
      
      /* Theme-aware buttons */
      [data-theme-applied="true"] .btn-theme-primary {
        background-color: var(--theme-primary);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      
      [data-theme-applied="true"] .btn-theme-primary:hover {
        opacity: 0.9;
      }
      
      [data-theme-applied="true"] .btn-theme-secondary {
        background-color: var(--theme-secondary);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      
      [data-theme-applied="true"] .btn-theme-secondary:hover {
        opacity: 0.9;
      }
      
      [data-theme-applied="true"] .theme-accent {
        color: var(--theme-accent);
      }
      
      /* Header Layout Styles */
      [data-theme-applied="true"][data-header-style="modern"] header {
        padding: 1.5rem 0;
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
      }
      
      [data-theme-applied="true"][data-header-style="classic"] header {
        padding: 1rem 0;
        background: white;
        border-bottom: 2px solid var(--theme-primary);
      }
      
      [data-theme-applied="true"][data-header-style="minimal"] header {
        padding: 1rem 0;
        background: transparent;
        border-bottom: 1px solid rgba(0,0,0,0.1);
      }
      
      /* Footer Layout Styles */
      [data-theme-applied="true"][data-footer-style="minimal"] footer {
        padding: 2rem 0;
        background: transparent;
        border-top: 1px solid rgba(0,0,0,0.1);
      }
      
      [data-theme-applied="true"][data-footer-style="detailed"] footer {
        padding: 3rem 0;
        background: var(--theme-primary);
        color: white;
      }
      
      [data-theme-applied="true"][data-footer-style="hidden"] footer {
        display: none;
      }
      
      /* Menu Layout Styles */
      [data-theme-applied="true"][data-menu-style="horizontal"] nav {
        display: flex;
        gap: 2rem;
        align-items: center;
      }
      
      [data-theme-applied="true"][data-menu-style="vertical"] nav {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      
      [data-theme-applied="true"][data-menu-style="sidebar"] nav {
        position: fixed;
        left: 0;
        top: 0;
        height: 100%;
        width: 250px;
        background: white;
        z-index: 1000;
      }
      
      /* Logo Styles */
      [data-theme-applied="true"][data-logo-position="left"] .theme-logo {
        justify-self: start;
      }
      
      [data-theme-applied="true"][data-logo-position="center"] .theme-logo {
        justify-self: center;
      }
      
      [data-theme-applied="true"][data-logo-position="right"] .theme-logo {
        justify-self: end;
      }
      
      [data-theme-applied="true"][data-logo-size="small"] .theme-logo {
        width: 2rem;
        height: 2rem;
      }
      
      [data-theme-applied="true"][data-logo-size="medium"] .theme-logo {
        width: 2.5rem;
        height: 2.5rem;
      }
      
      [data-theme-applied="true"][data-logo-size="large"] .theme-logo {
        width: 3rem;
        height: 3rem;
      }
    `
  }, [theme])
  
  return {
    cssVariables,
    themeStyles,
    fullCSS: cssVariables + themeStyles
  }
}

/**
 * Hook for applying theme to current document
 */
export function useApplyTheme(theme: ThemeSettings | null, enabled = true) {
  const { fullCSS } = useThemeCSS(theme)
  
  // Apply theme to document
  useMemo(() => {
    if (!enabled || typeof window === 'undefined' || !theme) return
    
    // Remove existing theme styles
    const existingStyle = document.getElementById('site-theme-styles')
    if (existingStyle) {
      existingStyle.remove()
    }
    
    // Create and inject new theme styles
    const styleElement = document.createElement('style')
    styleElement.id = 'site-theme-styles'
    styleElement.textContent = fullCSS
    document.head.appendChild(styleElement)
    
    // Apply theme data attributes
    document.body.setAttribute('data-theme-applied', 'true')
    document.body.setAttribute('data-header-style', theme.layout.headerStyle)
    document.body.setAttribute('data-footer-style', theme.layout.footerStyle)
    document.body.setAttribute('data-menu-style', theme.layout.menuStyle)
    
    if (theme.logo) {
      document.body.setAttribute('data-logo-position', theme.logo.position)
      document.body.setAttribute('data-logo-size', theme.logo.size)
    }
    
    return () => {
      // Cleanup function
      const style = document.getElementById('site-theme-styles')
      if (style) {
        style.remove()
      }
      document.body.removeAttribute('data-theme-applied')
      document.body.removeAttribute('data-header-style')
      document.body.removeAttribute('data-footer-style')
      document.body.removeAttribute('data-menu-style')
      document.body.removeAttribute('data-logo-position')
      document.body.removeAttribute('data-logo-size')
    }
  }, [fullCSS, theme, enabled])
  
  return { fullCSS }
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `${r}, ${g}, ${b}`
  }
  return '0, 0, 0'
}