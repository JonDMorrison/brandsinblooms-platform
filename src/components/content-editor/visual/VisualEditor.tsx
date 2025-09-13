'use client'

import React, { memo, useCallback, useRef, useEffect } from 'react'
import { PageContent, LayoutType } from '@/lib/content/schema'
import { useVisualEditorHelpers } from '@/hooks/useVisualEditor'
import { EditOverlay } from './EditOverlay'
import { VisualEditorToolbar } from './VisualEditorToolbar'
import { useSiteTheme } from '@/hooks/useSiteTheme'

// Import layout preview components for visual editing
import { LandingPagePreview } from '@/components/layout-previews/LandingPagePreview'
import { BlogArticlePreview } from '@/components/layout-previews/BlogArticlePreview'
import { PortfolioGridPreview } from '@/components/layout-previews/PortfolioGridPreview'
import { AboutCompanyPreview } from '@/components/layout-previews/AboutCompanyPreview'
import { ProductPagePreview } from '@/components/layout-previews/ProductPagePreview'
import { ContactServicesPreview } from '@/components/layout-previews/ContactServicesPreview'
import { OtherLayoutPreview } from '@/components/layout-previews/OtherLayoutPreview'

interface VisualEditorProps {
  content: PageContent
  layout: LayoutType
  title?: string
  subtitle?: string
  onContentChange: (content: PageContent) => void
  onTitleChange?: (title: string) => void
  onSubtitleChange?: (subtitle: string) => void
  className?: string
  viewport?: 'mobile' | 'tablet' | 'desktop'
}

const layoutComponents = {
  landing: LandingPagePreview,
  blog: BlogArticlePreview,
  portfolio: PortfolioGridPreview,
  about: AboutCompanyPreview,
  product: ProductPagePreview,
  contact: ContactServicesPreview,
  other: OtherLayoutPreview
}

