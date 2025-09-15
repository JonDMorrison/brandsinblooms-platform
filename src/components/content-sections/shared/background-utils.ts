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
  
  // Default background
  return { backgroundColor: 'var(--theme-background)' }
}