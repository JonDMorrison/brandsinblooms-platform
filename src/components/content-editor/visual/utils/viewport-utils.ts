/**
 * Viewport utility functions for the visual editor
 * Handles viewport sizing, styling, and responsive behavior
 */

import { ViewportMode } from '../styles/viewport-styles'

export type { ViewportMode }

/**
 * Get viewport-specific CSS class name for the preview container
 */
export function getViewportClassName(viewport: ViewportMode): string {
  return `viewport-${viewport}`
}

/**
 * Get viewport-specific inline styles for the preview container
 */
export function getViewportContainerStyles(viewport: ViewportMode) {
  const baseStyles = {
    backgroundColor: 'var(--theme-background, #FFFFFF)'
  }
  
  switch (viewport) {
    case 'mobile':
      return { 
        ...baseStyles, 
        maxWidth: '390px', 
        margin: '0 auto',
        minHeight: '600px' 
      }
    case 'tablet':
      return { 
        ...baseStyles, 
        maxWidth: '768px', 
        margin: '0 auto',
        minHeight: '600px' 
      }
    default:
      return { 
        ...baseStyles, 
        width: '100%',
        height: '100%' 
      }
  }
}

/**
 * Viewport breakpoints for consistent sizing
 */
export const VIEWPORT_BREAKPOINTS = {
  mobile: 390,
  tablet: 768,
  desktop: 1200
} as const

/**
 * Check if a viewport mode is considered responsive
 */
export function isResponsiveViewport(viewport: ViewportMode): boolean {
  return viewport === 'mobile' || viewport === 'tablet'
}

/**
 * Get the appropriate container dimensions for a viewport
 */
export function getViewportDimensions(viewport: ViewportMode) {
  switch (viewport) {
    case 'mobile':
      return {
        width: VIEWPORT_BREAKPOINTS.mobile,
        height: 844, // iPhone 14 height
        aspectRatio: '390:844'
      }
    case 'tablet':
      return {
        width: VIEWPORT_BREAKPOINTS.tablet,
        height: 1024, // iPad height
        aspectRatio: '768:1024'
      }
    default:
      return {
        width: '100%',
        height: '100%',
        aspectRatio: 'auto'
      }
  }
}

/**
 * Generate CSS custom properties for viewport-specific scaling
 */
export function getViewportCSSProperties(viewport: ViewportMode): Record<string, string> {
  switch (viewport) {
    case 'mobile':
      return {
        '--viewport-scale': '0.5',
        '--viewport-width': `${VIEWPORT_BREAKPOINTS.mobile}px`,
        '--typography-scale': '0.875'
      }
    case 'tablet':
      return {
        '--viewport-scale': '0.75',
        '--viewport-width': `${VIEWPORT_BREAKPOINTS.tablet}px`,
        '--typography-scale': '0.9375'
      }
    default:
      return {
        '--viewport-scale': '1',
        '--viewport-width': '100%',
        '--typography-scale': '1'
      }
  }
}