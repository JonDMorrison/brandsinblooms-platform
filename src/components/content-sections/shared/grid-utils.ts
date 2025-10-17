/**
 * Grid utility functions for responsive layout classes
 * Supports both media queries (for live sites) and container queries (for preview mode)
 */

/**
 * Get responsive grid classes for feature grids
 */
export const getFeatureGridClasses = (featureCount: number, isPreviewMode: boolean = false): string => {
  if (featureCount === 1) {
    return 'grid-cols-1'
  } else if (featureCount === 2) {
    return 'grid-cols-2'
  } else if (featureCount === 3) {
    return isPreviewMode ? 'grid-cols-2 @md:grid-cols-3' : 'grid-cols-2 md:grid-cols-3'
  } else {
    return isPreviewMode ? 'grid-cols-2 @5xl:grid-cols-4' : 'grid-cols-2 lg:grid-cols-4'
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
 * Get responsive grid classes for category grids
 * Adapts to container width using container queries in preview mode
 *
 * Container query breakpoints differ from media queries:
 * - @md (448px) vs md: (768px)
 * - @lg (512px) vs lg: (1024px)
 * - @5xl (1024px) matches lg: (1024px) for desktop layouts
 */
export const getCategoriesGridClasses = (categoryCount: number, isPreviewMode: boolean = false): string => {
  const desktopBreakpoint = isPreviewMode ? '@5xl' : 'lg'
  const tabletBreakpoint = isPreviewMode ? '@md' : 'md'

  if (categoryCount === 1) return 'grid-cols-1'
  if (categoryCount === 2) return `grid-cols-1 ${tabletBreakpoint}:grid-cols-2`
  if (categoryCount === 3) return `grid-cols-1 ${tabletBreakpoint}:grid-cols-2 ${desktopBreakpoint}:grid-cols-3`
  // 4 categories: 1 column mobile, 2 columns tablet, 4 columns desktop
  return `grid-cols-1 ${tabletBreakpoint}:grid-cols-2 ${desktopBreakpoint}:grid-cols-4`
}

/**
 * Legacy versions for backward compatibility (deprecated)
 * @deprecated Use the version with isPreviewMode parameter instead
 */
export const getFeatureGridClassesLegacy = (featureCount: number): string => getFeatureGridClasses(featureCount, false)
export const getProductGridClassesLegacy = (productCount: number): string => getProductGridClasses(productCount, false)