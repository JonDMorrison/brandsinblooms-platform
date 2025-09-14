'use client'

import { useCallback } from 'react'
import { isElementBeingEdited, addVisualFeedbackClass } from '../styles/visual-feedback'

/**
 * Custom hook for managing preview mode interactions
 * Handles click prevention during editing and visual feedback
 */
export function usePreviewInteractions() {
  /**
   * Prevent navigation during inline text editing
   */
  const handlePreviewClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement
    const inlineEditor = target.closest('.inline-editor-wrapper')
    const proseMirror = target.closest('.ProseMirror')
    const clickableElement = target.closest('a, button')
    
    // Check if we're currently in an editing context
    const isEditing = isElementBeingEdited(target)
    
    if (isEditing || inlineEditor || proseMirror) {
      // Allow normal editing behavior
      return
    }
    
    if (clickableElement) {
      // Prevent navigation in preview mode
      event.preventDefault()
      event.stopPropagation()
      
      // Provide visual feedback that the element was clicked
      addVisualFeedbackClass(clickableElement as HTMLElement, 'preview-clicked')
      
      // Optional: Show a toast or message about preview mode
      console.log('Navigation prevented in preview mode')
    }
  }, [])

  /**
   * Handle hover states for interactive elements in preview
   */
  const handlePreviewHover = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement
    const clickableElement = target.closest('a, button')
    
    if (clickableElement && !isElementBeingEdited(target)) {
      // Add hover state styling if needed
      // This could be extended to show tooltips, etc.
    }
  }, [])

  /**
   * Check if an element should be interactive in preview mode
   */
  const shouldAllowInteraction = useCallback((element: HTMLElement): boolean => {
    return isElementBeingEdited(element) ||
           element.closest('.inline-editor-wrapper') !== null ||
           element.closest('.ProseMirror') !== null
  }, [])

  /**
   * Add preview mode attributes to elements
   */
  const markAsPreviewMode = useCallback((container: HTMLElement) => {
    container.setAttribute('data-visual-editor', 'true')
    container.setAttribute('data-preview-mode', 'true')
  }, [])

  return {
    handlePreviewClick,
    handlePreviewHover,
    shouldAllowInteraction,
    markAsPreviewMode
  }
}