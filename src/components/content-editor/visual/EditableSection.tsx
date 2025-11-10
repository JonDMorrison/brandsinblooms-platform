'use client'

import React, { useRef, useEffect, forwardRef, ReactNode } from 'react'
import { useVisualEditorHelpers } from '@/hooks/useVisualEditor'
import { ContentSection } from '@/src/lib/content/schema'
import { useIsVisualEditingEnabled } from '@/contexts/VisualEditorContext'
import { cn } from '@/src/lib/utils'

interface EditableSectionProps {
  sectionKey: string
  section: ContentSection
  children: ReactNode
  className?: string
  editableFields?: string[] // Specific fields that can be edited
  onSectionUpdate?: (sectionKey: string, section: ContentSection) => void
  label?: string // Display name for the section
}

interface EditableFieldProps {
  sectionKey: string
  fieldPath: string
  type?: 'text' | 'rich-text' | 'image' | 'icon'
  children: ReactNode
  className?: string
  placeholder?: string
}

/**
 * Wrapper component that makes a section editable in visual mode
 * Automatically registers editable elements and handles visual feedback
 */
export const EditableSection = forwardRef<HTMLDivElement, EditableSectionProps>(
  function EditableSection(
    { 
      sectionKey, 
      section, 
      children, 
      className, 
      editableFields = [],
      onSectionUpdate,
      label
    }, 
    ref
  ) {
    const isVisualEditingEnabled = useIsVisualEditingEnabled()
    const containerRef = useRef<HTMLDivElement>(null)
    const { getSectionContent } = useVisualEditorHelpers({})
    
    // Get section display label
    const sectionLabel = label || sectionKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    
    useEffect(() => {
      const container = containerRef.current
      if (!container || !isVisualEditingEnabled) return
      
      // Mark container as a section
      container.setAttribute('data-section', sectionKey)
      container.setAttribute('data-section-label', sectionLabel)
      
      // Add visual editing classes
      container.classList.add('visual-editor-section')
      
      return () => {
        container.classList.remove('visual-editor-section')
        container.removeAttribute('data-section')
        container.removeAttribute('data-section-label')
      }
    }, [sectionKey, sectionLabel, isVisualEditingEnabled])
    
    return (
      <div
        ref={ref || containerRef}
        className={cn(
          'visual-editor-section',
          isVisualEditingEnabled && 'relative',
          className
        )}
        data-section={sectionKey}
        data-section-label={sectionLabel}
        data-visible={section.visible !== false}
      >
        {/* Section content */}
        {children}
        
        {/* Visual editing styles for this section */}
        {isVisualEditingEnabled && (
          <style jsx>{`
            .visual-editor-section {
              transition: all 0.2s ease;
            }
            
            .visual-editor-section:hover {
              outline: 1px dashed rgba(139, 92, 246, 0.3);
              outline-offset: 4px;
            }
            
            /* Section label on hover */
            .visual-editor-section::after {
              content: attr(data-section-label);
              position: absolute;
              top: -20px;
              left: 0;
              font-size: 10px;
              font-weight: 600;
              color: rgba(139, 92, 246, 0.8);
              background: rgba(139, 92, 246, 0.1);
              padding: 2px 8px;
              border-radius: 12px;
              border: 1px solid rgba(139, 92, 246, 0.2);
              opacity: 0;
              pointer-events: none;
              transition: opacity 0.2s ease;
              white-space: nowrap;
              z-index: 10;
            }
            
            .visual-editor-section:hover::after {
              opacity: 1;
            }
            
            /* Hide labels for nested sections to avoid clutter */
            .visual-editor-section .visual-editor-section::after {
              display: none;
            }
          `}</style>
        )}
      </div>
    )
  }
)

/**
 * Wrapper for individual editable fields within a section
 * Registers the field for visual editing and provides hover states
 */
