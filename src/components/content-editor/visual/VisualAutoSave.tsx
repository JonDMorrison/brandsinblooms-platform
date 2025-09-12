'use client'

import React, { useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { AutoSave, AutoSaveStatus } from '@/src/components/content-editor/AutoSave'
import { useVisualEditor } from '@/src/contexts/VisualEditorContext'
import { PageContent } from '@/src/lib/content/schema'
import { handleError } from '@/src/lib/types/error-handling'

interface VisualAutoSaveProps {
  content: PageContent
  originalContent: PageContent
  onSave: (content: PageContent) => Promise<void>
  onContentChange: (content: PageContent) => void
  debounceDelay?: number
  maxRetries?: number
  className?: string
}

interface PendingChange {
  fieldPath: string
  content: string
  timestamp: number
}

export function VisualAutoSave({
  content,
  originalContent,
  onSave,
  onContentChange,
  debounceDelay = 2000,
  maxRetries = 3,
  className
}: VisualAutoSaveProps) {
  const { editableElements } = useVisualEditor()
  const pendingChanges = useRef<Map<string, PendingChange>>(new Map())
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedContentRef = useRef<PageContent>(originalContent)
  
  // Check if content has meaningful changes
  const isDirty = React.useMemo(() => {
    return JSON.stringify(content) !== JSON.stringify(lastSavedContentRef.current)
  }, [content])
  
  // Validate content (basic validation)
  const isValid = React.useMemo(() => {
    try {
      // Basic validation - ensure required structure exists
      if (!content || !content.sections) return false
      
      // Validate required sections exist and are valid
      const hasRequiredSections = Object.keys(content.sections).length > 0
      
      return hasRequiredSections
    } catch (error) {
      console.error('Content validation error:', error)
      return false
    }
  }, [content])
  
  // Process pending changes and update content
  const processPendingChanges = useCallback(() => {
    if (pendingChanges.current.size === 0) return
    
    let updatedContent = { ...content }
    const processedChanges: string[] = []
    
    // Apply all pending changes
    for (const [fieldPath, change] of pendingChanges.current.entries()) {
      try {
        const pathParts = fieldPath.split('.')
        
        if (pathParts[0] === 'sections' && pathParts.length >= 4) {
          // Section field update: sections.hero.data.title
          const sectionKey = pathParts[1]
          const dataField = pathParts[3]
          
          updatedContent = {
            ...updatedContent,
            sections: {
              ...updatedContent.sections,
              [sectionKey]: {
                ...updatedContent.sections[sectionKey],
                data: {
                  ...updatedContent.sections[sectionKey]?.data,
                  [dataField]: change.content
                }
              }
            }
          }
        } else if (pathParts.length === 1) {
          // Top-level field update: title, subtitle, etc.
          updatedContent = {
            ...updatedContent,
            [fieldPath]: change.content
          } as PageContent
        }
        
        processedChanges.push(fieldPath)
      } catch (error) {
        console.error(`Failed to apply change for ${fieldPath}:`, error)
      }
    }
    
    // Clear processed changes
    for (const fieldPath of processedChanges) {
      pendingChanges.current.delete(fieldPath)
    }
    
    // Update content if changes were applied
    if (processedChanges.length > 0) {
      onContentChange(updatedContent)
    }
  }, [content, onContentChange])
  
  // Debounced save handler
  const debouncedSave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      processPendingChanges()
    }, debounceDelay)
  }, [processPendingChanges, debounceDelay])
  
  // Handle content updates from visual editor
  const handleVisualContentUpdate = useCallback((fieldPath: string, newContent: string) => {
    // Store the pending change
    pendingChanges.current.set(fieldPath, {
      fieldPath,
      content: newContent,
      timestamp: Date.now()
    })
    
    // Trigger debounced save
    debouncedSave()
  }, [debouncedSave])
  
  // Enhanced save function with visual editor context
  const handleSave = useCallback(async () => {
    try {
      // Process any remaining pending changes first
      processPendingChanges()
      
      // Wait a moment for content to be updated
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Save the content
      await onSave(content)
      
      // Update our reference
      lastSavedContentRef.current = content
      
      // Clear all pending changes
      pendingChanges.current.clear()
      
      toast.success('Changes saved successfully')
    } catch (error) {
      handleError(error, 'Auto-save failed')
      throw error
    }
  }, [content, onSave, processPendingChanges])
  
  // Set up visual editor content update handler
  useEffect(() => {
    // This would be called by the VisualEditorContext when content changes
    // The actual integration happens through the context's onContentUpdate prop
  }, [handleVisualContentUpdate])
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])
  
  // Process pending changes immediately when component unmounts or content changes externally
  useEffect(() => {
    return () => {
      if (pendingChanges.current.size > 0) {
        processPendingChanges()
      }
    }
  }, [processPendingChanges])
  
  return (
    <AutoSave
      onSave={handleSave}
      isDirty={isDirty}
      isValid={isValid}
      delay={debounceDelay}
      maxRetries={maxRetries}
      className={className}
    />
  )
}

/**
 * Hook for integrating visual auto-save with existing content management
 */
export function useVisualAutoSave({
  content,
  originalContent,
  onSave,
  onContentChange,
  debounceDelay = 2000
}: {
  content: PageContent
  originalContent: PageContent
  onSave: (content: PageContent) => Promise<void>
  onContentChange: (content: PageContent) => void
  debounceDelay?: number
}) {
  const pendingChanges = useRef<Map<string, string>>(new Map())
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  
  const handleFieldUpdate = useCallback((fieldPath: string, newContent: string) => {
    // Store pending change
    pendingChanges.current.set(fieldPath, newContent)
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    // Set new debounced timeout
    debounceTimeoutRef.current = setTimeout(() => {
      let updatedContent = { ...content }
      
      // Apply all pending changes
      for (const [path, value] of pendingChanges.current.entries()) {
        const pathParts = path.split('.')
        
        if (pathParts[0] === 'sections' && pathParts.length >= 4) {
          const sectionKey = pathParts[1]
          const dataField = pathParts[3]
          
          updatedContent = {
            ...updatedContent,
            sections: {
              ...updatedContent.sections,
              [sectionKey]: {
                ...updatedContent.sections[sectionKey],
                data: {
                  ...updatedContent.sections[sectionKey]?.data,
                  [dataField]: value
                }
              }
            }
          }
        } else if (pathParts.length === 1) {
          updatedContent = {
            ...updatedContent,
            [path]: value
          } as PageContent
        }
      }
      
      // Clear pending changes and update content
      pendingChanges.current.clear()
      onContentChange(updatedContent)
    }, debounceDelay)
  }, [content, onContentChange, debounceDelay])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])
  
  return {
    handleFieldUpdate,
    hasPendingChanges: pendingChanges.current.size > 0
  }
}