const VisualEditorContent = memo(function VisualEditorContent({
  content,
  layout,
  title,
  subtitle,
  onContentChange,
  onTitleChange,
  onSubtitleChange,
  className,
  viewport = 'desktop'
}: VisualEditorProps) {
  const { theme } = useSiteTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  
  const {
    updateContent,
    handleElementClick,
    handleElementHover
  } = useVisualEditorHelpers({
    content,
    onContentChange
  })
  
  // Handle content updates from inline editors
  const handleInlineContentUpdate = useCallback((fieldPath: string, newContent: string) => {
    updateContent(fieldPath, newContent)
  }, [updateContent])
  
  // Handle title/subtitle updates
  const handleTitleUpdate = useCallback((newTitle: string) => {
    if (onTitleChange) {
      onTitleChange(newTitle)
    } else {
      updateContent('title', newTitle)
    }
  }, [onTitleChange, updateContent])
  
  const handleSubtitleUpdate = useCallback((newSubtitle: string) => {
    if (onSubtitleChange) {
      onSubtitleChange(newSubtitle)
    } else {
      updateContent('subtitle', newSubtitle)
    }
  }, [onSubtitleChange, updateContent])
  
  // Get the appropriate preview component
  const PreviewComponent = layoutComponents[layout]
  
  // Setup viewport-specific styles
  const getViewportStyles = () => {
    const baseStyles = {
      backgroundColor: theme?.colors?.background || '#FFFFFF',
      backgroundImage: theme?.colors?.primary && theme?.colors?.secondary 
        ? `linear-gradient(to bottom right, ${theme.colors.primary}33, ${theme.colors.secondary}33)`
        : undefined
    }
    
    switch (viewport) {
      case 'mobile':
        return { 
          ...baseStyles, 
          maxWidth: '390px', 
          margin: '0 auto',
          minHeight: '600px' 
        }
      case 'tablet':
        return { 
          ...baseStyles, 
          maxWidth: '768px', 
          margin: '0 auto',
          minHeight: '600px' 
        }
      default:
        return { 
          ...baseStyles, 
          width: '100%',
          height: '100%' 
        }
    }
  }
  
  // Register click and hover handlers for the container with AbortController
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create AbortController for cleanup
    const abortController = new AbortController()
    const { signal } = abortController
    
    const handleContainerClick = (event: MouseEvent) => {
      // Handle clicks on editable elements
      const target = event.target as HTMLElement
      const editableElement = target.closest('[data-editable="true"]')
      
      if (editableElement) {
        const fieldPath = editableElement.getAttribute('data-field')
        const sectionKey = editableElement.getAttribute('data-section')
        const editType = editableElement.getAttribute('data-edit-type') as any
        
        if (fieldPath && sectionKey) {
          const bounds = editableElement.getBoundingClientRect()
          const elementData = {
            id: `${sectionKey}:${fieldPath}`,
            sectionKey,
            fieldPath,
            type: editType || 'text',
            element: editableElement as HTMLElement,
            bounds
          }
          
          handleElementClick(event, elementData)
        }
      }
    }
    
    const handleContainerMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const editableElement = target.closest('[data-editable="true"]')
      
      if (editableElement) {
        const fieldPath = editableElement.getAttribute('data-field')
        const sectionKey = editableElement.getAttribute('data-section')
        const editType = editableElement.getAttribute('data-edit-type') as any
        
        if (fieldPath && sectionKey) {
          const bounds = editableElement.getBoundingClientRect()
          const elementData = {
            id: `${sectionKey}:${fieldPath}`,
            sectionKey,
            fieldPath,
            type: editType || 'text',
            element: editableElement as HTMLElement,
            bounds
          }
          
          handleElementHover(event, elementData)
        }
      }
    }
    
    const handleContainerMouseLeave = (event: MouseEvent) => {
      handleElementHover(event, null)
    }
    
    // Use AbortController signal for automatic cleanup
    container.addEventListener('click', handleContainerClick, { signal })
    container.addEventListener('mouseover', handleContainerMouseOver, { signal })
    container.addEventListener('mouseleave', handleContainerMouseLeave, { signal })
    
    return () => {
      // AbortController automatically removes all event listeners
      abortController.abort()
    }
  }, [handleElementClick, handleElementHover])
  
  return (
    <div className={`visual-editor-container relative ${className || ''}`}>      
      {/* Preview Container with Click Detection */}
      <div
        ref={containerRef}
        className="visual-editor-preview"
        style={{
          ...getViewportStyles(),
          // height: 'calc(100% - 2.5rem - 2rem)' // Subtract visual editor controls and status bar only
        }}
        data-visual-editor="true"
      >
        <PreviewComponent
          title={title}
          subtitle={subtitle}
          content={content}
        />
      </div>
      
      {/* Edit Overlay for Visual Indicators */}
      <EditOverlay
        containerRef={containerRef}
        onContentUpdate={handleInlineContentUpdate}
        onTitleUpdate={handleTitleUpdate}
        onSubtitleUpdate={handleSubtitleUpdate}
      />
      
      {/* Visual Editor Styles */}
      <style jsx>{`
        .visual-editor-container {
          position: relative;
          overflow: hidden;
          height: 100%;
          width: 100%;
        }
        
        .visual-editor-preview {
          position: relative;
          overflow-y: auto;
          height: 100%;
          width: 100%;
        }
        
        /* Visual indicators for editable content */
        .visual-editor-preview :global([data-editable="true"]) {
          position: relative;
          cursor: text;
          transition: all 0.2s ease;
        }
        
        .visual-editor-preview :global([data-editable="true"]:hover) {
          background-color: rgba(139, 92, 246, 0.05);
          outline: 2px solid rgba(139, 92, 246, 0.2);
          outline-offset: 2px;
        }
        
        .visual-editor-preview :global([data-editable="true"][data-editing="true"]) {
          background-color: rgba(139, 92, 246, 0.1);
          outline: 2px solid rgba(139, 92, 246, 0.5);
          outline-offset: 2px;
        }
        
        /* Highlight animation */
        .visual-editor-preview :global(.visual-editor-highlight) {
          animation: highlight-flash 1s ease-out;
        }
        
        @keyframes highlight-flash {
          0% {
            background-color: rgba(139, 92, 246, 0.3);
          }
          100% {
            background-color: transparent;
          }
        }
        
        /* Section boundaries in visual mode */
        .visual-editor-preview :global([data-section]) {
          position: relative;
        }
        
        .visual-editor-preview :global([data-section]::before) {
          content: attr(data-section-label);
          position: absolute;
          top: -24px;
          left: 0;
          font-size: 10px;
          font-weight: 500;
          color: rgba(139, 92, 246, 0.7);
          background: rgba(139, 92, 246, 0.1);
          padding: 2px 6px;
          border-radius: 3px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
          z-index: 10;
        }
        
        .visual-editor-preview :global([data-section]:hover::before) {
          opacity: 1;
        }
      `}</style>
    </div>
  )
})

export const VisualEditor = VisualEditorContent