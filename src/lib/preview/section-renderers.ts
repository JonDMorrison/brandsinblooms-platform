/**
 * Section-specific rendering logic and utilities
 * Provides helper functions for consistent section rendering across preview components
 */

import { ContentSection, ContentItem, LayoutType, LAYOUT_SECTIONS } from '@/src/lib/content/schema'

/**
 * Get sections for a specific layout, sorted by order
 */
export function getLayoutSections(
  content: Record<string, ContentSection>,
  layout: LayoutType
): Array<{ key: string; section: ContentSection }> {
  const layoutConfig = LAYOUT_SECTIONS[layout]
  const allSectionKeys = [...layoutConfig.required, ...layoutConfig.optional]
  
  const sections = allSectionKeys
    .map(key => ({ key, section: content[key] }))
    .filter(({ section }) => section && section.visible)
    .sort((a, b) => (a.section.order || 0) - (b.section.order || 0))
  
  return sections
}

/**
 * Get the primary hero/header section for a layout
 */
export function getHeroSection(
  content: Record<string, ContentSection>,
  layout: LayoutType
): { key: string; section: ContentSection } | null {
  const layoutConfig = LAYOUT_SECTIONS[layout]
  
  // Look for the first required section (usually hero/header)
  for (const key of layoutConfig.required) {
    const section = content[key]
    if (section && section.visible && (section.type === 'hero' || key === 'header')) {
      return { key, section }
    }
  }
  
  return null
}

/**
 * Get non-hero sections for a layout
 */
export function getContentSections(
  content: Record<string, ContentSection>,
  layout: LayoutType
): Array<{ key: string; section: ContentSection }> {
  const allSections = getLayoutSections(content, layout)
  const heroSection = getHeroSection(content, layout)
  
  return allSections.filter(({ key }) => key !== heroSection?.key)
}

/**
 * Extract plain text content from a section for fallback purposes
 */
export function extractSectionText(section: ContentSection): string {
  if (!section.data.content) return ''
  
  // Remove HTML tags and get plain text
  return section.data.content.replace(/<[^>]*>/g, '').trim()
}

/**
 * Get the first item from a section's items array
 */
export function getFirstItem(section: ContentSection): ContentItem | null {
  if (!section.data.items || !Array.isArray(section.data.items) || section.data.items.length === 0) {
    return null
  }
  
  const firstItem = section.data.items[0]
  if (typeof firstItem === 'object' && firstItem !== null && 'id' in firstItem) {
    return firstItem as unknown as ContentItem
  }
  
  return null
}

/**
 * Check if a section has meaningful content
 */
export function hasContent(section: ContentSection): boolean {
  if (!section.visible) return false
  
  const { data } = section
  
  // Check for text content
  if (data.content && data.content.trim() !== '') {
    const plainText = data.content.replace(/<[^>]*>/g, '').trim()
    if (plainText.length > 0) return true
  }
  
  // Check for items
  if (data.items && Array.isArray(data.items) && data.items.length > 0) {
    return true
  }
  
  // Check for media
  if (data.url || data.icon) {
    return true
  }
  
  // Check for form fields
  if (data.fields && Array.isArray(data.fields) && data.fields.length > 0) {
    return true
  }
  
  return false
}

/**
 * Get grid column classes based on column count
 */
export function getGridColumns(columns: number = 3): string {
  const maxCols = Math.min(columns, 4) // Max 4 columns for responsive design
  
  let classes = 'grid gap-4 grid-cols-1'
  
  if (maxCols >= 2) {
    classes += ' sm:grid-cols-2'
  }
  
  if (maxCols >= 3) {
    classes += ' lg:grid-cols-3'
  }
  
  if (maxCols >= 4) {
    classes += ' xl:grid-cols-4'
  }
  
  return classes
}

/**
 * Get spacing classes based on spacing setting
 */
export function getSpacingClass(spacing: 'tight' | 'normal' | 'loose' = 'normal'): string {
  switch (spacing) {
    case 'tight':
      return 'space-y-4'
    case 'loose':
      return 'space-y-12'
    default:
      return 'space-y-8'
  }
}

/**
 * Get alignment classes based on alignment setting
 */
export function getAlignmentClass(alignment: 'left' | 'center' | 'right' = 'left'): string {
  switch (alignment) {
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    default:
      return 'text-left'
  }
}

/**
 * Create a fallback section with default content
 */
export function createFallbackSection(
  type: string,
  title: string,
  subtitle?: string
): ContentSection {
  return {
    type: type as any,
    data: {
      content: title,
      items: subtitle ? [{
        id: 'fallback',
        title: title,
        subtitle: subtitle,
        content: '',
        order: 1
      }] : []
    },
    visible: true,
    order: 1
  }
}

/**
 * Layout-specific section mappings for backward compatibility
 */
export const LAYOUT_SECTION_MAPPING: Record<LayoutType, {
  title: string
  subtitle: string
  primaryAction?: string
  secondaryAction?: string
}> = {
  landing: {
    title: 'hero',
    subtitle: 'hero',
    primaryAction: 'cta',
    secondaryAction: 'features'
  },
  blog: {
    title: 'header',
    subtitle: 'header'
  },
  portfolio: {
    title: 'header',
    subtitle: 'header'
  },
  about: {
    title: 'hero',
    subtitle: 'hero'
  },
  product: {
    title: 'header',
    subtitle: 'header'
  },
  contact: {
    title: 'header',
    subtitle: 'header'
  }
}

/**
 * Convert legacy content to enhanced content structure
 */
export function convertLegacyContent(
  layout: LayoutType,
  title?: string,
  subtitle?: string
): Record<string, ContentSection> {
  const layoutConfig = LAYOUT_SECTIONS[layout]
  const sections: Record<string, ContentSection> = {}
  
  // Create default sections from schema
  Object.entries(layoutConfig.defaultSections).forEach(([key, defaultSection]) => {
    sections[key] = { ...defaultSection } as ContentSection
  })
  
  // Map legacy title/subtitle to the appropriate section
  const mapping = LAYOUT_SECTION_MAPPING[layout]
  
  if (title && mapping.title) {
    const titleSection = sections[mapping.title]
    if (titleSection) {
      // For hero sections, put title in content
      if (titleSection.type === 'hero') {
        titleSection.data.content = `<h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}`
      } else {
        titleSection.data.content = title
      }
      titleSection.visible = true
    }
  }
  
  return sections
}