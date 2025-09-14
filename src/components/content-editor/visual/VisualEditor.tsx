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
  
  // Handle content updates from section-based inline editors
  const handleSectionContentUpdate = useCallback((sectionKey: string, fieldPath: string, newContent: string) => {
    // Create full field path for updateContent
    const fullFieldPath = `sections.${sectionKey}.${fieldPath}`
    updateContent(fullFieldPath, newContent)
  }, [updateContent])
  
  // Handle feature array updates (custom handler for arrays)
  const handleFeatureUpdate = useCallback((sectionKey: string, featureIndex: number, newContent: string) => {
    if (!content || !onContentChange) return
    
    const section = content.sections[sectionKey]
    if (!section || !section.data.features || !Array.isArray(section.data.features)) return
    
    // Create updated features array
    const updatedFeatures = [...section.data.features]
    updatedFeatures[featureIndex] = newContent
    
    // Create updated content with new features array
    const updatedContent = {
      ...content,
      sections: {
        ...content.sections,
        [sectionKey]: {
          ...section,
          data: {
            ...section.data,
            features: updatedFeatures
          }
        }
      }
    }
    
    onContentChange(updatedContent)
  }, [content, onContentChange])
  
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
      backgroundColor: 'var(--theme-background, #FFFFFF)'
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

  // Get viewport-specific CSS class for responsive overrides
  const getViewportClassName = () => {
    switch (viewport) {
      case 'mobile':
        return 'preview-mobile-viewport'
      case 'tablet':
        return 'preview-tablet-viewport'
      default:
        return 'preview-desktop-viewport'
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
      // Prevent navigation for all links and buttons in preview mode
      const target = event.target as HTMLElement
      const inlineEditor = target.closest('.inline-editor-wrapper')
      const clickableElement = target.closest('a, button')
      
      if (clickableElement && !inlineEditor) {
        event.preventDefault()
        event.stopPropagation()
        // Add visual feedback for preview mode
        clickableElement.classList.add('preview-clicked')
        setTimeout(() => {
          clickableElement.classList.remove('preview-clicked')
        }, 200)
        return
      }

      // Handle clicks on editable elements
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
        className={`visual-editor-preview ${getViewportClassName()}`}
        style={{
          ...getViewportStyles(),
          // height: 'calc(100% - 2.5rem - 2rem)' // Subtract visual editor controls and status bar only
        }}
        data-visual-editor="true"
        data-preview-mode="true"
      >
        <PreviewComponent
          title={layout === 'landing' ? undefined : title}
          subtitle={layout === 'landing' ? undefined : subtitle}
          content={content}
          onContentUpdate={handleSectionContentUpdate}
          onFeatureUpdate={handleFeatureUpdate}
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
        
        /* Viewport-specific responsive overrides */
        .visual-editor-preview.preview-mobile-viewport :global(.text-4xl) {
          font-size: 2.25rem !important;
        }
        
        .visual-editor-preview.preview-mobile-viewport :global(.md\\:text-6xl) {
          font-size: 2.25rem !important;
        }
        
        .visual-editor-preview.preview-mobile-viewport :global(.text-xl) {
          font-size: 1rem !important;
        }
        
        .visual-editor-preview.preview-mobile-viewport :global(.md\\:text-2xl) {
          font-size: 1rem !important;
        }
        
        .visual-editor-preview.preview-mobile-viewport :global(.grid-cols-2) {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        
        .visual-editor-preview.preview-mobile-viewport :global(.md\\:grid-cols-4) {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        
        /* Featured section grid overrides for mobile */
        .visual-editor-preview.preview-mobile-viewport :global(.md\\:grid-cols-2) {
          grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
        }
        
        .visual-editor-preview.preview-mobile-viewport :global(.lg\\:grid-cols-4) {
          grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
        }
        
        /* Override all grid layouts in mobile viewport */
        .visual-editor-preview.preview-mobile-viewport :global(.grid[class*="grid-cols"]) {
          grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
        }
        
        .visual-editor-preview.preview-mobile-viewport :global(.flex-col) {
          flex-direction: column !important;
        }
        
        .visual-editor-preview.preview-mobile-viewport :global(.sm\\:flex-row) {
          flex-direction: column !important;
        }
        
        .visual-editor-preview.preview-mobile-viewport :global(.py-20) {
          padding-top: 3rem !important;
          padding-bottom: 3rem !important;
        }
        
        .visual-editor-preview.preview-mobile-viewport :global(.lg\\:py-32) {
          padding-top: 3rem !important;
          padding-bottom: 3rem !important;
        }
        
        .visual-editor-preview.preview-tablet-viewport :global(.text-4xl) {
          font-size: 2.25rem !important;
        }
        
        .visual-editor-preview.preview-tablet-viewport :global(.md\\:text-6xl) {
          font-size: 3rem !important;
        }
        
        .visual-editor-preview.preview-tablet-viewport :global(.text-xl) {
          font-size: 1.125rem !important;
        }
        
        .visual-editor-preview.preview-tablet-viewport :global(.md\\:text-2xl) {
          font-size: 1.5rem !important;
        }
        
        .visual-editor-preview.preview-tablet-viewport :global(.grid-cols-2) {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        
        .visual-editor-preview.preview-tablet-viewport :global(.md\\:grid-cols-4) {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        
        /* Featured section grid overrides for tablet */
        .visual-editor-preview.preview-tablet-viewport :global(.md\\:grid-cols-2) {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        
        .visual-editor-preview.preview-tablet-viewport :global(.lg\\:grid-cols-4) {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        
        /* Override all responsive grid layouts in tablet viewport */
        .visual-editor-preview.preview-tablet-viewport :global(.grid[class*="lg:grid-cols"]) {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        
        .visual-editor-preview.preview-tablet-viewport :global(.flex-col) {
          flex-direction: column !important;
        }
        
        .visual-editor-preview.preview-tablet-viewport :global(.sm\\:flex-row) {
          flex-direction: row !important;
        }
        
        .visual-editor-preview.preview-tablet-viewport :global(.py-20) {
          padding-top: 5rem !important;
          padding-bottom: 5rem !important;
        }
        
        .visual-editor-preview.preview-tablet-viewport :global(.lg\\:py-32) {
          padding-top: 5rem !important;
          padding-bottom: 5rem !important;
        }
        
        /* Preview mode interactive elements */
        .visual-editor-preview :global(a),
        .visual-editor-preview :global(button) {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .visual-editor-preview :global(a:hover),
        .visual-editor-preview :global(button:hover) {
          transform: translateY(-1px);
          opacity: 0.9;
        }
        
        .visual-editor-preview :global(.preview-clicked) {
          transform: scale(0.98);
          opacity: 0.8;
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