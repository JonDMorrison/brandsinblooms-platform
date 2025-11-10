'use client'

import { useMemo, useCallback } from 'react'
import { ThemeSettings } from '@/src/lib/queries/domains/theme'
import { useThemeCSS } from './useThemeCSS'
import { 
  PLANT_THEME_PRESETS, 
  type PlantThemePresetKey,
  generatePlantThemeCSS 
} from '@/src/lib/theme/plant-shop-variables'

/**
 * Enhanced hook for plant shop theme management
 * Combines base theme system with plant-specific variables and iframe support
 */
export function usePlantShopTheme(
  theme: ThemeSettings | null, 
  mode: 'iframe' | 'live' = 'live'
) {
  const { fullCSS, cssVariables, themeStyles } = useThemeCSS(theme, mode)

  // Generate plant-specific CSS additions
  const plantSpecificCSS = useMemo(() => {
    if (!theme) return ''

    const baseSelector = mode === 'iframe' 
      ? '[data-preview-mode="iframe"]' 
      : '[data-theme-applied="true"]'

    return `
      /* Plant Shop Enhanced Styles */
      ${baseSelector} .plant-showcase {
        display: grid;
        grid-template-columns: repeat(var(--plant-grid-columns-mobile), 1fr);
        gap: var(--plant-grid-gap-mobile);
      }
      
      @media (min-width: 768px) {
        ${baseSelector} .plant-showcase {
          grid-template-columns: repeat(var(--plant-grid-columns-tablet), 1fr);
          gap: var(--plant-grid-gap);
        }
      }
      
      @media (min-width: 1024px) {
        ${baseSelector} .plant-showcase {
          grid-template-columns: repeat(var(--plant-grid-columns-desktop), 1fr);
        }
      }

      /* Enhanced plant card hover effects */
      ${baseSelector} .plant-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      ${baseSelector} .plant-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }

      /* Plant care indicators with better accessibility */
      ${baseSelector} .care-badge {
        position: relative;
        overflow: hidden;
      }

      ${baseSelector} .care-badge::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }

      ${baseSelector} .care-badge:hover::before {
        left: 100%;
      }

      /* Responsive plant images */
      ${baseSelector} .plant-image {
        transition: transform 0.3s ease;
      }

      ${baseSelector} .plant-card:hover .plant-image {
        transform: scale(1.05);
      }

      /* Enhanced seasonal color animations */
      ${baseSelector} .season-spring {
        animation: spring-glow 2s ease-in-out infinite alternate;
      }

      ${baseSelector} .season-summer {
        animation: summer-glow 2s ease-in-out infinite alternate;
      }

      ${baseSelector} .season-autumn {
        animation: autumn-glow 2s ease-in-out infinite alternate;
      }

      ${baseSelector} .season-winter {
        animation: winter-glow 2s ease-in-out infinite alternate;
      }

      @keyframes spring-glow {
        from { color: var(--season-spring); }
        to { color: color-mix(in srgb, var(--season-spring) 80%, white); }
      }

      @keyframes summer-glow {
        from { color: var(--season-summer); }
        to { color: color-mix(in srgb, var(--season-summer) 80%, white); }
      }

      @keyframes autumn-glow {
        from { color: var(--season-autumn); }
        to { color: color-mix(in srgb, var(--season-autumn) 80%, white); }
      }

      @keyframes winter-glow {
        from { color: var(--season-winter); }
        to { color: color-mix(in srgb, var(--season-winter) 80%, white); }
      }

      /* Plant comparison table enhancements */
      ${baseSelector} .plant-comparison-table tr:hover {
        background-color: color-mix(in srgb, var(--plant-green) 5%, transparent);
      }

      /* Care calendar progress animations */
      ${baseSelector} .plant-progress-fill {
        background: linear-gradient(90deg, var(--plant-green), var(--plant-green-light));
        position: relative;
        overflow: hidden;
      }

      ${baseSelector} .plant-progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background-image: linear-gradient(
          -45deg,
          rgba(255, 255, 255, .2) 25%,
          transparent 25%,
          transparent 50%,
          rgba(255, 255, 255, .2) 50%,
          rgba(255, 255, 255, .2) 75%,
          transparent 75%,
          transparent
        );
        background-size: 50px 50px;
        animation: move 2s linear infinite;
      }

      @keyframes move {
        0% { background-position: 0 0; }
        100% { background-position: 50px 50px; }
      }
    `
  }, [theme, mode])

  // Combined CSS with plant enhancements
  const enhancedCSS = useMemo(() => {
    return fullCSS + plantSpecificCSS
  }, [fullCSS, plantSpecificCSS])

  // Iframe-safe CSS injection
  const injectIframeCSS = useCallback((iframeDoc: Document) => {
    if (!theme || !iframeDoc) return

    // Remove existing styles
    const existingStyle = iframeDoc.getElementById('plant-shop-theme-styles')
    if (existingStyle) {
      existingStyle.remove()
    }

    // Create and inject new styles
    const styleElement = iframeDoc.createElement('style')
    styleElement.id = 'plant-shop-theme-styles'
    styleElement.textContent = enhancedCSS
    iframeDoc.head.appendChild(styleElement)

    // Apply data attributes to body
    iframeDoc.body.setAttribute('data-preview-mode', 'iframe')
    if (theme.layout) {
      iframeDoc.body.setAttribute('data-header-style', theme.layout.headerStyle)
      iframeDoc.body.setAttribute('data-footer-style', theme.layout.footerStyle)
      iframeDoc.body.setAttribute('data-menu-style', theme.layout.menuStyle)
    }
  }, [theme, enhancedCSS])

  // Generate theme from preset
  const getThemeFromPreset = useCallback((preset: PlantThemePresetKey): ThemeSettings => {
    const presetData = PLANT_THEME_PRESETS[preset]
    return {
      colors: presetData.colors,
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        fontSize: 'medium',
        headingWeight: '600',
        bodyWeight: '400'
      },
      layout: {
        headerStyle: 'modern',
        footerStyle: 'minimal',
        menuStyle: 'horizontal'
      }
    } as ThemeSettings
  }, [])

  // Responsive grid helper
  const getResponsiveColumns = useCallback((
    baseColumns: number, 
    viewport: 'mobile' | 'tablet' | 'desktop'
  ) => {
    const columnMap = {
      mobile: 1,
      tablet: Math.min(baseColumns, 2),
      desktop: baseColumns
    }
    return columnMap[viewport]
  }, [])

  return {
    fullCSS: enhancedCSS,
    cssVariables,
    themeStyles: themeStyles + plantSpecificCSS,
    mode,
    injectIframeCSS,
    getThemeFromPreset,
    getResponsiveColumns,
    plantSpecificCSS
  }
}

