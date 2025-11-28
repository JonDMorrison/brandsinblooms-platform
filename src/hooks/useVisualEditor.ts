'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useVisualEditor, EditableElement } from '@/contexts/VisualEditorContext'
import { PageContent, ContentSection } from '@/src/lib/content/schema'

interface UseVisualEditorProps {
  content?: PageContent
  onContentChange?: (content: PageContent) => void
  sectionFilter?: string[] // Limit to specific sections
}

interface UseVisualEditorReturn {
  // Element interaction
  handleElementClick: (event: MouseEvent, element: EditableElement) => void
  handleElementHover: (event: MouseEvent, element: EditableElement | null) => void

  // Content management
  updateContent: (fieldPath: string, newContent: string) => void

  // Element registration helpers
  createElementId: (sectionKey: string, fieldPath: string) => string
  registerElementFromRef: (
    ref: HTMLElement | null,
    sectionKey: string,
    fieldPath: string,
    type: EditableElement['type']
  ) => void

  // Section helpers
  getSectionContent: (sectionKey: string) => ContentSection | undefined
  updateSectionField: (sectionKey: string, field: string, value: string) => void

  // Visual feedback
  scrollToElement: (elementId: string) => void
  flashElement: (elementId: string) => void
}

export function useVisualEditorHelpers({
  content,
  onContentChange,
  sectionFilter
}: UseVisualEditorProps): UseVisualEditorReturn {
  const visualEditor = useVisualEditor()
  const {
    setActiveElement,
    setHoveredElement,
    registerElement,
    unregisterElement,
    updateElementContent,
    highlightElement,
    getElementByPath
  } = visualEditor

  const registeredElements = useRef<Set<string>>(new Set())
  // Use a ref to track the latest content to avoid stale closure issues
  const contentRef = useRef(content)

  // Update contentRef whenever content changes
  useEffect(() => {
    contentRef.current = content
  }, [content])

  // Handle element clicks for editing
  const handleElementClick = useCallback((event: MouseEvent, element: EditableElement) => {
    event.preventDefault()
    event.stopPropagation()

    // Set as active element for editing
    setActiveElement(element)

    // Trigger any additional click behavior
    highlightElement(element.id)
  }, [setActiveElement, highlightElement])

  // Handle element hover for visual feedback
  const handleElementHover = useCallback((event: MouseEvent, element: EditableElement | null) => {
    setHoveredElement(element)
  }, [setHoveredElement])

  // Update content and propagate changes
  const updateContent = useCallback((fieldPath: string, newContent: string) => {
    // Use contentRef.current to get the latest content, avoiding stale closure issues
    const currentContent = contentRef.current
    if (!currentContent || !onContentChange) return

    // Parse field path (e.g., "sections.hero-123.data.title" or "sections.0.data.title")
    const pathParts = fieldPath.split('.')

    if (pathParts[0] === 'sections' && pathParts.length >= 4) {
      const sectionIdOrIndex = pathParts[1]
      const dataField = pathParts[3]

      // Find section by ID or index
      const sectionIndex = currentContent.sections.findIndex(
        s => s.id === sectionIdOrIndex || currentContent.sections.indexOf(s).toString() === sectionIdOrIndex
      )

      if (sectionIndex === -1) return

      const updatedContent: PageContent = {
        ...currentContent,
        sections: currentContent.sections.map((section, idx) =>
          idx === sectionIndex
            ? {
              ...section,
              data: {
                ...section.data,
                [dataField]: newContent
              }
            }
            : section
        )
      }

      onContentChange(updatedContent)
    } else if (pathParts.length === 1) {
      // Top-level field like "title"
      const updatedContent = {
        ...currentContent,
        [fieldPath]: newContent
      } as PageContent

      onContentChange(updatedContent)
    }

    // Also update through visual editor for debounced auto-save
    updateElementContent(fieldPath, newContent)
  }, [onContentChange, updateElementContent])

  // Create consistent element IDs
  const createElementId = useCallback((sectionKey: string, fieldPath: string) => {
    return `${sectionKey}:${fieldPath.replace(/\./g, '_')}`
  }, [])

  // Register element from a React ref
  const registerElementFromRef = useCallback((
    ref: HTMLElement | null,
    sectionKey: string,
    fieldPath: string,
    type: EditableElement['type']
  ) => {
    if (!ref) return

    // Skip if section filter is applied and this section isn't included
    if (sectionFilter && !sectionFilter.includes(sectionKey)) return

    const elementId = createElementId(sectionKey, fieldPath)

    // Avoid duplicate registration
    if (registeredElements.current.has(elementId)) return

    const element: EditableElement = {
      id: elementId,
      sectionKey,
      fieldPath,
      type,
      element: ref,
      bounds: ref.getBoundingClientRect()
    }

    registerElement(element)
    registeredElements.current.add(elementId)

    // Cleanup when element is unmounted
    return () => {
      unregisterElement(elementId)
      registeredElements.current.delete(elementId)
    }
  }, [registerElement, unregisterElement, createElementId, sectionFilter])

  // Get section content helper
  const getSectionContent = useCallback((sectionIdOrKey: string): ContentSection | undefined => {
    return content?.sections.find(s => s.id === sectionIdOrKey)
  }, [content])

  // Update specific section field
  const updateSectionField = useCallback((sectionId: string, field: string, value: string) => {
    const fieldPath = `sections.${sectionId}.data.${field}`
    updateContent(fieldPath, value)
  }, [updateContent])

  // Scroll to element
  const scrollToElement = useCallback((elementId: string) => {
    const element = getElementByPath(elementId)
    if (element) {
      element.element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
      highlightElement(elementId)
    }
  }, [getElementByPath, highlightElement])

  // Flash element for visual feedback
  const flashElement = useCallback((elementId: string) => {
    highlightElement(elementId)
  }, [highlightElement])

  // Cleanup registered elements on unmount
  useEffect(() => {
    return () => {
      for (const elementId of registeredElements.current) {
        unregisterElement(elementId)
      }
      registeredElements.current.clear()
    }
  }, [unregisterElement])

  return {
    handleElementClick,
    handleElementHover,
    updateContent,
    createElementId,
    registerElementFromRef,
    getSectionContent,
    updateSectionField,
    scrollToElement,
    flashElement
  }
}