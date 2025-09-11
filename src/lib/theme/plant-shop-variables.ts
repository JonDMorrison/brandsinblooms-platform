/**
 * Plant shop specific CSS custom properties and theme variable definitions
 * These variables extend the base theme system for plant-specific content blocks
 */

/**
 * Plant-specific color variables
 */
export const PLANT_COLOR_VARIABLES = {
  // Plant-specific colors
  '--plant-primary': 'var(--theme-primary)', // Inherits from base theme
  '--plant-secondary': 'var(--theme-secondary)',
  '--plant-accent': 'var(--theme-accent)',
  '--plant-green': '#10b981', // Default plant green
  '--plant-green-light': '#34d399',
  '--plant-green-dark': '#059669',
  '--plant-earth': '#8b5a3c', // Earthy brown for soil/pots
  '--plant-earth-light': '#a16655',
  '--plant-earth-dark': '#6b4423',
  
  // Care level indicator colors
  '--care-easy': '#10b981', // Green for easy care
  '--care-medium': '#f59e0b', // Orange for medium care
  '--care-challenging': '#ef4444', // Red for challenging care
  
  // Status and condition colors
  '--plant-healthy': '#10b981',
  '--plant-warning': '#f59e0b', 
  '--plant-danger': '#ef4444',
  '--plant-info': '#3b82f6',
  
  // Light requirement colors
  '--light-low': '#6b7280', // Gray for low light
  '--light-medium': '#f59e0b', // Orange for medium light
  '--light-bright': '#fbbf24', // Yellow for bright light
  '--light-direct': '#f97316', // Orange-red for direct sun
  
  // Water frequency colors
  '--water-weekly': '#3b82f6', // Blue for frequent watering
  '--water-biweekly': '#06b6d4', // Cyan for moderate watering
  '--water-monthly': '#8b5cf6', // Purple for infrequent watering
  '--water-seasonal': '#6b7280', // Gray for seasonal watering
  
  // Seasonal colors
  '--season-spring': '#10b981',
  '--season-summer': '#f59e0b',
  '--season-autumn': '#ea580c',
  '--season-winter': '#3b82f6'
} as const

/**
 * Plant grid and layout variables
 */
export const PLANT_LAYOUT_VARIABLES = {
  // Grid configurations
  '--plant-grid-columns-mobile': '1',
  '--plant-grid-columns-tablet': '2',
  '--plant-grid-columns-desktop': '3',
  '--plant-grid-gap': '1.5rem',
  '--plant-grid-gap-mobile': '1rem',
  
  // Card dimensions
  '--plant-card-padding': '1.5rem',
  '--plant-card-border-radius': '0.75rem',
  '--plant-card-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  '--plant-card-shadow-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  
  // Image aspect ratios
  '--plant-image-aspect-square': '1 / 1',
  '--plant-image-aspect-portrait': '3 / 4',
  '--plant-image-aspect-landscape': '4 / 3',
  '--plant-image-border-radius': '0.5rem',
  
  // Spacing for plant content
  '--plant-section-spacing': '3rem',
  '--plant-item-spacing': '1.5rem',
  '--plant-content-spacing': '1rem'
} as const

/**
 * Plant typography variables
 */
export const PLANT_TYPOGRAPHY_VARIABLES = {
  // Plant name typography
  '--plant-name-font-size': '1.25rem',
  '--plant-name-font-weight': '600',
  '--plant-name-line-height': '1.4',
  '--plant-name-color': 'var(--theme-text)',
  
  // Scientific name typography
  '--plant-scientific-font-size': '0.875rem',
  '--plant-scientific-font-weight': '400',
  '--plant-scientific-font-style': 'italic',
  '--plant-scientific-color': 'var(--theme-text)',
  '--plant-scientific-opacity': '0.7',
  
  // Care text typography
  '--plant-care-font-size': '0.875rem',
  '--plant-care-font-weight': '500',
  '--plant-care-line-height': '1.5',
  
  // Category header typography
  '--plant-category-font-size': '1.125rem',
  '--plant-category-font-weight': '600',
  '--plant-category-color': 'var(--plant-primary)',
  
  // Description text
  '--plant-description-font-size': '0.9rem',
  '--plant-description-line-height': '1.6',
  '--plant-description-color': 'var(--theme-text)',
  
  // Badge and label typography
  '--plant-badge-font-size': '0.75rem',
  '--plant-badge-font-weight': '500',
  '--plant-badge-letter-spacing': '0.025em'
} as const

