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
import { SectionSettingsModal } from './modals/SectionSettingsModal'

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
  const [showSettingsModal, setShowSettingsModal] = useState(false)

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
    updateFeatureContent,
    updateSectionSettings,
    pageContent
  } = context

  // Handle settings save
  const handleSettingsSave = (settings: Record<string, unknown>) => {
    updateSectionSettings(sectionKey, settings)
  }

  // Get fresh section data from context (includes staged/unsaved changes)
  // This ensures both Edit and Navigate modes show the same staged content
  const contextSectionData = pageContent?.sections?.[sectionKey]

  // Merge context data with prop data (context takes precedence for staged changes)
  const mergedSection: ContentSection = contextSectionData
    ? {
        ...section,
        data: contextSectionData.data,
        visible: contextSectionData.visible ?? section.visible,
        settings: contextSectionData.settings ?? section.settings
      }
    : section

  // Use context data if available, otherwise fall back to prop data
  const activeSectionData = contextSectionData?.data ?? sectionData

  // Try to get PreviewComponent for this section type
  const PreviewComponent = getPreviewComponent(section.type)

  // If we have a PreviewComponent and section data, use it for both Edit and Navigate modes
  // This ensures staged changes are visible in both modes
  if (PreviewComponent && activeSectionData) {
    // In Navigate mode: render PreviewComponent WITHOUT edit callbacks (preview only)
    if (editorMode === 'navigate') {
      return (
        <div
          className={`relative ${className}`}
          data-section-key={sectionKey}
          data-edit-mode="navigate"
        >
          {/* Preview Component in Navigate Mode - No editing, just preview of staged changes */}
          <PreviewComponent
            section={mergedSection}
            sectionKey={sectionKey}
            // No onContentUpdate or onFeatureUpdate = no inline editing
          />
        </div>
      )
    }

    // In Edit mode: render PreviewComponent WITH edit callbacks (editing enabled)
    return (
      <>
      <div
        className={`relative ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setActiveSection(sectionKey)}
        data-section-key={sectionKey}
        data-edit-mode="edit"
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
            section={mergedSection}
            onSettingsClick={() => setShowSettingsModal(true)}
          />
        )}

        {/* Preview Component with Inline Editing */}
        <PreviewComponent
          section={mergedSection}
          sectionKey={sectionKey}
          onContentUpdate={(key, fieldPath, content) => {
            updateFieldContent(key, fieldPath, content)
          }}
          onFeatureUpdate={(key, featureIndex, field, value) => {
            updateFeatureContent(key, featureIndex, field, value)
          }}
        />
      </div>

      {/* Settings Modal - rendered outside conditional to prevent unmounting on hover loss */}
      <SectionSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        section={mergedSection}
        sectionKey={sectionKey}
        onSave={handleSettingsSave}
      />
    </>
    )
  }

  // Fallback: No PreviewComponent available
  // In Navigate mode, render children without editing UI
  if (editorMode === 'navigate') {
    return <>{children}</>
  }

  // Fallback: render children with controls (no preview component available)
  const isActive = activeSection === sectionKey
  const showControls = (isHovered || isActive)

  return (
    <>
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
            onSettingsClick={() => setShowSettingsModal(true)}
          />
        )}

        {/* Section Content */}
        {children}
      </div>

      {/* Settings Modal - rendered outside conditional to prevent unmounting on hover loss */}
      <SectionSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        section={section}
        sectionKey={sectionKey}
        onSave={handleSettingsSave}
      />
    </>
  )
}
