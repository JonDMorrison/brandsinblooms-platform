/**
 * Plant Shop Theme-Aware View Components
 * These components render plant content sections with full theme integration
 */

export { PlantShowcaseView } from './PlantShowcaseView'
export { PlantGridView } from './PlantGridView'
export { PlantCareGuideView } from './PlantCareGuideView'
export { PlantCategoriesView } from './PlantCategoriesView'

// Additional view components for other plant block types
// These would be implemented based on the specific requirements of each block type

/**
 * Plant Block Type to View Component Mapping
 */
export const PLANT_VIEW_COMPONENTS = {
  plant_showcase: 'PlantShowcaseView',
  plant_grid: 'PlantGridView', 
  plant_care_guide: 'PlantCareGuideView',
  plant_categories: 'PlantCategoriesView',
  // Note: Other components would be added here as they're implemented
  // seasonal_tips: 'SeasonalTipsView',
  // growing_conditions: 'GrowingConditionsView',
  // plant_comparison: 'PlantComparisonView',
  // care_calendar: 'CareCalendarView',
  // plant_benefits: 'PlantBenefitsView',
  // soil_guide: 'SoilGuideView'
} as const

export type PlantViewComponentType = keyof typeof PLANT_VIEW_COMPONENTS