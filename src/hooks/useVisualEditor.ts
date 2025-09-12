'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useVisualEditor, EditableElement } from '@/contexts/VisualEditorContext'
import { PageContent, ContentSection } from '@/lib/content/schema'

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
    if (!content || !onContentChange) return
    
    // Parse field path (e.g., "sections.hero.data.title")
    const pathParts = fieldPath.split('.')
    
    if (pathParts[0] === 'sections' && pathParts.length >= 4) {
      const sectionKey = pathParts[1]
      const dataField = pathParts[3]
      
      const updatedContent: PageContent = {
        ...content,
        sections: {
          ...content.sections,
          [sectionKey]: {
            ...content.sections[sectionKey],
            data: {
              ...content.sections[sectionKey]?.data,
              [dataField]: newContent
            }
          }
        }
      }
      
      onContentChange(updatedContent)
    } else if (pathParts.length === 1) {
      // Top-level field like "title"
      const updatedContent = {
        ...content,
        [fieldPath]: newContent
      } as PageContent
      
      onContentChange(updatedContent)
    }
    
    // Also update through visual editor for debounced auto-save
    updateElementContent(fieldPath, newContent)
  }, [content, onContentChange, updateElementContent])
  
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
  const getSectionContent = useCallback((sectionKey: string): ContentSection | undefined => {
    return content?.sections[sectionKey]
  }, [content])
  
  // Update specific section field
  const updateSectionField = useCallback((sectionKey: string, field: string, value: string) => {
    const fieldPath = `sections.${sectionKey}.data.${field}`
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