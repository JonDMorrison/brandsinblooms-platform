'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/src/lib/supabase/client'
import { getContentById, updateContent } from '@/src/lib/queries/domains/content'
import { useDebounce } from '@/src/hooks/useDebounce'

import { 
  PageContent, 
  ContentSection, 
  LayoutType,
  LAYOUT_SECTIONS,
  isPageContent,
  isLegacyContent
} from '@/src/lib/content/schema'

import { 
  migrateToV1 as migrateContent, 
  validatePageContent, 
  initializeDefaultContent 
} from '@/src/lib/content/migration'

import { handleError } from '@/src/lib/types/error-handling'

interface UseContentEditorProps {
  contentId: string
  siteId: string
  layout: LayoutType
  initialContent?: PageContent
  onSave?: (content: PageContent) => Promise<void>
  onContentChange?: (content: PageContent, hasChanges: boolean) => void
  autoSaveDelay?: number
}

interface UseContentEditorReturn {
  content: PageContent
  isDirty: boolean
  isValid: boolean
  errors: string[]
  isLoading: boolean
  isSaving: boolean
  updateSection: (sectionKey: string, section: ContentSection) => void
  toggleSectionVisibility: (sectionKey: string) => void
  moveSectionUp: (sectionKey: string) => void
  moveSectionDown: (sectionKey: string) => void
  saveContent: () => Promise<void>
  resetContent: () => void
  loadContent: () => Promise<void>
}