/**
 * Plant component specific variables
 */
export const PLANT_COMPONENT_VARIABLES = {
  // Care badges
  '--care-badge-padding': '0.25rem 0.75rem',
  '--care-badge-border-radius': '9999px',
  '--care-badge-font-size': 'var(--plant-badge-font-size)',
  
  // Plant icons
  '--plant-icon-size': '1.25rem',
  '--plant-icon-size-small': '1rem',
  '--plant-icon-size-large': '1.5rem',
  
  // Progress bars (for care calendars)
  '--plant-progress-height': '0.5rem',
  '--plant-progress-border-radius': '0.25rem',
  '--plant-progress-background': '#e5e7eb',
  
  // Comparison tables
  '--plant-comparison-cell-padding': '0.75rem',
  '--plant-comparison-header-background': '#f9fafb',
  '--plant-comparison-border-color': '#e5e7eb',
  
  // Timeline elements (for care calendars)
  '--plant-timeline-line-width': '2px',
  '--plant-timeline-dot-size': '12px',
  '--plant-timeline-gap': '2rem'
} as const

/**
 * Responsive breakpoint variables for plant content
 */
export const PLANT_RESPONSIVE_VARIABLES = {
  '--plant-mobile-max': '640px',
  '--plant-tablet-max': '1024px',
  '--plant-desktop-min': '1025px'
} as const

/**
 * All plant shop variables combined
 */
export const ALL_PLANT_VARIABLES = {
  ...PLANT_COLOR_VARIABLES,
  ...PLANT_LAYOUT_VARIABLES,
  ...PLANT_TYPOGRAPHY_VARIABLES,
  ...PLANT_COMPONENT_VARIABLES,
  ...PLANT_RESPONSIVE_VARIABLES
} as const

/**
 * Plant shop theme presets
 */
export const PLANT_THEME_PRESETS = {
  greenhouse: {
    name: 'Greenhouse',
    description: 'Fresh green theme perfect for plant nurseries',
    colors: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#34d399',
      background: '#f0fdf4',
      text: '#1f2937'
    }
  },
  botanical: {
    name: 'Botanical',
    description: 'Natural earth tones with plant-inspired colors',
    colors: {
      primary: '#059669',
      secondary: '#8b5a3c',
      accent: '#f59e0b',
      background: '#fefffe',
      text: '#374151'
    }
  },
  tropical: {
    name: 'Tropical',
    description: 'Vibrant colors inspired by tropical plants',
    colors: {
      primary: '#10b981',
      secondary: '#f59e0b',
      accent: '#8b5cf6',
      background: '#f0fdfa',
      text: '#1f2937'
    }
  },
  minimal: {
    name: 'Minimal Plant',
    description: 'Clean, minimal design for modern plant shops',
    colors: {
      primary: '#374151',
      secondary: '#10b981',
      accent: '#6b7280',
      background: '#ffffff',
      text: '#1f2937'
    }
  }
} as const

/**
 * Generate CSS variables string for plant theme
 */
export function generatePlantThemeCSS(baseSelector: string): string {
  const variables = Object.entries(ALL_PLANT_VARIABLES)
    .map(([property, value]) => `    ${property}: ${value};`)
    .join('\n')
    
  return `
    ${baseSelector} {
${variables}
    }
  `
}

/**
 * Type for plant theme preset keys
 */
export type PlantThemePresetKey = keyof typeof PLANT_THEME_PRESETS

/**
 * Type for plant color variable keys
 */
export type PlantColorVariable = keyof typeof PLANT_COLOR_VARIABLES

/**
 * Type for plant layout variable keys
 */
export type PlantLayoutVariable = keyof typeof PLANT_LAYOUT_VARIABLES