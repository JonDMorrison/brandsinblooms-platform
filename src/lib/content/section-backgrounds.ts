/**
 * Defines which background options are available for each section type
 */

export type BackgroundType = 'default' | 'alternate' | 'primary' | 'gradient' | 'image'

/**
 * Get available background options for a section type
 */
export function getAvailableBackgrounds(sectionType: string): BackgroundType[] {
  // Hero sections get gradient and image options
  if (sectionType === 'hero') {
    return ['default', 'alternate', 'gradient', 'image']
  }

  // CTA sections get primary option
  if (sectionType === 'cta') {
    return ['default', 'alternate', 'primary']
  }

  // All other sections get only default and alternate
  return ['default', 'alternate']
}

/**
 * Get default background for a section type
 */
export function getDefaultBackground(sectionType: string): BackgroundType {
  if (sectionType === 'hero') {
    return 'gradient'
  }

  if (sectionType === 'cta') {
    return 'primary'
  }

  return 'default'
}
