'use client'

import { useMemo } from 'react'
import { ThemeSettings } from '@/lib/queries/domains/theme'
import { generatePlantThemeCSS } from '@/src/lib/theme/plant-shop-variables'

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
      /* Font loading optimized to prevent duplicate requests */
      ${typography.headingFont !== 'Inter' ? `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(typography.headingFont)}:wght@400;500;600;700&display=swap');` : '/* Inter font already loaded in layout */'}
      ${typography.bodyFont !== 'Inter' && typography.bodyFont !== typography.headingFont ? `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(typography.bodyFont)}:wght@300;400;500;600&display=swap');` : '/* Font already loaded */'}
      
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
        
        /* Plant-specific color variables */
        --plant-primary: ${colors.primary};
        --plant-secondary: ${colors.secondary};
        --plant-accent: ${colors.accent};
        --plant-green: #10b981;
        --plant-green-light: #34d399;
        --plant-green-dark: #059669;
        --plant-earth: #8b5a3c;
        --plant-earth-light: #a16655;
        --plant-earth-dark: #6b4423;
        
        /* Care level indicator colors */
        --care-easy: #10b981;
        --care-medium: #f59e0b;
        --care-challenging: #ef4444;
        
        /* Status and condition colors */
        --plant-healthy: #10b981;
        --plant-warning: #f59e0b;
        --plant-danger: #ef4444;
        --plant-info: #3b82f6;
        
        /* Light requirement colors */
        --light-low: #6b7280;
        --light-medium: #f59e0b;
        --light-bright: #fbbf24;
        --light-direct: #f97316;
        
        /* Water frequency colors */
        --water-weekly: #3b82f6;
        --water-biweekly: #06b6d4;
        --water-monthly: #8b5cf6;
        --water-seasonal: #6b7280;
        
        /* Seasonal colors */
        --season-spring: #10b981;
        --season-summer: #f59e0b;
        --season-autumn: #ea580c;
        --season-winter: #3b82f6;
        
        /* Plant grid and layout variables */
        --plant-grid-columns-mobile: 1;
        --plant-grid-columns-tablet: 2;
        --plant-grid-columns-desktop: 3;
        --plant-grid-gap: 1.5rem;
        --plant-grid-gap-mobile: 1rem;
        
        /* Plant card dimensions */
        --plant-card-padding: 1.5rem;
        --plant-card-border-radius: 0.75rem;
        --plant-card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        --plant-card-shadow-hover: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        
        /* Plant image aspect ratios */
        --plant-image-aspect-square: 1 / 1;
        --plant-image-aspect-portrait: 3 / 4;
        --plant-image-aspect-landscape: 4 / 3;
        --plant-image-border-radius: 0.5rem;
        
        /* Plant spacing */
        --plant-section-spacing: 3rem;
        --plant-item-spacing: 1.5rem;
        --plant-content-spacing: 1rem;
        
        /* Plant typography */
        --plant-name-font-size: 1.25rem;
        --plant-name-font-weight: 600;
        --plant-name-line-height: 1.4;
        --plant-name-color: ${colors.text || '#1a1a1a'};
        
        --plant-scientific-font-size: 0.875rem;
        --plant-scientific-font-weight: 400;
        --plant-scientific-font-style: italic;
        --plant-scientific-color: ${colors.text || '#1a1a1a'};
        --plant-scientific-opacity: 0.7;
        
        --plant-care-font-size: 0.875rem;
        --plant-care-font-weight: 500;
        --plant-care-line-height: 1.5;
        
        --plant-category-font-size: 1.125rem;
        --plant-category-font-weight: 600;
        --plant-category-color: ${colors.primary};
        
        --plant-description-font-size: 0.9rem;
        --plant-description-line-height: 1.6;
        --plant-description-color: ${colors.text || '#1a1a1a'};
        
        --plant-badge-font-size: 0.75rem;
        --plant-badge-font-weight: 500;
        --plant-badge-letter-spacing: 0.025em;
        
        /* Plant component variables */
        --care-badge-padding: 0.25rem 0.75rem;
        --care-badge-border-radius: 9999px;
        --care-badge-font-size: var(--plant-badge-font-size);
        
        --plant-icon-size: 1.25rem;
        --plant-icon-size-small: 1rem;
        --plant-icon-size-large: 1.5rem;
        
        --plant-progress-height: 0.5rem;
        --plant-progress-border-radius: 0.25rem;
        --plant-progress-background: #e5e7eb;
        
        --plant-comparison-cell-padding: 0.75rem;
        --plant-comparison-header-background: #f9fafb;
        --plant-comparison-border-color: #e5e7eb;
        
        --plant-timeline-line-width: 2px;
        --plant-timeline-dot-size: 12px;
        --plant-timeline-gap: 2rem;
        
        /* Responsive breakpoints */
        --plant-mobile-max: 640px;
        --plant-tablet-max: 1024px;
        --plant-desktop-min: 1025px;
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
      
      /* Plant Shop Theme Styles */
      /* Plant cards */
      ${selector} .plant-card {
        background: var(--theme-background);
        border-radius: var(--plant-card-border-radius);
        box-shadow: var(--plant-card-shadow);
        padding: var(--plant-card-padding);
        transition: all 0.2s ease;
        border: 1px solid rgba(0, 0, 0, 0.05);
      }
      
      ${selector} .plant-card:hover {
        box-shadow: var(--plant-card-shadow-hover);
        transform: translateY(-2px);
      }
      
      /* Plant images */
      ${selector} .plant-image {
        border-radius: var(--plant-image-border-radius);
        aspect-ratio: var(--plant-image-aspect-square);
        object-fit: cover;
        width: 100%;
      }
      
      ${selector} .plant-image-portrait {
        aspect-ratio: var(--plant-image-aspect-portrait);
      }
      
      ${selector} .plant-image-landscape {
        aspect-ratio: var(--plant-image-aspect-landscape);
      }
      
      /* Plant names and text */
      ${selector} .plant-name {
        font-size: var(--plant-name-font-size);
        font-weight: var(--plant-name-font-weight);
        line-height: var(--plant-name-line-height);
        color: var(--plant-name-color);
        margin: 0;
      }
      
      ${selector} .plant-scientific-name {
        font-size: var(--plant-scientific-font-size);
        font-weight: var(--plant-scientific-font-weight);
        font-style: var(--plant-scientific-font-style);
        color: var(--plant-scientific-color);
        opacity: var(--plant-scientific-opacity);
        margin: 0;
      }
      
      ${selector} .plant-description {
        font-size: var(--plant-description-font-size);
        line-height: var(--plant-description-line-height);
        color: var(--plant-description-color);
      }
      
      ${selector} .plant-category-header {
        font-size: var(--plant-category-font-size);
        font-weight: var(--plant-category-font-weight);
        color: var(--plant-category-color);
        margin: 0 0 1rem 0;
      }
      
      /* Care level badges */
      ${selector} .care-badge {
        padding: var(--care-badge-padding);
        border-radius: var(--care-badge-border-radius);
        font-size: var(--care-badge-font-size);
        font-weight: var(--plant-badge-font-weight);
        letter-spacing: var(--plant-badge-letter-spacing);
        text-transform: uppercase;
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      
      ${selector} .care-badge-easy {
        background-color: var(--care-easy);
        color: white;
      }
      
      ${selector} .care-badge-medium {
        background-color: var(--care-medium);
        color: white;
      }
      
      ${selector} .care-badge-challenging {
        background-color: var(--care-challenging);
        color: white;
      }
      
      /* Light requirement indicators */
      ${selector} .light-indicator {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: var(--plant-care-font-size);
        font-weight: var(--plant-care-font-weight);
      }
      
      ${selector} .light-indicator-low {
        color: var(--light-low);
      }
      
      ${selector} .light-indicator-medium {
        color: var(--light-medium);
      }
      
      ${selector} .light-indicator-bright {
        color: var(--light-bright);
      }
      
      ${selector} .light-indicator-direct {
        color: var(--light-direct);
      }
      
      /* Water frequency indicators */
      ${selector} .water-indicator {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: var(--plant-care-font-size);
        font-weight: var(--plant-care-font-weight);
      }
      
      ${selector} .water-indicator-weekly {
        color: var(--water-weekly);
      }
      
      ${selector} .water-indicator-biweekly {
        color: var(--water-biweekly);
      }
      
      ${selector} .water-indicator-monthly {
        color: var(--water-monthly);
      }
      
      ${selector} .water-indicator-seasonal {
        color: var(--water-seasonal);
      }
      
      /* Plant grid layouts */
      ${selector} .plant-grid {
        display: grid;
        gap: var(--plant-grid-gap);
        grid-template-columns: repeat(var(--plant-grid-columns-mobile), 1fr);
      }
      
      @media (min-width: 768px) {
        ${selector} .plant-grid {
          grid-template-columns: repeat(var(--plant-grid-columns-tablet), 1fr);
        }
      }
      
      @media (min-width: 1024px) {
        ${selector} .plant-grid {
          grid-template-columns: repeat(var(--plant-grid-columns-desktop), 1fr);
        }
      }
      
      /* Plant icons */
      ${selector} .plant-icon {
        width: var(--plant-icon-size);
        height: var(--plant-icon-size);
      }
      
      ${selector} .plant-icon-small {
        width: var(--plant-icon-size-small);
        height: var(--plant-icon-size-small);
      }
      
      ${selector} .plant-icon-large {
        width: var(--plant-icon-size-large);
        height: var(--plant-icon-size-large);
      }
      
      /* Plant comparison tables */
      ${selector} .plant-comparison-table {
        width: 100%;
        border-collapse: collapse;
        margin: var(--plant-content-spacing) 0;
      }
      
      ${selector} .plant-comparison-table th,
      ${selector} .plant-comparison-table td {
        padding: var(--plant-comparison-cell-padding);
        border: 1px solid var(--plant-comparison-border-color);
        text-align: left;
      }
      
      ${selector} .plant-comparison-table th {
        background-color: var(--plant-comparison-header-background);
        font-weight: 600;
        color: var(--plant-category-color);
      }
      
      /* Plant progress bars (for care calendars) */
      ${selector} .plant-progress {
        height: var(--plant-progress-height);
        background-color: var(--plant-progress-background);
        border-radius: var(--plant-progress-border-radius);
        overflow: hidden;
      }
      
      ${selector} .plant-progress-fill {
        height: 100%;
        background-color: var(--plant-green);
        transition: width 0.3s ease;
      }
      
      /* Seasonal styling */
      ${selector} .season-spring {
        color: var(--season-spring);
      }
      
      ${selector} .season-summer {
        color: var(--season-summer);
      }
      
      ${selector} .season-autumn {
        color: var(--season-autumn);
      }
      
      ${selector} .season-winter {
        color: var(--season-winter);
      }
      
      /* Plant section spacing */
      ${selector} .plant-section {
        margin: var(--plant-section-spacing) 0;
      }
      
      ${selector} .plant-item {
        margin-bottom: var(--plant-item-spacing);
      }
      
      ${selector} .plant-content {
        margin: var(--plant-content-spacing) 0;
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