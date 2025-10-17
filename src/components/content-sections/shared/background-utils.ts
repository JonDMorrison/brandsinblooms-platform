/**
 * Background styling utilities for sections
 */

import { ContentSection } from '@/src/lib/content/schema'

/**
 * Get section background style based on settings
 */
export const getSectionBackgroundStyle = (settings?: ContentSection['settings']) => {
  // Check for image background first
  if (settings?.backgroundImage?.url) {
    const { url, position = 'center', scale = 100 } = settings.backgroundImage as {
      url: string
      position?: string
      opacity?: number
      scale?: number
    }

    // Convert position format: 'top-left' → 'top left'
    const bgPosition = position.replace('-', ' ')

    // Calculate background size based on scale
    // scale: 100 = 100% (normal), 150 = 150% (zoomed in)
    const bgSize = scale === 100 ? 'cover' : `${scale}%`

    return {
      backgroundImage: `url(${url})`,
      backgroundSize: bgSize,
      backgroundPosition: bgPosition,
      backgroundRepeat: 'no-repeat'
    }
  }

  // Fallback to color backgrounds
  const backgroundType = settings?.backgroundColor || 'default'

  if (backgroundType === 'alternate') {
    return { backgroundColor: 'rgba(var(--theme-primary-rgb), 0.03)' }
  }

  if (backgroundType === 'primary') {
    return { backgroundColor: 'var(--theme-primary)' }
  }

  if (backgroundType === 'gradient') {
    return {
      background: 'linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-secondary-rgb), 0.1))'
    }
  }

  // Default background
  return { backgroundColor: 'var(--theme-background)' }
}

/**
 * Get background image opacity overlay style
 * Returns undefined if no opacity setting or if opacity is 100
 */
export const getBackgroundImageOpacity = (settings?: ContentSection['settings']): number | undefined => {
  if (settings?.backgroundImage?.url && settings?.backgroundImage?.opacity !== undefined) {
    const opacity = settings.backgroundImage.opacity as number
    return opacity < 100 ? (100 - opacity) / 100 : undefined
  }
  return undefined
}