/**
 * Content update utilities for the visual editor
 * Handles various types of content updates and transformations
 */

import { PageContent } from '@/lib/content/schema'

/**
 * Feature item structure for hero and other sections
 * Supports both 'text' (for Hero) and 'title' (for Features) for compatibility
 */
export interface FeatureItem {
  id: string
  icon: string
  text: string
  title?: string  // Alias for compatibility with Features section
}

/**
 * Legacy feature type (backwards compatibility)
 */
export type LegacyFeature = string

/**
 * Union type for features (supports both legacy and modern)
 */
export type Feature = FeatureItem | LegacyFeature

/**
 * Helper to create section-based field path for content updates
 */
export function createSectionFieldPath(sectionKey: string, fieldPath: string): string {
  return `sections.${sectionKey}.${fieldPath}`
}

/**
 * Helper to update content using a field path string
 */
export function updateContentByPath(
  content: PageContent, 
  fieldPath: string, 
  newValue: string
): PageContent {
  const pathParts = fieldPath.split('.')
  const updatedContent = JSON.parse(JSON.stringify(content)) // Deep clone
  
  // Navigate to the target location and update
  let current: any = updatedContent
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i]
    if (!(part in current)) {
      current[part] = {}
    }
    current = current[part]
  }
  
  const finalKey = pathParts[pathParts.length - 1]
  current[finalKey] = newValue
  
  return updatedContent
}

/**
 * Helper to update feature arrays in sections
 * Supports both object-based features with fields (icon, text, title) and legacy string arrays
 * Auto-migrates legacy string features to object format when non-text fields are updated
 */
export function updateSectionFeature(
  content: PageContent,
  sectionKey: string,
  featureIndex: number,
  field: string,
  newContent: string
): PageContent {
  if (!content || !content.sections[sectionKey]) {
    return content
  }

  const section = content.sections[sectionKey]
  if (!section || !section.data.features || !Array.isArray(section.data.features)) {
    return content
  }

  // Create updated features array
  let updatedFeatures = [...section.data.features]
  const currentFeature = updatedFeatures[featureIndex]

  // Handle object-based features (with icon, text/title fields)
  if (currentFeature && typeof currentFeature === 'object') {
    // If updating text or title, update both to keep them in sync
    if (field === 'text' || field === 'title') {
      updatedFeatures[featureIndex] = {
        ...currentFeature,
        text: newContent,
        title: newContent
      }
    } else {
      updatedFeatures[featureIndex] = {
        ...currentFeature,
        [field]: newContent
      }
    }
  } else if (typeof currentFeature === 'string') {
    // Legacy string feature detected - migrate ALL features to prevent mixed arrays

    if (field === 'text' || field === 'title') {
      // Text/title update on legacy array - keep as string
      updatedFeatures[featureIndex] = newContent
    } else {
      // Non-text field update (icon, etc.) - migrate ENTIRE array to objects
      // This prevents mixed arrays where some items are strings and others are objects
      const migratedFeatures: FeatureItem[] = updatedFeatures.map((feat, idx) => {
        // If already an object, keep it as-is with both text and title
        if (typeof feat === 'object' && feat !== null) {
          const existingText = (feat as any).text || (feat as any).title || ''
          return {
            id: (feat as any).id || `feature-${idx}`,
            icon: (feat as any).icon || 'Check',
            text: existingText,
            title: existingText  // Create both properties for compatibility
          }
        }

        // Convert string to object with defaults, creating both text and title
        const featureText = String(feat)
        return {
          id: `feature-${idx}`,
          icon: 'Check',  // Default icon for non-updated features
          text: featureText,   // For Hero sections
          title: featureText   // For Features sections
        }
      })

      // Now update the specific feature with the new field value
      // If updating text or title, update both to keep them in sync
      if (field === 'text' || field === 'title') {
        migratedFeatures[featureIndex] = {
          ...migratedFeatures[featureIndex],
          text: newContent,
          title: newContent
        }
      } else {
        migratedFeatures[featureIndex] = {
          ...migratedFeatures[featureIndex],
          [field]: newContent
        }
      }

      // Cast back to the section's data type
      updatedFeatures = migratedFeatures as any
    }
  }

  // Create updated content with new features array
  return {
    ...content,
    sections: {
      ...content.sections,
      [sectionKey]: {
        ...section,
        data: {
          ...section.data,
          features: updatedFeatures
        }
      }
    }
  }
}

