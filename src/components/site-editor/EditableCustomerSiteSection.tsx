'use client'

/**
 * Editable Customer Site Section
 * Wraps CustomerSiteSection with edit mode capabilities
 * In edit mode: renders preview component with inline editing
 * In navigate mode: renders plain CustomerSiteSection
 */

import React, { useState, ReactNode, useContext } from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { FullSiteEditorContext, useIsEditModeActive } from '@/src/contexts/FullSiteEditorContext'
import { SectionControls } from './SectionControls'
import { getPreviewComponent } from './section-preview-map'

interface EditableCustomerSiteSectionProps {
  children: ReactNode
  sectionKey: string
  section: ContentSection
  sectionData?: any
  className?: string
}

export function EditableCustomerSiteSection({
  children,
  sectionKey,
  section,
  sectionData,
  className = ''
}: EditableCustomerSiteSectionProps) {
  const isEditMode = useIsEditModeActive()
  const context = useContext(FullSiteEditorContext)
  const [isHovered, setIsHovered] = useState(false)

  // If not in edit mode or no context available, just render children (CustomerSiteSection)
  if (!isEditMode || !context) {
    return <>{children}</>
  }

  // Destructure context values safely after checking context exists
  const {
    editorMode,
    activeSection,
    setActiveSection,
    updateFieldContent,
    updateFeatureContent
  } = context

  // If in navigate mode, render children without editing
  if (editorMode === 'navigate') {
    return <>{children}</>
  }

  // In edit mode: render preview component with inline editing
  const PreviewComponent = getPreviewComponent(section.type)

  if (PreviewComponent && sectionData) {
    // Render preview component with inline editing capabilities
    return (
      <div
        className={`relative ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setActiveSection(sectionKey)}
        data-section-key={sectionKey}
        data-edit-mode="true"
        style={{
          outline: isHovered ? '2px dashed rgba(59, 130, 246, 0.5)' : 'none',
          outlineOffset: '4px',
          transition: 'outline 0.2s ease'
        }}
      >
        {/* Section Controls Overlay */}
        {isHovered && (
          <SectionControls
            sectionKey={sectionKey}
            section={section}
          />
        )}

        {/* Preview Component with Inline Editing */}
        <PreviewComponent
          section={section}
          sectionKey={sectionKey}
          onContentUpdate={(key, fieldPath, content) => {
            updateFieldContent(key, fieldPath, content)
          }}
          onFeatureUpdate={(key, featureIndex, field, value) => {
            updateFeatureContent(key, featureIndex, field, value)
          }}
        />
      </div>
    )
  }

  // Fallback: render children with controls (no preview component available)
  const isActive = activeSection === sectionKey
  const showControls = (isHovered || isActive)

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setActiveSection(sectionKey)}
      data-section-key={sectionKey}
      data-edit-mode="true"
      style={{
        outline: showControls ? '2px dashed rgba(59, 130, 246, 0.5)' : 'none',
        outlineOffset: '4px',
        transition: 'outline 0.2s ease'
      }}
    >
      {/* Section Controls Overlay */}
      {showControls && (
        <SectionControls
          sectionKey={sectionKey}
          section={section}
        />
      )}

      {/* Section Content */}
      {children}
    </div>
  )
}
