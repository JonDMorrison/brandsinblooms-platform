/**
 * Content update utilities for the visual editor
 * Handles various types of content updates and transformations
 */

import { PageContent } from '@/lib/content/schema'

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
 */
export function updateSectionFeature(
  content: PageContent,
  sectionKey: string, 
  featureIndex: number, 
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
  const updatedFeatures = [...section.data.features]
  updatedFeatures[featureIndex] = newContent
  
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
   */
  const handleFeatureUpdate = (sectionKey: string, featureIndex: number, newContent: string) => {
    const updatedContent = updateSectionFeature(content, sectionKey, featureIndex, newContent)
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