/**
 * Hook for managing plant theme presets in content editors
 */
export function usePlantThemePresets() {
  const presets = useMemo(() => PLANT_THEME_PRESETS, [])
  
  const getPresetTheme = useCallback((preset: PlantThemePresetKey): ThemeSettings => {
    const presetData = PLANT_THEME_PRESETS[preset]
    return {
      colors: presetData.colors,
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter', 
        fontSize: 'medium',
        headingWeight: '600',
        bodyWeight: '400'
      },
      layout: {
        headerStyle: 'modern',
        footerStyle: 'minimal',
        menuStyle: 'horizontal'
      }
    } as ThemeSettings
  }, [])

  const presetKeys = useMemo(() => Object.keys(presets) as PlantThemePresetKey[], [presets])

  return {
    presets,
    presetKeys,
    getPresetTheme
  }
}

/**
 * Hook for ensuring CSS variable inheritance in iframe contexts
 */
export function useIframeThemeInheritance(
  theme: ThemeSettings | null,
  iframeRef: React.RefObject<HTMLIFrameElement>
) {
  const { enhancedCSS } = usePlantShopTheme(theme, 'iframe')

  const applyThemeToIframe = useCallback(() => {
    if (!iframeRef.current?.contentDocument || !theme) return

    const iframeDoc = iframeRef.current.contentDocument
    
    // Remove existing styles
    const existingStyle = iframeDoc.getElementById('inherited-theme-styles')
    if (existingStyle) {
      existingStyle.remove()
    }

    // Inject theme styles
    const styleElement = iframeDoc.createElement('style')
    styleElement.id = 'inherited-theme-styles'
    styleElement.textContent = enhancedCSS
    iframeDoc.head.appendChild(styleElement)

    // Apply data attributes for proper CSS targeting
    iframeDoc.body.setAttribute('data-preview-mode', 'iframe')
    iframeDoc.body.setAttribute('data-theme-applied', 'true')
    
    if (theme.layout) {
      iframeDoc.body.setAttribute('data-header-style', theme.layout.headerStyle)
      iframeDoc.body.setAttribute('data-footer-style', theme.layout.footerStyle)
      iframeDoc.body.setAttribute('data-menu-style', theme.layout.menuStyle)
    }
  }, [theme, enhancedCSS, iframeRef])

  return { applyThemeToIframe }
}