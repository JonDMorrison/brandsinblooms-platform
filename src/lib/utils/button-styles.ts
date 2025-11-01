/**
 * Button Style Utilities
 * Provides consistent button styling across all content sections
 */

import { CSSProperties } from 'react'
import { ButtonStyleVariant } from '@/src/lib/content/schema'

export interface ButtonStyleOptions {
  variant: ButtonStyleVariant
  isPrimaryBackground?: boolean
}

/**
 * Get button styles based on variant and context
 *
 * @param variant - The button style variant ('primary', 'secondary', 'accent')
 * @param isPrimaryBackground - Whether the section has a primary background color
 * @returns CSS properties object for inline styling
 */
export function getButtonStyles(
  variant: ButtonStyleVariant,
  isPrimaryBackground: boolean = false
): CSSProperties {
  // Special case: When section has primary background, invert primary button to white
  if (isPrimaryBackground && variant === 'primary') {
    return {
      backgroundColor: 'white',
      color: 'var(--theme-primary)',
      fontFamily: 'var(--theme-font-body)',
      border: 'none'
    }
  }

  // Special case: When section has primary background, secondary buttons use white border
  if (isPrimaryBackground && variant === 'secondary') {
    return {
      backgroundColor: 'transparent',
      borderColor: 'white',
      color: 'white',
      fontFamily: 'var(--theme-font-body)',
      border: '2px solid white'
    }
  }

  // Standard button styles
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: 'var(--theme-primary)',
        color: 'rgb(255, 255, 255)',
        fontFamily: 'var(--theme-font-body)',
        border: 'none'
      }

    case 'secondary':
      return {
        backgroundColor: 'transparent',
        borderColor: 'var(--theme-secondary)',
        color: 'var(--theme-secondary)',
        fontFamily: 'var(--theme-font-body)',
        border: '2px solid var(--theme-secondary)'
      }

    case 'accent':
      return {
        backgroundColor: 'var(--theme-accent)',
        color: 'rgb(255, 255, 255)',
        fontFamily: 'var(--theme-font-body)',
        border: 'none'
      }

    default:
      // Fallback to primary
      return {
        backgroundColor: 'var(--theme-primary)',
        color: 'rgb(255, 255, 255)',
        fontFamily: 'var(--theme-font-body)',
        border: 'none'
      }
  }
}

/**
 * Get button className based on variant and context
 * Used for hover states and transitions
 *
 * @param variant - The button style variant
 * @param isPrimaryBackground - Whether the section has a primary background color
 * @returns Tailwind CSS class string
 */
export function getButtonClassName(
  variant: ButtonStyleVariant,
  isPrimaryBackground: boolean = false
): string {
  const baseClasses = 'group relative inline-block px-8 py-4 rounded-lg font-semibold transition-all duration-200'

  // Special case: primary background context
  if (isPrimaryBackground) {
    if (variant === 'primary') {
      return `${baseClasses} hover:bg-gray-100`
    }
    if (variant === 'secondary') {
      return `${baseClasses} border-2 hover:bg-white hover:text-theme-primary`
    }
    if (variant === 'accent') {
      return `${baseClasses} hover:opacity-90`
    }
  }

  // Standard hover states
  switch (variant) {
    case 'primary':
      return `${baseClasses} hover:opacity-90`

    case 'secondary':
      return `${baseClasses} border-2 hover:bg-theme-secondary hover:text-white`

    case 'accent':
      return `${baseClasses} hover:opacity-90`

    default:
      return `${baseClasses} hover:opacity-90`
  }
}

/**
 * Get button style description for UI display
 */
export function getButtonStyleDescription(variant: ButtonStyleVariant): string {
  switch (variant) {
    case 'primary':
      return 'Solid background with primary color'
    case 'secondary':
      return 'Outlined border with secondary color'
    case 'accent':
      return 'Solid background with accent color'
    default:
      return 'Default button style'
  }
}
