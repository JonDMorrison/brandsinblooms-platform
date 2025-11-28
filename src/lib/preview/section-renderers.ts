/**
 * Section-specific rendering logic and utilities
 * Provides helper functions for consistent section rendering across preview components
 */

import { ContentSection, ContentItem, LayoutType, LAYOUT_SECTIONS } from '@/src/lib/content/schema'
import { createDefaultSection } from '@/src/lib/content/sections'

/**
 * Get sections for a specific layout
 */
export function getLayoutSections(
  sections: ContentSection[],
  layout: LayoutType
): Array<{ key: string; section: ContentSection }> {
  // Map sections to key/section pairs
  // Visibility is handled at render time by the component
  return sections.map(section => ({
    key: section.id,
    section
  }))
}

/**
 * Get the primary hero/header section for a layout
 */
export function getHeroSection(
  sections: ContentSection[],
  layout: LayoutType
): { key: string; section: ContentSection } | null {
  // Look for the first visible hero or header
  const section = sections.find(s => s.visible && (s.type === 'hero' || s.type === 'header' || s.type === 'blogHeader'))

  if (section) {
    return { key: section.id, section }
  }

  return null
}

/**
 * Get non-hero sections for a layout
 */
export function getContentSections(
  sections: ContentSection[],
  layout: LayoutType
): Array<{ key: string; section: ContentSection }> {
  const heroSection = getHeroSection(sections, layout)

  return sections
    .filter(s => s.id !== heroSection?.key)
    .map(s => ({ key: s.id, section: s }))
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
 * Note: Sections handle their own internal spacing, so inter-section spacing is minimal
 */
export function getSpacingClass(spacing: 'tight' | 'normal' | 'loose' = 'normal'): string {
  switch (spacing) {
    case 'tight':
      return 'space-y-0'
    case 'loose':
      return 'space-y-4'
    default:
      return 'space-y-0'
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
  // Use createDefaultSection if type matches, otherwise generic fallback
  try {
    const defaultSec = createDefaultSection(type as any)
    return {
      ...defaultSec,
      data: {
        ...defaultSec.data,
        headline: title,
        subheadline: subtitle,
        content: title
      }
    }
  } catch (e) {
    // Fallback if type not found
    return {
      id: `fallback-${Date.now()}`,
      type: 'text' as any,
      data: {
        content: `<h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ''}`
      },
      visible: true,
      settings: {}
    }
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
    title: 'blogHeader',
    subtitle: 'blogHeader'
  },
  portfolio: {
    title: 'hero',
    subtitle: 'hero'
  },
  about: {
    title: 'header',
    subtitle: 'header'
  },
  product: {
    title: 'hero',
    subtitle: 'hero'
  },
  contact: {
    title: 'header',
    subtitle: 'header'
  },
  other: {
    title: 'hero',
    subtitle: 'hero'
  },
  plant_shop: {
    title: 'hero',
    subtitle: 'hero'
  },
  plant_care: {
    title: 'hero',
    subtitle: 'hero'
  },
  plant_catalog: {
    title: 'hero',
    subtitle: 'hero'
  }
}

/**
 * Convert legacy content to enhanced content structure
 */
export function convertLegacyContent(
  layout: LayoutType,
  title?: string,
  subtitle?: string
): ContentSection[] {
  const layoutConfig = LAYOUT_SECTIONS[layout]

  // Create default sections from schema blueprints
  const sections: ContentSection[] = layoutConfig.initialSections.map(blueprint => {
    // Create a fresh section with ID
    const defaultSection = createDefaultSection(blueprint.type!)

    // Merge blueprint data/settings over default data
    return {
      ...defaultSection,
      ...blueprint,
      data: {
        ...defaultSection.data,
        ...blueprint.data
      },
      settings: {
        ...defaultSection.settings,
        ...blueprint.settings
      }
    }
  })

  // Map legacy title/subtitle to the appropriate section
  const mapping = LAYOUT_SECTION_MAPPING[layout]

  if (title && mapping.title) {
    const titleSection = sections.find(s => s.type === mapping.title) || sections.find(s => s.type === 'hero' || s.type === 'header')

    if (titleSection) {
      // For hero/header sections, put title in headline
      titleSection.data.headline = title
      if (subtitle) {
        titleSection.data.subheadline = subtitle
      }

      // Also update content for fallback
      if (titleSection.type === 'hero' || titleSection.type === 'header' || titleSection.type === 'blogHeader') {
        // Keep existing content if any, or set it
      } else {
        titleSection.data.content = title
      }

      titleSection.visible = true
    }
  }

  return sections
}