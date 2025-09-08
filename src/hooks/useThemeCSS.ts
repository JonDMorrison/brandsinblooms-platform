'use client'

import { useMemo } from 'react'
import { ThemeSettings } from '@/lib/queries/domains/theme'

/**
 * Hook for generating consistent theme CSS across all components
 */
export function useThemeCSS(theme: ThemeSettings | null, mode: 'iframe' | 'live' = 'live') {
  const cssVariables = useMemo(() => {
    if (!theme) return ''

    const { colors, typography, layout, logo } = theme
    
    // Font size mapping
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    }
    
    // Base selector based on mode for CSS isolation
    const baseSelector = mode === 'iframe' 
      ? '[data-preview-mode="iframe"]' 
      : '[data-theme-applied="true"]'

    return `
      /* Font imports - for both iframe and live modes */
      @import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(typography.headingFont)}:wght@400;500;600;700&family=${encodeURIComponent(typography.bodyFont)}:wght@300;400;500;600&display=swap');
      
      ${baseSelector} {
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
  }, [theme, mode])
  
  const themeStyles = useMemo(() => {
    if (!theme) return ''
    
    const { layout } = theme
    
    // Base selector based on mode for CSS isolation
    const selector = mode === 'iframe' 
      ? '[data-preview-mode="iframe"]' 
      : '[data-theme-applied="true"]'
    
    return `
      /* Base theme styles with high specificity to override root layout */
      ${mode === 'iframe' ? selector : `body${selector}`} {
        background-color: var(--theme-background) !important;
        color: var(--theme-text) !important;
        font-family: var(--theme-font-body) !important;
        font-size: var(--theme-font-size-base) !important;
        font-weight: var(--theme-font-weight-body) !important;
      }
      
      
      ${selector} h1, 
      ${selector} h2, 
      ${selector} h3, 
      ${selector} h4, 
      ${selector} h5, 
      ${selector} h6,
      ${selector} .theme-brand-text {
        font-family: var(--theme-font-heading) !important;
        font-weight: var(--theme-font-weight-heading);
        color: var(--theme-primary);
      }
      
      ${selector} a {
        color: var(--theme-primary);
        text-decoration: none;
      }
      
      ${selector} a:hover {
        color: var(--theme-secondary);
      }
      
      /* Theme-aware buttons */
      ${selector} .btn-theme-primary {
        background-color: var(--theme-primary);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      
      ${selector} .btn-theme-primary:hover {
        opacity: 0.9;
      }
      
      ${selector} .btn-theme-secondary {
        background-color: var(--theme-secondary);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      
      ${selector} .btn-theme-secondary:hover {
        opacity: 0.9;
      }
      
      ${selector} .theme-accent {
        color: var(--theme-accent);
      }
      
      /* Header Layout Styles */
      ${selector}[data-header-style="modern"] header {
        padding: 1.5rem 0;
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
      }
      
      ${selector}[data-header-style="classic"] header {
        padding: 0.5rem 0;
        background: white;
      }
      
      ${selector}[data-header-style="minimal"] header {
        padding: 0.5rem 0;
        background: white;
      }
      
      /* Footer Layout Styles */
      ${selector}[data-footer-style="minimal"] footer {
        padding: 2rem 0;
        background: transparent;
        border-top: 1px solid rgba(0,0,0,0.1);
      }
      
      ${selector}[data-footer-style="detailed"] footer {
        padding: 3rem 0;
        background: var(--theme-primary);
        color: white;
      }
      
      ${selector}[data-footer-style="hidden"] footer {
        display: none;
      }
      
      /* Menu Layout Styles */
      ${selector}[data-menu-style="horizontal"] nav {
        display: flex;
        gap: 2rem;
        align-items: center;
      }
      
      ${selector}[data-menu-style="vertical"] nav {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      
      ${selector}[data-menu-style="sidebar"] nav {
        position: fixed;
        left: 0;
        top: 0;
        height: 100%;
        width: 250px;
        background: white;
        z-index: 1000;
      }
      
      /* Logo Styles */
      ${selector}[data-logo-position="left"] .theme-logo {
        justify-self: start;
      }
      
      ${selector}[data-logo-position="center"] .theme-logo {
        justify-self: center;
      }
      
      ${selector}[data-logo-position="right"] .theme-logo {
        justify-self: end;
      }
      
      ${selector}[data-logo-size="small"] .theme-logo {
        width: 2rem;
        height: 2rem;
      }
      
      ${selector}[data-logo-size="medium"] .theme-logo {
        width: 2.5rem;
        height: 2.5rem;
      }
      
      ${selector}[data-logo-size="large"] .theme-logo {
        width: 3rem;
        height: 3rem;
      }
      
      /* Mode-specific isolation for iframe */
      ${mode === 'iframe' ? `
        [data-preview-mode="iframe"] {
          isolation: isolate;
          contain: layout style;
        }
        
        [data-preview-mode="iframe"] * {
          box-sizing: border-box;
        }
        
        /* Reset potential inherited styles from parent dashboard */
        [data-preview-mode="iframe"] {
          font-family: var(--theme-font-body) !important;
          color: var(--theme-text) !important;
          background: var(--theme-background) !important;
        }
      ` : ''}
    `
  }, [theme, mode])
  
  return {
    cssVariables,
    themeStyles,
    fullCSS: cssVariables + themeStyles,
    mode
  }
}

/**
 * Hook for applying theme to current document
 */
export function useApplyTheme(theme: ThemeSettings | null, enabled = true, mode: 'iframe' | 'live' = 'live') {
  const { fullCSS } = useThemeCSS(theme, mode)
  
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
    
    // Apply theme data attributes based on mode
    if (mode === 'iframe') {
      document.body.setAttribute('data-preview-mode', 'iframe')
    } else {
      document.body.setAttribute('data-theme-applied', 'true')
    }
    
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
      // Remove mode-specific attributes
      document.body.removeAttribute('data-theme-applied')
      document.body.removeAttribute('data-preview-mode')
      document.body.removeAttribute('data-header-style')
      document.body.removeAttribute('data-footer-style')
      document.body.removeAttribute('data-menu-style')
      document.body.removeAttribute('data-logo-position')
      document.body.removeAttribute('data-logo-size')
    }
  }, [fullCSS, theme, enabled, mode])
  
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