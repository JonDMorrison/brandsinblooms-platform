/**
 * Background styling utilities for sections
 */

import { ContentSection } from '@/src/lib/content/schema'

/**
 * Get section background style based on settings
 */
export const getSectionBackgroundStyle = (settings?: ContentSection['settings']) => {
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