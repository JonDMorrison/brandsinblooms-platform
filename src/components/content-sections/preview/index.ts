/**
 * Plant Shop Preview Components
 * WYSIWYG preview system with theme integration and responsive modes
 */

export { PlantShopPreview, useResponsivePlantGrid, usePreviewThemeInjection } from './PlantShopPreview'

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