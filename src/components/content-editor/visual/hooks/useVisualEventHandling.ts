'use client'

import { useRef, useEffect, useCallback } from 'react'
import { addVisualFeedbackClass, isElementBeingEdited } from '../styles/visual-feedback'

interface ElementData {
  id: string
  sectionKey: string
  fieldPath: string
  type: string
  element: HTMLElement
  bounds: DOMRect
}

interface UseVisualEventHandlingProps {
  onElementClick?: (event: MouseEvent, elementData: ElementData) => void
  onElementHover?: (event: MouseEvent, elementData: ElementData | null) => void
}

/**
 * Custom hook for handling visual editor event delegation
 * Manages click, hover, and mouse events for the preview container
 */
export function useVisualEventHandling({
  onElementClick,
  onElementHover
}: UseVisualEventHandlingProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null)

  /**
   * Handle container click events with proper delegation
   */
  const handleContainerClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement
    const inlineEditor = target.closest('.inline-editor-wrapper')
    const clickableElement = target.closest('a, button')

    // Prevent navigation for links and buttons in preview mode
    // EXCEPT for editor control buttons (gear icons, etc.)
    if (clickableElement && !inlineEditor) {
      const isEditorControl = clickableElement.hasAttribute('data-editor-control')

      // Only prevent default behavior for content buttons, not editor controls
      if (!isEditorControl) {
        event.preventDefault()
        event.stopPropagation()

        // Add visual feedback for preview mode
        addVisualFeedbackClass(clickableElement as HTMLElement, 'preview-clicked')
        return
      }
      // For editor controls, allow the click to proceed normally
    }

    // Handle clicks on editable elements
    const editableElement = target.closest('[data-editable="true"]')
    
    if (editableElement && onElementClick) {
      const fieldPath = editableElement.getAttribute('data-field')
      const sectionKey = editableElement.getAttribute('data-section')
      const editType = editableElement.getAttribute('data-edit-type')
      
      if (fieldPath && sectionKey) {
        const bounds = editableElement.getBoundingClientRect()
        const elementData: ElementData = {
          id: `${sectionKey}:${fieldPath}`,
          sectionKey,
          fieldPath,
          type: editType || 'text',
          element: editableElement as HTMLElement,
          bounds
        }
        
        onElementClick(event, elementData)
      }
    }
  }, [onElementClick])

  /**
   * Handle container mouseover events for hover detection
   */
  const handleContainerMouseOver = useCallback((event: MouseEvent) => {
    if (!onElementHover) return
    
    const target = event.target as HTMLElement
    const editableElement = target.closest('[data-editable="true"]')
    
    if (editableElement) {
      const fieldPath = editableElement.getAttribute('data-field')
      const sectionKey = editableElement.getAttribute('data-section')
      const editType = editableElement.getAttribute('data-edit-type')
      
      if (fieldPath && sectionKey) {
        const bounds = editableElement.getBoundingClientRect()
        const elementData: ElementData = {
          id: `${sectionKey}:${fieldPath}`,
          sectionKey,
          fieldPath,
          type: editType || 'text',
          element: editableElement as HTMLElement,
          bounds
        }
        
        onElementHover(event, elementData)
      }
    }
  }, [onElementHover])

  /**
   * Handle container mouseleave events
   */
  const handleContainerMouseLeave = useCallback((event: MouseEvent) => {
    if (onElementHover) {
      onElementHover(event, null)
    }
  }, [onElementHover])

  /**
   * Setup and cleanup event listeners using AbortController
   */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create AbortController for cleanup
    const abortController = new AbortController()
    const { signal } = abortController
    
    // Use AbortController signal for automatic cleanup
    container.addEventListener('click', handleContainerClick, { signal })
    container.addEventListener('mouseover', handleContainerMouseOver, { signal })
    container.addEventListener('mouseleave', handleContainerMouseLeave, { signal })
    
    return () => {
      // AbortController automatically removes all event listeners
      abortController.abort()
    }
  }, [handleContainerClick, handleContainerMouseOver, handleContainerMouseLeave])

  return {
    containerRef,
    handleContainerClick,
    handleContainerMouseOver,
    handleContainerMouseLeave
  }
}

/**
 * Helper hook for detecting editable elements and their states
 */
export function useEditableDetection() {
  const detectEditableElement = useCallback((target: HTMLElement) => {
    return target.closest('[data-editable="true"]') as HTMLElement | null
  }, [])

  const getElementData = useCallback((element: HTMLElement): ElementData | null => {
    const fieldPath = element.getAttribute('data-field')
    const sectionKey = element.getAttribute('data-section')
    const editType = element.getAttribute('data-edit-type')
    
    if (!fieldPath || !sectionKey) return null
    
    const bounds = element.getBoundingClientRect()
    return {
      id: `${sectionKey}:${fieldPath}`,
      sectionKey,
      fieldPath,
      type: editType || 'text',
      element,
      bounds
    }
  }, [])

  const isEditingActive = useCallback((element: HTMLElement): boolean => {
    return isElementBeingEdited(element)
  }, [])

  return {
    detectEditableElement,
    getElementData,
    isEditingActive
  }
}

export type { ElementData }