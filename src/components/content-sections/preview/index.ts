/**
 * Content Section Preview Components
 * WYSIWYG preview system with theme integration and responsive modes
 */

export { PlantShopPreview, useResponsivePlantGrid, usePreviewThemeInjection } from './PlantShopPreview'

// Core section preview components
export { HeroPreview } from './HeroPreview'
export { FeaturedPreview } from './FeaturedPreview'
export { CategoriesPreview } from './CategoriesPreview'
export { FeaturesPreview } from './FeaturesPreview'
export { CtaPreview } from './CtaPreview'
export { TextPreview } from './TextPreview'
export { DefaultPreview } from './DefaultPreview'

// Additional preview components can be added here following the same pattern:
// export { TestimonialsPreview } from './TestimonialsPreview'
// export { GalleryPreview } from './GalleryPreview'
// export { TeamPreview } from './TeamPreview'
// export { PricingPreview } from './PricingPreview'
// export { ImagePreview } from './ImagePreview'
// export { FormPreview } from './FormPreview'

/**
 * Preview Component Registry
 * Maps content section types to their preview components
 */
export const PLANT_PREVIEW_COMPONENTS = {
  plant_showcase: 'PlantShopPreview',
  plant_grid: 'PlantShopPreview',
  plant_care_guide: 'PlantShopPreview',
  plant_categories: 'PlantShopPreview',
  seasonal_tips: 'PlantShopPreview',
  growing_conditions: 'PlantShopPreview',
  plant_comparison: 'PlantShopPreview',
  care_calendar: 'PlantShopPreview',
  plant_benefits: 'PlantShopPreview',
  soil_guide: 'PlantShopPreview'
} as const

export type PlantPreviewComponentType = keyof typeof PLANT_PREVIEW_COMPONENTS