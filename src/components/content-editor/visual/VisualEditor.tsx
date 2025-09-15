'use client'

import React, { memo } from 'react'
import { PageContent, LayoutType } from '@/lib/content/schema'
import { useVisualEditorHelpers } from '@/hooks/useVisualEditor'
import { useSiteTheme } from '@/hooks/useSiteTheme'

// Import extracted utilities and hooks
import { 
  getViewportContainerStyles, 
  getViewportClassName,
  ViewportMode
} from './utils/viewport-utils'
import { 
  getViewportStyles,
  getVisualFeedbackStyles
} from './styles'
import { 
  useVisualEventHandling,
  ElementData
} from './hooks'
import { 
  createContentUpdateHandlers
} from './utils/content-updates'

// Import component dependencies
import { EditOverlay } from './EditOverlay'

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
  viewport?: ViewportMode
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
  
  // Get visual editor helpers
  const {
    updateContent,
    handleElementClick,
    handleElementHover
  } = useVisualEditorHelpers({
    content,
    onContentChange
  })
  
  // Create content update handlers using the extracted utility
  const {
    handleInlineContentUpdate,
    handleSectionContentUpdate,
    handleFeatureUpdate,
    handleTitleUpdate: updateTitle,
    handleSubtitleUpdate: updateSubtitle
  } = createContentUpdateHandlers(content, onContentChange, updateContent)
  
  // Wrap title/subtitle handlers to pass the callback functions
  const handleTitleUpdateWrapper = (newTitle: string) => {
    updateTitle(newTitle, onTitleChange)
  }
  
  const handleSubtitleUpdateWrapper = (newSubtitle: string) => {
    updateSubtitle(newSubtitle, onSubtitleChange)
  }
  
  // Setup event handling with extracted hooks
  const { containerRef } = useVisualEventHandling({
    onElementClick: handleElementClick,
    onElementHover: handleElementHover
  })
  
  // Get the appropriate preview component
  const PreviewComponent = layoutComponents[layout]
  
  // Get viewport-specific styles using extracted utilities
  const viewportContainerStyles = getViewportContainerStyles(viewport)
  const viewportClassName = getViewportClassName(viewport)
  
  // Event handling is now managed by useVisualEventHandling hook
  
  return (
    <div className={`visual-editor-container relative ${className || ''}`}>      
      {/* Preview Container with Click Detection */}
      <div
        ref={containerRef}
        className={`visual-editor-preview ${viewportClassName} @container`}
        style={viewportContainerStyles}
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
        onTitleUpdate={handleTitleUpdateWrapper}
        onSubtitleUpdate={handleSubtitleUpdateWrapper}
      />
      
      {/* Extracted Styles */}
      <style jsx>{`${getViewportStyles(viewport)}`}</style>
      <style jsx global>{`${getVisualFeedbackStyles()}`}</style>
    </div>
  )
})

export const VisualEditor = VisualEditorContent