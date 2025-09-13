'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useVisualEditor } from '@/src/contexts/VisualEditorContext'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { Edit2, Move, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { cn } from '@/lib/utils'

interface EditOverlayProps {
  containerRef: React.RefObject<HTMLDivElement>
  onContentUpdate: (fieldPath: string, content: string) => void
  onTitleUpdate: (title: string) => void
  onSubtitleUpdate: (subtitle: string) => void
}

interface EditIndicator {
  elementId: string
  bounds: DOMRect
  sectionKey: string
  fieldPath: string
  type: 'text' | 'rich-text' | 'image' | 'icon'
  isHovered: boolean
  isActive: boolean
}

export function EditOverlay({
  containerRef,
  onContentUpdate,
  onTitleUpdate,
  onSubtitleUpdate
}: EditOverlayProps) {
  const {
    activeElement,
    hoveredElement,
    editableElements,
    showOverlay,
    setActiveElement,
    refreshElementBounds
  } = useVisualEditor()
  
  const [indicators, setIndicators] = useState<EditIndicator[]>([])
  const [inlineEditorPosition, setInlineEditorPosition] = useState<{
    x: number
    y: number
    width: number
    height: number
    element: any
  } | null>(null)
  
  const overlayRef = useRef<HTMLDivElement>(null)
  const resizeObserverRef = useRef<ResizeObserver>()
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Update indicators when elements change
  useEffect(() => {
    const updateIndicators = () => {
      const newIndicators: EditIndicator[] = []
      
      editableElements.forEach((element) => {
        // Get fresh bounds
        const bounds = element.element.getBoundingClientRect()
        const containerBounds = containerRef.current?.getBoundingClientRect()
        
        if (containerBounds) {
          // Convert to container-relative coordinates
          const relativeBounds = new DOMRect(
            bounds.left - containerBounds.left,
            bounds.top - containerBounds.top,
            bounds.width,
            bounds.height
          )
          
          newIndicators.push({
            elementId: element.id,
            bounds: relativeBounds,
            sectionKey: element.sectionKey,
            fieldPath: element.fieldPath,
            type: element.type,
            isHovered: hoveredElement?.id === element.id,
            isActive: activeElement?.id === element.id
          })
        }
      })
      
      setIndicators(newIndicators)
    }
    
    if (showOverlay) {
      updateIndicators()
      
      // Set up resize observer to update bounds when layout changes
      if (containerRef.current && !resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current)
          }
          
          // Debounce the refresh to prevent infinite loops
          refreshTimeoutRef.current = setTimeout(() => {
            refreshElementBounds()
            updateIndicators()
          }, 16) // ~60fps
        })
        resizeObserverRef.current.observe(containerRef.current)
      }
    }
    
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = undefined
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = undefined
      }
    }
  }, [editableElements, hoveredElement, activeElement, showOverlay, containerRef])
  
  // Handle element click for inline editing
  const handleIndicatorClick = useCallback((indicator: EditIndicator, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    const element = editableElements.get(indicator.elementId)
    if (!element) return
    
    // For text elements, show inline editor
    if (indicator.type === 'text' || indicator.type === 'rich-text') {
      setInlineEditorPosition({
        x: indicator.bounds.left,
        y: indicator.bounds.top,
        width: indicator.bounds.width,
        height: indicator.bounds.height,
        element
      })
    }
    
    setActiveElement(element)
  }, [editableElements, setActiveElement])
  
  // Handle inline editor updates
  const handleInlineUpdate = useCallback((content: string) => {
    if (!inlineEditorPosition) return
    
    const { element } = inlineEditorPosition
    
    // Handle special cases for title/subtitle
    if (element.fieldPath === 'title') {
      onTitleUpdate(content)
    } else if (element.fieldPath === 'subtitle') {
      onSubtitleUpdate(content)
    } else {
      onContentUpdate(element.fieldPath, content)
    }
    
    // Close inline editor
    setInlineEditorPosition(null)
    setActiveElement(null)
  }, [inlineEditorPosition, onContentUpdate, onTitleUpdate, onSubtitleUpdate, setActiveElement])
  
  // Close inline editor on escape or outside click
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && inlineEditorPosition) {
        setInlineEditorPosition(null)
        setActiveElement(null)
      }
    }
    
    const handleOutsideClick = (event: MouseEvent) => {
      if (inlineEditorPosition && overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        setInlineEditorPosition(null)
        setActiveElement(null)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleOutsideClick)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [inlineEditorPosition, setActiveElement])
  
  // Don't render if overlay is disabled
  if (!showOverlay) return null
  
  // Get current element content for inline editor
  const getCurrentContent = () => {
    if (!inlineEditorPosition) return ''
    
    const element = inlineEditorPosition.element
    const domElement = element.element as HTMLElement
    
    if (element.type === 'rich-text') {
      return domElement.innerHTML
    } else {
      return domElement.textContent || ''
    }
  }
  
  return (
    <>
      {/* Overlay indicators */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none z-10"
        data-visual-editor-overlay
      >
        {indicators.map((indicator) => (
          <div
            key={indicator.elementId}
            className={cn(
              "absolute transition-all duration-200 pointer-events-auto",
              "border-2 border-dashed rounded",
              indicator.isHovered && "border-primary/60 bg-primary/5",
              indicator.isActive && "border-primary bg-primary/10 shadow-lg"
            )}
            style={{
              left: indicator.bounds.left,
              top: indicator.bounds.top,
              width: indicator.bounds.width,
              height: indicator.bounds.height
            }}
            onClick={(e) => handleIndicatorClick(indicator, e)}
          >
            {/* Edit indicator tooltip */}
            {(indicator.isHovered || indicator.isActive) && (
              <div className="absolute -top-8 left-0 flex items-center gap-1 z-20">
                <Badge
                  variant="secondary" 
                  className="px-2 py-0.5 text-xs bg-primary text-primary-foreground"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  {indicator.sectionKey}
                </Badge>
                
                {/* Quick action buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0 bg-white shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleIndicatorClick(indicator, e)
                    }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Corner handle for visual feedback */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary border-2 border-white rounded-full shadow-sm" />
          </div>
        ))}
      </div>
      
      {/* Inline editor portal */}
      {inlineEditorPosition && containerRef.current && createPortal(
        <div
          className="absolute z-50 bg-white border border-primary/20 rounded-lg shadow-lg p-2 min-w-[200px]"
          style={{
            left: inlineEditorPosition.x,
            top: inlineEditorPosition.y - 60, // Position above the element
            maxWidth: Math.max(inlineEditorPosition.width, 200)
          }}
        >
          <InlineTextEditor
            content={getCurrentContent()}
            onUpdate={handleInlineUpdate}
            isEnabled={true}
            fieldPath={inlineEditorPosition.element.fieldPath}
            format={inlineEditorPosition.element.type === 'rich-text' ? 'rich' : 'plain'}
            placeholder="Click to edit..."
            className="min-h-[40px] p-2 border rounded"
            showToolbar={inlineEditorPosition.element.type === 'rich-text'}
          />
          
          {/* Close button */}
          <div className="flex justify-end mt-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setInlineEditorPosition(null)
                setActiveElement(null)
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                // Content is updated via InlineTextEditor's onUpdate
                setInlineEditorPosition(null)
                setActiveElement(null)
              }}
            >
              Save
            </Button>
          </div>
        </div>,
        containerRef.current
      )}
    </>
  )
}