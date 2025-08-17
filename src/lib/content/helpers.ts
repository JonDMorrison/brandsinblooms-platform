/**
 * Content utility functions for common operations
 * Provides helper functions for content manipulation, validation, and processing
 */

import { 
  PageContent, 
  ContentSection, 
  ContentItem, 
  LayoutType,
  ContentSectionType,
  LAYOUT_SECTIONS
} from './schema'
import { 
  ValidationHelpers,
  ValidatedContentSection,
  ValidatedPageContent
} from './validation'
import { 
  TypedContent,
  ContentMetadata,
  ContentSectionChange,
  SectionOperation
} from './types'

/**
 * Check if content is empty (no meaningful content in any section)
 */
export function isEmpty(content: PageContent): boolean {
  const visibleSections = getVisibleSections(content)
  
  return visibleSections.every(section => {
    switch (section.type) {
      case 'text':
      case 'richText':
        return !section.data.content || section.data.content.trim().length === 0
      
      case 'image':
        return !section.data.url
      
      case 'icon':
        return !section.data.icon
      
      case 'gallery':
      case 'features':
      case 'testimonials':
      case 'team':
      case 'pricing':
      case 'specifications':
        return !section.data.items || (Array.isArray(section.data.items) && section.data.items.length === 0)
      
      case 'form':
        return !section.data.fields || (Array.isArray(section.data.fields) && section.data.fields.length === 0)
      
      default:
        return true
    }
  })
}

/**
 * Get all visible sections from content
 */
export function getVisibleSections(content: PageContent): ContentSection[] {
  return Object.values(content.sections).filter(section => section.visible)
}

/**
 * Get sections by type
 */
export function getSectionsByType(
  content: PageContent, 
  type: ContentSectionType
): ContentSection[] {
  return Object.values(content.sections).filter(section => section.type === type)
}

/**
 * Find section by key
 */
export function findSection(
  content: PageContent, 
  sectionKey: string
): ContentSection | undefined {
  return content.sections[sectionKey]
}

/**
 * Update a specific section in content
 */
export function updateSection(
  content: PageContent,
  sectionKey: string,
  updates: Partial<ContentSection>
): PageContent {
  const currentSection = content.sections[sectionKey]
  if (!currentSection) {
    throw new Error(`Section '${sectionKey}' not found`)
  }

  const updatedSection: ContentSection = {
    ...currentSection,
    ...updates,
    data: {
      ...currentSection.data,
      ...updates.data
    }
  }

  // Auto-update visibility if content changed
  if (updates.data) {
    updatedSection.visible = ValidationHelpers.validateSectionVisibility(updatedSection)
  }

  return {
    ...content,
    sections: {
      ...content.sections,
      [sectionKey]: updatedSection
    }
  }
}

/**
 * Add a new section to content
 */
export function addSection(
  content: PageContent,
  sectionKey: string,
  section: ContentSection
): PageContent {
  if (content.sections[sectionKey]) {
    throw new Error(`Section '${sectionKey}' already exists`)
  }

  // Auto-set order if not provided
  if (section.order === undefined) {
    const maxOrder = Math.max(
      0,
      ...Object.values(content.sections).map(s => s.order || 0)
    )
    section.order = maxOrder + 1
  }

  return {
    ...content,
    sections: {
      ...content.sections,
      [sectionKey]: section
    }
  }
}

/**
 * Remove a section from content
 */
export function removeSection(
  content: PageContent,
  sectionKey: string
): PageContent {
  const { [sectionKey]: removed, ...remainingSections } = content.sections
  
  if (!removed) {
    throw new Error(`Section '${sectionKey}' not found`)
  }

  return {
    ...content,
    sections: remainingSections
  }
}

/**
 * Reorder sections by updating their order property
 */
export function reorderSections(
  content: PageContent,
  newOrder: Array<{ key: string; order: number }>
): PageContent {
  const updatedSections = { ...content.sections }

  newOrder.forEach(({ key, order }) => {
    if (updatedSections[key]) {
      updatedSections[key] = {
        ...updatedSections[key],
        order
      }
    }
  })

  return {
    ...content,
    sections: updatedSections
  }
}

/**
 * Get sections ordered by their order property
 */