export function useContentEditor({
  contentId,
  siteId,
  layout,
  initialContent,
  onSave,
  onContentChange,
  autoSaveDelay = 2000
}: UseContentEditorProps): UseContentEditorReturn {
  const [content, setContent] = useState<PageContent>(() => 
    initialContent || initializeDefaultContent(layout)
  )
  const [originalContent, setOriginalContent] = useState<PageContent>(() => 
    initialContent || initializeDefaultContent(layout)
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Debounced content for auto-save
  const debouncedContent = useDebounce(content, autoSaveDelay)

  // Calculate if content has changes
  const isDirty = useMemo(() => {
    return JSON.stringify(content) !== JSON.stringify(originalContent)
  }, [content, originalContent])

  // Validate content and get errors
  const { isValid, errors } = useMemo(() => {
    try {
      const validation = validatePageContent(content, layout)
      return {
        isValid: validation.isValid,
        errors: validation.errors
      }
    } catch (error) {
      return {
        isValid: false,
        errors: ['Validation error: ' + (error instanceof Error ? error.message : 'Unknown error')]
      }
    }
  }, [content, layout])

  // Load content from database
  const loadContent = useCallback(async () => {
    if (!contentId || !siteId) return

    setIsLoading(true)
    try {
      const dbContent = await getContentById(supabase, siteId, contentId)
      
      let pageContent: PageContent

      // Handle content migration
      if (isPageContent(dbContent.content)) {
        pageContent = dbContent.content as PageContent
      } else if (isLegacyContent(dbContent.content) || dbContent.content === null) {
        // Migrate legacy content or initialize new content
        pageContent = migrateContent(
          dbContent.content as Record<string, unknown> || {},
          dbContent.meta_data as Record<string, unknown> || {},
          layout,
          {
            title: dbContent.title,
            subtitle: (dbContent.meta_data as any)?.subtitle || ''
          }
        )
      } else {
        // Fallback to default content
        pageContent = initializeDefaultContent(layout)
      }

      // Ensure content matches current layout
      if (pageContent.layout !== layout) {
        pageContent = {
          ...pageContent,
          layout,
          sections: {
            ...LAYOUT_SECTIONS[layout].defaultSections,
            ...pageContent.sections
          }
        }
      }

      setContent(pageContent)
      setOriginalContent(pageContent)
    } catch (error) {
      handleError(error, 'Failed to load content')
      // Initialize with default content on error
      const defaultContent = initializeDefaultContent(layout)
      setContent(defaultContent)
      setOriginalContent(defaultContent)
    } finally {
      setIsLoading(false)
    }
  }, [contentId, siteId, layout])

  // Save content to database
  const saveContent = useCallback(async () => {
    if (!contentId || !siteId) {
      throw new Error('Missing content ID or site ID')
    }

    if (!isValid) {
      throw new Error('Cannot save invalid content')
    }

    setIsSaving(true)
    try {
      if (onSave) {
        await onSave(content)
      } else {
        // Default save implementation
        await updateContent(
          supabase,
          siteId,
          contentId,
          {
            content: content,
            meta_data: {
              layout: content.layout,
              ...content.settings
            },
            updated_at: new Date().toISOString()
          }
        )
      }

      setOriginalContent(content)
    } catch (error) {
      handleError(error, 'Failed to save content')
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [contentId, siteId, content, isValid, onSave])

  // Update section
  const updateSection = useCallback((sectionKey: string, section: ContentSection) => {
    setContent(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: section
      }
    }))
  }, [])

  // Toggle section visibility
  const toggleSectionVisibility = useCallback((sectionKey: string) => {
    setContent(prev => {
      const currentSection = prev.sections[sectionKey]
      const layoutConfig = LAYOUT_SECTIONS[layout]

      if (!currentSection) {
        // Create section if it doesn't exist (for optional sections)
        const defaultSection = layoutConfig.defaultSections[sectionKey]
        if (defaultSection) {
          return {
            ...prev,
            sections: {
              ...prev.sections,
              [sectionKey]: {
                ...defaultSection,
                visible: true
              }
            }
          }
        }
        return prev
      }

      // Don't allow hiding required sections
      if (layoutConfig.required.includes(sectionKey) && currentSection.visible) {
        return prev
      }

      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionKey]: {
            ...currentSection,
            visible: !currentSection.visible
          }
        }
      }
    })
  }, [layout])

  // Move section up
  const moveSectionUp = useCallback((sectionKey: string) => {
    setContent(prev => {
      const sections = Object.entries(prev.sections)
        .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
      
      const currentIndex = sections.findIndex(([key]) => key === sectionKey)
      if (currentIndex <= 0) return prev

      // Swap with previous section
      const newSections = { ...prev.sections }
      const currentOrder = sections[currentIndex][1].order || currentIndex
      const previousOrder = sections[currentIndex - 1][1].order || (currentIndex - 1)

      newSections[sectionKey] = {
        ...newSections[sectionKey],
        order: previousOrder
      }
      newSections[sections[currentIndex - 1][0]] = {
        ...newSections[sections[currentIndex - 1][0]],
        order: currentOrder
      }

      return {
        ...prev,
        sections: newSections
      }
    })
  }, [])

  // Move section down
  const moveSectionDown = useCallback((sectionKey: string) => {
    setContent(prev => {
      const sections = Object.entries(prev.sections)
        .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
      
      const currentIndex = sections.findIndex(([key]) => key === sectionKey)
      if (currentIndex < 0 || currentIndex >= sections.length - 1) return prev

      // Swap with next section
      const newSections = { ...prev.sections }
      const currentOrder = sections[currentIndex][1].order || currentIndex
      const nextOrder = sections[currentIndex + 1][1].order || (currentIndex + 1)

      newSections[sectionKey] = {
        ...newSections[sectionKey],
        order: nextOrder
      }
      newSections[sections[currentIndex + 1][0]] = {
        ...newSections[sections[currentIndex + 1][0]],
        order: currentOrder
      }

      return {
        ...prev,
        sections: newSections
      }
    })
  }, [])

  // Reset content to original state
  const resetContent = useCallback(() => {
    setContent(originalContent)
  }, [originalContent])

  // Load content on mount
  useEffect(() => {
    if (contentId && siteId && !initialContent) {
      loadContent()
    }
  }, [contentId, siteId, initialContent, loadContent])

  // Notify parent of content changes
  useEffect(() => {
    onContentChange?.(content, isDirty)
  }, [content, isDirty, onContentChange])

  // Auto-save (if enabled and not using custom save handler)
  useEffect(() => {
    if (!onSave && isDirty && isValid && debouncedContent && !isSaving) {
      // Auto-save is disabled by default to avoid conflicts
      // Users can implement auto-save in the parent component
    }
  }, [debouncedContent, isDirty, isValid, isSaving, onSave])

  return {
    content,
    isDirty,
    isValid,
    errors,
    isLoading,
    isSaving,
    updateSection,
    toggleSectionVisibility,
    moveSectionUp,
    moveSectionDown,
    saveContent,
    resetContent,
    loadContent
  }
}