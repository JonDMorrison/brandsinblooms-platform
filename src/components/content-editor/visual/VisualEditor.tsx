'use client'

import React, { memo } from 'react'
import { PageContent, LayoutType } from '@/src/lib/content/schema'
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

// Import unified layout preview component
import { UnifiedPagePreview } from '@/components/layout-previews/UnifiedPagePreview'
import { BlockPickerModal } from '@/src/components/content-editor/block-picker/BlockPickerModal'
import { createDefaultSection } from '@/src/lib/content/sections'
import { useState } from 'react'

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
  landing: UnifiedPagePreview,
  blog: UnifiedPagePreview,
  portfolio: UnifiedPagePreview,
  about: UnifiedPagePreview,
  product: UnifiedPagePreview,
  contact: UnifiedPagePreview,
  other: UnifiedPagePreview
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
  const [isBlockPickerOpen, setIsBlockPickerOpen] = useState(false)
  const [insertIndex, setInsertIndex] = useState<number | null>(null)

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
    handleValueUpdate,
    handleCategoryUpdate,
    handleCategoryDelete,
    handleFeaturedUpdate,
    handleFeaturedDelete,
    handleFAQUpdate,
    handleFAQDelete,
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
    <>
      <div className={`visual-editor-container relative ${className || ''}`}>
        {/* Preview Container with Click Detection */}
        <div
          ref={containerRef}
          className={viewportClassName}
          style={viewportContainerStyles}
          data-visual-editor="true"
          data-preview-mode="true"
        >
          <PreviewComponent
            layout={layout}
            title={title}
            subtitle={subtitle}
            content={content}
            onContentUpdate={handleSectionContentUpdate}
            onFeatureUpdate={handleFeatureUpdate}
            onValueUpdate={handleValueUpdate}
            onCategoryUpdate={handleCategoryUpdate}
            onCategoryDelete={handleCategoryDelete}
            onFeaturedUpdate={handleFeaturedUpdate}
            onFeaturedDelete={handleFeaturedDelete}
            onFAQUpdate={handleFAQUpdate}
            onFAQDelete={handleFAQDelete}
            onAddSection={(index) => {
              setInsertIndex(index)
              setIsBlockPickerOpen(true)
            }}
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

      <BlockPickerModal
        open={isBlockPickerOpen}
        onClose={() => setIsBlockPickerOpen(false)}
        onSelect={(type) => {
          const newSection = createDefaultSection(type)

          // Insert section at index
          const newSections = [...content.sections]
          newSections.splice(insertIndex ?? newSections.length, 0, newSection)

          onContentChange({
            ...content,
            sections: newSections
          })

          setIsBlockPickerOpen(false)
        }}
      />
    </>
  )
})

export const VisualEditor = VisualEditorContent