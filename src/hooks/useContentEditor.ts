'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/src/lib/supabase/client'
import { getContentById, updateContent } from '@/src/lib/queries/domains/content'

import {
  PageContent,
  ContentSection,
  SectionType,
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
import { createRichTextTemplate } from '@/src/components/content-editor/CombinedSectionManager'

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
  updateSection: (sectionId: string, section: ContentSection) => void
  toggleSectionVisibility: (sectionId: string) => void
  moveSectionUp: (sectionId: string) => void
  moveSectionDown: (sectionId: string) => void
  reorderSections: (sections: ContentSection[]) => void
  addSection: (sectionType: SectionType, variant?: string) => void
  removeSection: (sectionId: string) => void
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
    initialContent || { version: '2.0', layout, sections: [] }
  )
  const [originalContent, setOriginalContent] = useState<PageContent>(() =>
    initialContent || { version: '2.0', layout, sections: [] }
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
        // Note: For blog posts and other public content, prefer using the
        // updateContentWithRevalidation server action from app/actions/content.ts
        // to ensure cache invalidation. This fallback is mainly for internal/draft content.
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
  const updateSection = useCallback((sectionId: string, section: ContentSection) => {
    setContent((prev: PageContent) => ({
      ...prev,
      sections: prev.sections.map((s: ContentSection) => s.id === sectionId ? section : s)
    }))
  }, [])

  // Toggle section visibility
  const toggleSectionVisibility = useCallback((sectionId: string) => {
    setContent((prev: PageContent) => {
      const currentSection = prev.sections.find(s => s.id === sectionId)

      if (!currentSection) {
        console.warn(`Section with id ${sectionId} not found`)
        return prev
      }

      return {
        ...prev,
        sections: prev.sections.map((s: ContentSection) =>
          s.id === sectionId ? { ...s, visible: !s.visible } : s
        )
      }
    })
  }, [])

  // Move section up
  const moveSectionUp = useCallback((sectionId: string) => {
    setContent((prev: PageContent) => {
      const currentIndex = prev.sections.findIndex(s => s.id === sectionId)
      if (currentIndex <= 0) return prev

      // Swap with previous section
      const newSections = [...prev.sections]
      const temp = newSections[currentIndex]
      newSections[currentIndex] = newSections[currentIndex - 1]
      newSections[currentIndex - 1] = temp

      return {
        ...prev,
        sections: newSections
      }
    })
  }, [])

  // Move section down
  const moveSectionDown = useCallback((sectionId: string) => {
    setContent((prev: PageContent) => {
      const currentIndex = prev.sections.findIndex(s => s.id === sectionId)
      if (currentIndex < 0 || currentIndex >= prev.sections.length - 1) return prev

      // Swap with next section
      const newSections = [...prev.sections]
      const temp = newSections[currentIndex]
      newSections[currentIndex] = newSections[currentIndex + 1]
      newSections[currentIndex + 1] = temp

      return {
        ...prev,
        sections: newSections
      }
    })
  }, [])

  // Reorder sections in bulk with optimistic updates
  const reorderSections = useCallback((sections: ContentSection[]) => {
    setContent((prev: PageContent) => ({
      ...prev,
      sections
    }))
  }, [])

  // Add section
  const addSection = useCallback((sectionType: SectionType, variant?: string) => {
    setContent((prev: PageContent) => {
      const layoutConfig = LAYOUT_SECTIONS[layout]
      const defaultSectionTemplate = layoutConfig.initialSections?.find((s: Partial<ContentSection>) => s.type === sectionType)

      if (!defaultSectionTemplate) {
        console.warn(`No default section found for type: ${sectionType}`)
        return prev
      }

      // Create new section with unique ID
      const newSection: ContentSection = {
        id: crypto.randomUUID(),
        type: sectionType,
        data: JSON.parse(JSON.stringify(defaultSectionTemplate.data || {})),
        visible: true,
        settings: defaultSectionTemplate.settings || {}
      }

      // For text sections with variants, customize the content
      if (sectionType === 'text' && variant) {
        const template = createRichTextTemplate(variant as 'mission' | 'story' | 'contact' | 'other')

        // Find existing text sections with the same variant
        const sameVariantSections = prev.sections.filter((s: ContentSection) => {
          if (s.type !== 'text') return false
          const content = s.data.content || ''
          const h2Regex = new RegExp(`<h2[^>]*>\\s*${template.headline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s+\\d+)?\\s*</h2>`, 'i')
          return h2Regex.test(content)
        })

        // Generate display name
        let displayName = template.headline
        if (sameVariantSections.length > 0) {
          const number = sameVariantSections.length + 1
          const paddedNumber = number.toString().padStart(2, '0')
          displayName = `${template.headline} ${paddedNumber}`
        }

        newSection.data = {
          content: `<h2 style="text-align: center;">${displayName}</h2>\n\n${template.content}`
        }
      }

      return {
        ...prev,
        sections: [...prev.sections, newSection]
      }
    })
  }, [layout])

  // Remove section
  const removeSection = useCallback((sectionId: string) => {
    setContent((prev: PageContent) => ({
      ...prev,
      sections: prev.sections.filter((s: ContentSection) => s.id !== sectionId)
    }))
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