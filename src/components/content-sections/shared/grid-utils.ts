/**
 * Grid utility functions for responsive layout classes
 * Supports both media queries (for live sites) and container queries (for preview mode)
 */

/**
 * Get responsive grid classes for feature grids
 */
export const getFeatureGridClasses = (featureCount: number, isPreviewMode: boolean = false): string => {
  const mediaPrefix = isPreviewMode ? '@' : ''

  if (featureCount === 1) {
    return 'grid-cols-1'
  } else if (featureCount === 2) {
    return 'grid-cols-2'
  } else if (featureCount === 3) {
    return `grid-cols-2 ${mediaPrefix}md:grid-cols-3`
  } else {
    return `grid-cols-2 ${mediaPrefix}md:grid-cols-2 ${mediaPrefix}lg:grid-cols-4`
  }
}

/**
 * Get responsive grid classes for product grids (matches HomePage.tsx)
 */
export const getProductGridClasses = (productCount: number, isPreviewMode: boolean = false): string => {
  const mediaPrefix = isPreviewMode ? '@' : ''

  if (productCount === 1) {
    return 'grid-cols-1'
  } else if (productCount === 2) {
    return `grid-cols-1 ${mediaPrefix}sm:grid-cols-2`
  } else if (productCount === 3) {
    return `grid-cols-1 ${mediaPrefix}sm:grid-cols-2 ${mediaPrefix}md:grid-cols-3`
  } else {
    return `grid-cols-1 ${mediaPrefix}md:grid-cols-2 ${mediaPrefix}lg:grid-cols-4`
  }
}

/**
 * Legacy versions for backward compatibility (deprecated)
 * @deprecated Use the version with isPreviewMode parameter instead
 */
export const getFeatureGridClassesLegacy = (featureCount: number): string => getFeatureGridClasses(featureCount, false)
export const getProductGridClassesLegacy = (productCount: number): string => getProductGridClasses(productCount, false)