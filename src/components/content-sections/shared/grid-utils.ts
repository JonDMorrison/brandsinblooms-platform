/**
 * Grid utility functions for responsive layout classes
 */

/**
 * Get responsive grid classes for feature grids
 */
export const getFeatureGridClasses = (featureCount: number): string => {
  if (featureCount === 1) {
    return 'grid-cols-1'
  } else if (featureCount === 2) {
    return 'grid-cols-2'
  } else if (featureCount === 3) {
    return 'grid-cols-2 md:grid-cols-3'
  } else {
    return 'grid-cols-2 md:grid-cols-4'
  }
}

/**
 * Get responsive grid classes for product grids (matches HomePage.tsx)
 */
export const getProductGridClasses = (productCount: number): string => {
  if (productCount === 1) {
    return 'grid-cols-1'
  } else if (productCount === 2) {
    return 'grid-cols-1 sm:grid-cols-2'
  } else if (productCount === 3) {
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
  } else {
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }
}