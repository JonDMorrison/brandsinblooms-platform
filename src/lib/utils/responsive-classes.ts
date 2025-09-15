/**
 * Responsive class utilities for container query-based responsive design
 *
 * This utility helps manage dual responsive behavior:
 * - Container queries (@md:, @lg:) for preview mode in the visual editor
 * - Media queries (md:, lg:) for live sites and the rest of the application
 */

export type ResponsiveBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * Convert media query responsive classes to container query equivalents
 * Only converts when in preview mode (when onContentUpdate callback is present)
 */
export function getResponsiveClasses(
  baseClasses: string,
  isPreviewMode: boolean = false
): string {
  if (!isPreviewMode) {
    return baseClasses
  }

  // Convert common responsive prefixes to container query equivalents
  return baseClasses
    .replace(/\bsm:/g, '@sm:')
    .replace(/\bmd:/g, '@md:')
    .replace(/\blg:/g, '@lg:')
    .replace(/\bxl:/g, '@xl:')
    .replace(/\b2xl:/g, '@2xl:')
}

/**
 * Generate responsive classes for typography
 * Provides either media query or container query versions, not both
 */
export function getResponsiveTypographyClasses(
  isPreviewMode: boolean = false
): {
  heroHeadline: string
  heroSubheadline: string
  sectionHeading: string
  cardTitle: string
  bodyText: string
} {
  if (!isPreviewMode) {
    // Use exact same classes as customer site
    return {
      heroHeadline: 'text-4xl md:text-6xl font-bold',
      heroSubheadline: 'text-xl md:text-2xl',
      sectionHeading: 'text-3xl md:text-4xl font-bold',
      cardTitle: 'text-lg md:text-xl font-semibold',
      bodyText: 'text-base md:text-lg'
    }
  }

  // Container query versions - replace media queries completely
  return {
    heroHeadline: 'text-4xl @md:text-6xl font-bold',
    heroSubheadline: 'text-xl @md:text-2xl',
    sectionHeading: 'text-3xl @md:text-4xl font-bold',
    cardTitle: 'text-lg @md:text-xl font-semibold',
    bodyText: 'text-base @md:text-lg'
  }
}

/**
 * Generate responsive classes for spacing
 * Provides either media query or container query versions, not both
 */
export function getResponsiveSpacingClasses(
  isPreviewMode: boolean = false
): {
  sectionPadding: string
  heroSectionPadding: string
  containerPadding: string
  gridGap: string
} {
  if (!isPreviewMode) {
    // Use exact same classes as customer site
    return {
      sectionPadding: 'py-16',
      heroSectionPadding: 'py-20 lg:py-32',
      containerPadding: 'px-4 md:px-6 lg:px-8',
      gridGap: 'gap-6'
    }
  }

  // Container query versions - replace media queries completely
  return {
    sectionPadding: 'py-16',
    heroSectionPadding: 'py-20 @lg:py-32',
    containerPadding: 'px-4 @md:px-6 @lg:px-8',
    gridGap: 'gap-6'
  }
}

/**
 * Generate responsive classes for grid layouts
 * Provides either media query or container query versions, not both
 */
export function getResponsiveGridClasses(
  isPreviewMode: boolean = false
): {
  featuresGrid: string
  cardsGrid: string
  testimonialsGrid: string
  galleryGrid: string
} {
  if (!isPreviewMode) {
    // Use exact same classes as customer site
    return {
      featuresGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      cardsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      testimonialsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      galleryGrid: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    }
  }

  // Container query versions - replace media queries completely
  // Note: @lg = 512px, @xl = 576px, @2xl = 672px, @3xl = 768px, @4xl = 896px, @5xl = 1024px
  // Use @5xl (1024px) to match lg: media query behavior for 4-column layouts
  return {
    featuresGrid: 'grid grid-cols-1 @md:grid-cols-2 @5xl:grid-cols-3',
    cardsGrid: 'grid grid-cols-1 @md:grid-cols-2 @5xl:grid-cols-4',
    testimonialsGrid: 'grid grid-cols-1 @md:grid-cols-2 @5xl:grid-cols-3',
    galleryGrid: 'grid grid-cols-2 @md:grid-cols-3 @5xl:grid-cols-4'
  }
}

/**
 * Generate responsive flexbox classes
 * Provides either media query or container query versions, not both
 */
export function getResponsiveFlexClasses(
  isPreviewMode: boolean = false
): {
  heroLayout: string
  featureLayout: string
  cardLayout: string
} {
  if (!isPreviewMode) {
    // Use exact same classes as customer site
    return {
      heroLayout: 'flex flex-col sm:flex-row',
      featureLayout: 'flex flex-col sm:flex-row items-center',
      cardLayout: 'flex flex-col items-center text-center'
    }
  }

  // Container query versions - replace media queries completely
  // Note: Container queries use rem units:
  // @sm = 384px, @md = 448px, @lg = 512px, @xl = 576px, @2xl = 672px
  // Mobile (390px) should stay stacked, so use @xl (576px) to match sm: (640px) behavior
  return {
    heroLayout: 'flex flex-col @xl:flex-row',
    featureLayout: 'flex flex-col @xl:flex-row items-center',
    cardLayout: 'flex flex-col items-center text-center'
  }
}

/**
 * Detect if we're in preview mode based on the presence of content update callbacks
 */
export function isPreviewMode(
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void,
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
): boolean {
  return Boolean(onContentUpdate || onFeatureUpdate)
}

/**
 * Helper function to combine classes with proper spacing
 */
export function combineClasses(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Create a comprehensive responsive class helper that can be used throughout preview components
 */
export function createResponsiveClassHelper(isPreview: boolean = false) {
  return {
    typography: getResponsiveTypographyClasses(isPreview),
    spacing: getResponsiveSpacingClasses(isPreview),
    grid: getResponsiveGridClasses(isPreview),
    flex: getResponsiveFlexClasses(isPreview),
    custom: (classes: string) => getResponsiveClasses(classes, isPreview)
  }
}