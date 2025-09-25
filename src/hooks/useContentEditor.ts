'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/src/lib/supabase/client'
import { getContentById, updateContent } from '@/src/lib/queries/domains/content'

import { 
  PageContent, 
  ContentSection, 
  ContentSectionType,
  LayoutType,
  LAYOUT_SECTIONS,
  isPageContent,
  isLegacyContent
} from '@/src/lib/content/schema'

import { 
  migrateContent, 
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
  reorderSections: (sections: Array<{ key: string; section: ContentSection }>) => void
  addSection: (sectionType: ContentSectionType) => void
  removeSection: (sectionKey: string) => void
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
  onContentChange
}: UseContentEditorProps): UseContentEditorReturn {
  const [content, setContent] = useState<PageContent>(() => 
    initialContent || { version: '1.0', layout, sections: {} }  // Don't initialize with defaults
  )
  const [originalContent, setOriginalContent] = useState<PageContent>(() => 
    initialContent || { version: '1.0', layout, sections: {} }  // Don't initialize with defaults
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const lastInitialContentRef = useRef<string>('')

  // Update content when initialContent changes (e.g., when it loads from database)
  // This should NOT trigger onContentChange to avoid loops
  useEffect(() => {
    if (initialContent) {
      const serialized = JSON.stringify(initialContent)
      if (serialized !== lastInitialContentRef.current) {
        setContent(initialContent)
        setOriginalContent(initialContent)
        lastInitialContentRef.current = serialized
        // NOTE: We don't call onContentChange here to avoid infinite loops
      }
    }
  }, [initialContent])


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
        const migrationResult = await migrateContent(
          dbContent.content as Record<string, unknown> || {},
          layout,
          {
            preserveOriginal: true,
            strictValidation: false,
            autoFixVisibility: true
          }
        )
        
        if (migrationResult.success && migrationResult.data) {
          pageContent = migrationResult.data
          // Inject title/subtitle into hero section if available
          if ((pageContent.sections.hero || pageContent.sections.header) && dbContent.title) {
            const heroSection = pageContent.sections.hero || pageContent.sections.header
            const heroKey = pageContent.sections.hero ? 'hero' : 'header'
            
            let heroContent = ''
            if (dbContent.title) {
              heroContent += `<h1>${dbContent.title}</h1>`
            }
            if ((dbContent.meta_data as any)?.subtitle) {
              heroContent += `<p class="subtitle">${(dbContent.meta_data as any).subtitle}</p>`
            }
            if (heroSection.data.content) {
              heroContent += heroSection.data.content
            }
            
            pageContent.sections[heroKey] = {
              ...heroSection,
              data: { ...heroSection.data, content: heroContent }
            }
          }
        } else {
          // Fallback to default content
          pageContent = initializeDefaultContent(layout)
        }
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
      handleError(error)
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
      handleError(error)
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

  // Reorder sections in bulk with optimistic updates
  const reorderSections = useCallback((sections: Array<{ key: string; section: ContentSection }>) => {
    setContent(prev => {
      const newSections: { [key: string]: ContentSection } = {}
      
      // Rebuild sections object with new order
      sections.forEach(({ key, section }) => {
        newSections[key] = section
      })
      
      return {
        ...prev,
        sections: newSections
      }
    })
  }, [])

  // Add section
  const addSection = useCallback((sectionType: ContentSectionType) => {
    setContent(prev => {
      const layoutConfig = LAYOUT_SECTIONS[layout]
      const defaultSection = layoutConfig.defaultSections[sectionType]

      if (!defaultSection) {
        console.warn(`No default section found for type: ${sectionType}`)
        return prev
      }

      // Generate unique key for multiple instances
      let sectionKey = sectionType
      let counter = 1
      while (prev.sections[sectionKey]) {
        sectionKey = `${sectionType}_${counter}`
        counter++
      }

      // Calculate next order
      const existingOrders = Object.values(prev.sections).map(s => s.order || 0)
      const nextOrder = Math.max(0, ...existingOrders) + 1

      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionKey]: {
            ...defaultSection,
            order: nextOrder,
            visible: true
          }
        }
      }
    })
  }, [layout])

  // Remove section
  const removeSection = useCallback((sectionKey: string) => {
    setContent(prev => {
      const layoutConfig = LAYOUT_SECTIONS[layout]
      
      // Don't allow removing required sections
      if (layoutConfig.required.includes(sectionKey)) {
        console.warn(`Cannot remove required section: ${sectionKey}`)
        return prev
      }

      const newSections = { ...prev.sections }
      delete newSections[sectionKey]

      return {
        ...prev,
        sections: newSections
      }
    })
  }, [layout])

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
    if (onContentChange) {
      onContentChange(content, isDirty)
    }
  }, [content, isDirty, onContentChange])


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
    reorderSections,
    addSection,
    removeSection,
    saveContent,
    resetContent,
    loadContent
  }
}