export const EditableField = forwardRef<HTMLDivElement, EditableFieldProps>(
  function EditableField(
    { 
      sectionKey, 
      fieldPath, 
      type = 'text', 
      children, 
      className, 
      placeholder = 'Click to edit...'
    }, 
    ref
  ) {
    const isVisualEditingEnabled = useIsVisualEditingEnabled()
    const fieldRef = useRef<HTMLDivElement>(null)
    const { registerElementFromRef } = useVisualEditorHelpers({})
    
    useEffect(() => {
      const element = fieldRef.current
      if (!element || !isVisualEditingEnabled) return
      
      // Register this element for visual editing
      const cleanup = registerElementFromRef(
        element, 
        sectionKey, 
        fieldPath, 
        type
      )
      
      // Mark element as editable
      element.setAttribute('data-editable', 'true')
      element.setAttribute('data-field', fieldPath)
      element.setAttribute('data-section', sectionKey)
      element.setAttribute('data-edit-type', type)
      element.setAttribute('data-placeholder', placeholder)
      
      // Add visual editing classes
      element.classList.add('visual-editor-field')
      
      return () => {
        cleanup?.()
        element.classList.remove('visual-editor-field')
        element.removeAttribute('data-editable')
        element.removeAttribute('data-field')
        element.removeAttribute('data-section')
        element.removeAttribute('data-edit-type')
        element.removeAttribute('data-placeholder')
      }
    }, [sectionKey, fieldPath, type, placeholder, isVisualEditingEnabled, registerElementFromRef])
    
    return (
      <div
        ref={ref || fieldRef}
        className={cn(
          'visual-editor-field',
          isVisualEditingEnabled && [
            'cursor-text transition-all duration-200',
            'hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10',
            'hover:outline hover:outline-2 hover:outline-primary/20 hover:outline-offset-1'
          ],
          className
        )}
        data-editable={isVisualEditingEnabled}
        data-field={fieldPath}
        data-section={sectionKey}
        data-edit-type={type}
        data-placeholder={placeholder}
      >
        {children}
        
        {/* Visual editing styles for fields */}
        {isVisualEditingEnabled && (
          <style jsx>{`
            .visual-editor-field {
              position: relative;
              border-radius: 4px;
            }
            
            .visual-editor-field:hover::before {
              content: 'Click to edit';
              position: absolute;
              top: -22px;
              right: 0;
              font-size: 9px;
              font-weight: 500;
              color: rgba(139, 92, 246, 0.7);
              background: rgba(139, 92, 246, 0.1);
              padding: 2px 6px;
              border-radius: 3px;
              border: 1px solid rgba(139, 92, 246, 0.2);
              white-space: nowrap;
              z-index: 20;
              opacity: 0;
              animation: fadeInTooltip 0.2s ease forwards;
            }
            
            @keyframes fadeInTooltip {
              from { opacity: 0; transform: translateY(-2px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            /* Active state styles */
            .visual-editor-field[data-editing="true"] {
              background: rgba(139, 92, 246, 0.1);
              outline: 2px solid rgba(139, 92, 246, 0.5);
              outline-offset: 2px;
              border-radius: 4px;
            }
            
            /* Empty field indicator */
            .visual-editor-field:empty::after {
              content: attr(data-placeholder);
              color: rgba(139, 92, 246, 0.5);
              font-style: italic;
              pointer-events: none;
            }
            
            /* Disable text selection when not editing */
            .visual-editor-field:not([data-editing="true"]) {
              user-select: none;
            }
          `}</style>
        )}
      </div>
    )
  }
)

/**
 * Helper component for text content that should be editable
 */
export const EditableText = ({ 
  sectionKey, 
  fieldPath, 
  content, 
  placeholder = 'Enter text...', 
  className,
  as: Component = 'div'
}: {
  sectionKey: string
  fieldPath: string
  content: string
  placeholder?: string
  className?: string
  as?: keyof JSX.IntrinsicElements
}) => {
  return (
    <EditableField
      sectionKey={sectionKey}
      fieldPath={fieldPath}
      type="text"
      className={className}
      placeholder={placeholder}
    >
      <Component className={className}>
        {content || ''}
      </Component>
    </EditableField>
  )
}

/**
 * Helper component for rich text content that should be editable
 */
export const EditableRichText = ({ 
  sectionKey, 
  fieldPath, 
  content, 
  placeholder = 'Enter rich text...', 
  className,
  as: Component = 'div'
}: {
  sectionKey: string
  fieldPath: string
  content: string
  placeholder?: string
  className?: string
  as?: keyof JSX.IntrinsicElements
}) => {
  return (
    <EditableField
      sectionKey={sectionKey}
      fieldPath={fieldPath}
      type="rich-text"
      className={className}
      placeholder={placeholder}
    >
      <Component 
        className={className}
        dangerouslySetInnerHTML={{ __html: content || '' }}
      />
    </EditableField>
  )
}

/**
 * Helper component for image content that should be editable
 */
export const EditableImage = ({ 
  sectionKey, 
  fieldPath, 
  src, 
  alt, 
  placeholder = 'Click to change image...', 
  className 
}: {
  sectionKey: string
  fieldPath: string
  src: string
  alt: string
  placeholder?: string
  className?: string
}) => {
  return (
    <EditableField
      sectionKey={sectionKey}
      fieldPath={fieldPath}
      type="image"
      className={className}
      placeholder={placeholder}
    >
      <img 
        src={src} 
        alt={alt} 
        className={className}
      />
    </EditableField>
  )
}