export function getOrderedSections(content: PageContent): Array<{
  key: string
  section: ContentSection
}> {
  return Object.entries(content.sections)
    .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
    .map(([key, section]) => ({ key, section }))
}

/**
 * Validate content against layout requirements
 */
export function validateContentForLayout(content: PageContent): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Check layout-specific requirements
    ValidationHelpers.validateLayoutSections(content.layout, content.sections)
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Layout validation failed')
  }

  // Check for empty required sections
  const layoutConfig = LAYOUT_SECTIONS[content.layout]
  if (layoutConfig) {
    layoutConfig.required.forEach(sectionKey => {
      const section = content.sections[sectionKey]
      if (section && section.visible) {
        const hasContent = !isSectionEmpty(section)
        if (!hasContent) {
          warnings.push(`Required section '${sectionKey}' appears to be empty`)
        }
      }
    })
  }

  // Check for orphaned sections (sections with no content and not visible)
  Object.entries(content.sections).forEach(([key, section]) => {
    if (!section.visible && isSectionEmpty(section)) {
      warnings.push(`Section '${key}' is hidden and empty - consider removing it`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Check if a specific section is empty
 */
export function isSectionEmpty(section: ContentSection): boolean {
  switch (section.type) {
    case 'text':
    case 'richText':
      return !section.data.content || section.data.content.trim().length === 0
    
    case 'image':
      return !section.data.url
    
    case 'icon':
      return !section.data.icon
    
    case 'gallery':
    case 'features':
    case 'testimonials':
    case 'team':
    case 'pricing':
    case 'specifications':
      return !section.data.items || (Array.isArray(section.data.items) && section.data.items.length === 0)
    
    case 'form':
      return !section.data.fields || (Array.isArray(section.data.fields) && section.data.fields.length === 0)
    
    default:
      return true
  }
}

/**
 * Generate a unique section key
 */
export function generateSectionKey(
  content: PageContent,
  prefix: string = 'section'
): string {
  let counter = 1
  let key = `${prefix}_${counter}`
  
  while (content.sections[key]) {
    counter++
    key = `${prefix}_${counter}`
  }
  
  return key
}

/**
 * Clone content structure (deep copy)
 */
export function cloneContent(content: PageContent): PageContent {
  return JSON.parse(JSON.stringify(content))
}

/**
 * Merge content settings
 */
export function mergeContentSettings(
  content: PageContent,
  newSettings: Partial<PageContent['settings']>
): PageContent {
  return {
    ...content,
    settings: {
      ...content.settings,
      ...newSettings
    }
  }
}

/**
 * Extract plain text content from all sections
 */
export function extractPlainText(content: PageContent): string {
  const textParts: string[] = []

  Object.values(content.sections).forEach(section => {
    if (section.visible) {
      switch (section.type) {
        case 'text':
        case 'richText':
          if (section.data.content) {
            // Strip HTML tags for plain text
            const plainText = section.data.content.replace(/<[^>]*>/g, '').trim()
            if (plainText) {
              textParts.push(plainText)
            }
          }
          break
        
        case 'features':
        case 'testimonials':
        case 'team':
          if (section.data.items && Array.isArray(section.data.items)) {
            section.data.items.forEach((item: any) => {
              if (item.title) textParts.push(item.title)
              if (item.subtitle) textParts.push(item.subtitle)
              if (item.content) textParts.push(item.content.replace(/<[^>]*>/g, '').trim())
            })
          }
          break
      }
    }
  })

  return textParts.join(' ')
}

/**
 * Generate SEO-friendly excerpt from content
 */
export function generateExcerpt(
  content: PageContent,
  maxLength: number = 160
): string {
  const plainText = extractPlainText(content)
  
  if (plainText.length <= maxLength) {
    return plainText
  }
  
  // Truncate at word boundary
  const truncated = plainText.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...'
  }
  
  return truncated + '...'
}

/**
 * Count words in content
 */
export function getWordCount(content: PageContent): number {
  const plainText = extractPlainText(content)
  return plainText.split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Estimate reading time (assumes 200 words per minute)
 */
export function getReadingTime(content: PageContent): number {
  const wordCount = getWordCount(content)
  return Math.ceil(wordCount / 200)
}

/**
 * Create a content change record
 */
export function createContentChange(
  operation: SectionOperation,
  sectionKey: string,
  section?: Partial<ContentSection>,
  previousSection?: ContentSection,
  newOrder?: number
): ContentSectionChange {
  return {
    operation,
    sectionKey,
    section,
    previousSection,
    newOrder,
    timestamp: new Date().toISOString()
  }
}

/**
 * Apply multiple section updates atomically
 */
export function applySectionUpdates(
  content: PageContent,
  updates: Array<{
    operation: 'update' | 'add' | 'remove'
    sectionKey: string
    section?: ContentSection
  }>
): PageContent {
  let updatedContent = cloneContent(content)

  updates.forEach(({ operation, sectionKey, section }) => {
    switch (operation) {
      case 'update':
        if (section) {
          updatedContent = updateSection(updatedContent, sectionKey, section)
        }
        break
      
      case 'add':
        if (section) {
          updatedContent = addSection(updatedContent, sectionKey, section)
        }
        break
      
      case 'remove':
        updatedContent = removeSection(updatedContent, sectionKey)
        break
    }
  })

  return updatedContent
}

/**
 * Get content statistics
 */
export function getContentStats(content: PageContent): {
  totalSections: number
  visibleSections: number
  hiddenSections: number
  emptySections: number
  wordCount: number
  readingTime: number
  sectionsByType: Record<ContentSectionType, number>
} {
  const sections = Object.values(content.sections)
  const visibleSections = sections.filter(s => s.visible)
  const hiddenSections = sections.filter(s => !s.visible)
  const emptySections = sections.filter(s => isSectionEmpty(s))
  
  const sectionsByType = sections.reduce((acc, section) => {
    acc[section.type] = (acc[section.type] || 0) + 1
    return acc
  }, {} as Record<ContentSectionType, number>)

  return {
    totalSections: sections.length,
    visibleSections: visibleSections.length,
    hiddenSections: hiddenSections.length,
    emptySections: emptySections.length,
    wordCount: getWordCount(content),
    readingTime: getReadingTime(content),
    sectionsByType
  }
}

/**
 * Generate content preview data for cards/lists
 */
export function generateContentPreview(content: PageContent): {
  title?: string
  excerpt: string
  featuredImage?: string
  sectionCount: number
  lastModified?: string
} {
  // Try to find title from hero section
  const heroSection = Object.values(content.sections).find(
    s => s.type === 'hero' && s.visible
  )
  
  let title: string | undefined
  if (heroSection?.data.content) {
    // Extract title from HTML content
    const titleMatch = heroSection.data.content.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i)
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]*>/g, '').trim()
    }
  }

  // Find featured image
  const imageSection = Object.values(content.sections).find(
    s => (s.type === 'image' || s.type === 'hero') && s.visible && s.data.url
  )
  
  const featuredImage = imageSection?.data.url

  return {
    title,
    excerpt: generateExcerpt(content, 120),
    featuredImage,
    sectionCount: getVisibleSections(content).length,
    lastModified: new Date().toISOString()
  }
}