/**
 * Helper to update value item fields in sections
 */
export function updateSectionValue(
  content: PageContent,
  sectionKey: string,
  valueIndex: number,
  fieldPath: string,
  newContent: string
): PageContent {
  if (!content || !content.sections[sectionKey]) {
    return content
  }

  const section = content.sections[sectionKey]
  if (!section || !section.data.items || !Array.isArray(section.data.items)) {
    return content
  }

  // Create updated items array
  const updatedItems = [...section.data.items]
  if (updatedItems[valueIndex]) {
    updatedItems[valueIndex] = {
      ...updatedItems[valueIndex],
      [fieldPath]: newContent
    }
  }

  // Create updated content with new items array
  return {
    ...content,
    sections: {
      ...content.sections,
      [sectionKey]: {
        ...section,
        data: {
          ...section.data,
          items: updatedItems
        }
      }
    }
  }
}

/**
 * Type-safe content update factory
 */
export function createContentUpdateHandlers(
  content: PageContent,
  onContentChange: (content: PageContent) => void,
  updateContent: (fieldPath: string, newValue: string) => void
) {
  
  /**
   * Handle inline content updates from the visual editor
   */
  const handleInlineContentUpdate = (fieldPath: string, newContent: string) => {
    updateContent(fieldPath, newContent)
  }
  
  /**
   * Handle section-specific content updates
   */
  const handleSectionContentUpdate = (sectionKey: string, fieldPath: string, newContent: string) => {
    const fullFieldPath = createSectionFieldPath(sectionKey, fieldPath)
    updateContent(fullFieldPath, newContent)
  }
  
  /**
   * Handle feature array updates
   * Supports field-specific updates for object-based features (icon, text, title)
   */
  const handleFeatureUpdate = (sectionKey: string, featureIndex: number, field: string, newContent: string) => {
    const updatedContent = updateSectionFeature(content, sectionKey, featureIndex, field, newContent)
    onContentChange(updatedContent)
  }

  /**
   * Handle value item field updates
   */
  const handleValueUpdate = (sectionKey: string, valueIndex: number, fieldPath: string, newContent: string) => {
    const updatedContent = updateSectionValue(content, sectionKey, valueIndex, fieldPath, newContent)
    onContentChange(updatedContent)
  }
  
  /**
   * Handle title updates (with fallback support)
   */
  const handleTitleUpdate = (
    newTitle: string,
    onTitleChange?: (title: string) => void
  ) => {
    if (onTitleChange) {
      onTitleChange(newTitle)
    } else {
      updateContent('title', newTitle)
    }
  }
  
  /**
   * Handle subtitle updates (with fallback support)
   */
  const handleSubtitleUpdate = (
    newSubtitle: string,
    onSubtitleChange?: (subtitle: string) => void
  ) => {
    if (onSubtitleChange) {
      onSubtitleChange(newSubtitle)
    } else {
      updateContent('subtitle', newSubtitle)
    }
  }
  
  return {
    handleInlineContentUpdate,
    handleSectionContentUpdate,
    handleFeatureUpdate,
    handleValueUpdate,
    handleTitleUpdate,
    handleSubtitleUpdate
  }
}

/**
 * Validate that a field path is safe to update
 */
export function isValidFieldPath(fieldPath: string): boolean {
  // Basic validation to prevent prototype pollution
  const dangerousPatterns = ['__proto__', 'constructor', 'prototype']
  return !dangerousPatterns.some(pattern => fieldPath.includes(pattern))
}

/**
 * Get the current value from content using a field path
 */
export function getValueByPath(content: PageContent, fieldPath: string): any {
  const pathParts = fieldPath.split('.')
  let current: any = content
  
  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part]
    } else {
      return undefined
    }
  }
  
  return current
}