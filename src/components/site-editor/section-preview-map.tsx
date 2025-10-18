/**
 * Maps section types to their preview components with inline editing
 * Used by EditableCustomerSiteSection to render editable sections in edit mode
 */

import { HeroPreview } from '@/src/components/content-sections/preview/HeroPreview'
import { HeaderPreview } from '@/src/components/content-sections/preview/HeaderPreview'
import { FeaturedPreview } from '@/src/components/content-sections/preview/FeaturedPreview'
import { CategoriesPreview } from '@/src/components/content-sections/preview/CategoriesPreview'
import { FeaturesPreview } from '@/src/components/content-sections/preview/FeaturesPreview'
import { CtaPreview } from '@/src/components/content-sections/preview/CtaPreview'
import { ValuesPreview } from '@/src/components/content-sections/preview/ValuesPreview'
import { FAQPreview } from '@/src/components/content-sections/preview/FAQPreview'
import { TextPreview } from '@/src/components/content-sections/preview/TextPreview'
import { BusinessInfoPreview } from '@/src/components/content-sections/preview/BusinessInfoPreview'
import { ComponentType } from 'react'

interface PreviewComponentProps {
  section: any
  sectionKey: string
  className?: string
  title?: string
  siteId?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, field: string, newContent: string) => void
  [key: string]: any
}

/**
 * Map of section types to their preview components
 * Add new section types here as they are created
 */
export const sectionPreviewMap: Record<string, ComponentType<PreviewComponentProps>> = {
  hero: HeroPreview,
  header: HeaderPreview,
  featured: FeaturedPreview,
  categories: CategoriesPreview,
  features: FeaturesPreview,
  cta: CtaPreview,
  mission: TextPreview, // mission sections use TextPreview
  values: ValuesPreview,
  team: ValuesPreview, // team sections can use ValuesPreview format
  faq: FAQPreview,
  richText: TextPreview, // richText sections use TextPreview
  businessInfo: BusinessInfoPreview
}

/**
 * Check if a section type has a preview component
 */
export function hasPreviewComponent(sectionType: string): boolean {
  return sectionType in sectionPreviewMap
}

/**
 * Get preview component for a section type
 */
export function getPreviewComponent(sectionType: string): ComponentType<PreviewComponentProps> | null {
  return sectionPreviewMap[sectionType] || null
}