/**
 * Content comparison utilities
 */
export function compareContent(
  contentA: PageContent,
  contentB: PageContent
): {
  isDifferent: boolean
  changes: Array<{
    type: 'added' | 'removed' | 'modified'
    sectionKey: string
    details?: string
  }>
} {
  const changes: Array<{
    type: 'added' | 'removed' | 'modified'
    sectionKey: string
    details?: string
  }> = []

  const keysA = new Set(Object.keys(contentA.sections))
  const keysB = new Set(Object.keys(contentB.sections))

  // Find added sections
  keysB.forEach(key => {
    if (!keysA.has(key)) {
      changes.push({ type: 'added', sectionKey: key })
    }
  })

  // Find removed sections
  keysA.forEach(key => {
    if (!keysB.has(key)) {
      changes.push({ type: 'removed', sectionKey: key })
    }
  })

  // Find modified sections
  keysA.forEach(key => {
    if (keysB.has(key)) {
      const sectionA = contentA.sections[key]
      const sectionB = contentB.sections[key]
      
      if (JSON.stringify(sectionA) !== JSON.stringify(sectionB)) {
        changes.push({ 
          type: 'modified', 
          sectionKey: key,
          details: `Type: ${sectionA.type}, Visible: ${sectionA.visible} -> ${sectionB.visible}`
        })
      }
    }
  })

  return {
    isDifferent: changes.length > 0,
    changes
  }
}