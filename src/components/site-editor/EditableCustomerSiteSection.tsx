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
    updateFeaturedContent,
    deleteFeaturedContent,
    updateCategoryContent,
    deleteCategoryContent,
    updateSectionSettings,
    addFeatureItem,
    deleteFeatureItem,
    addValueItem,
    deleteValueItem,
    addFAQItem,
    deleteFAQItem,
    addFeaturedContent,
    addCategoryContent,
    pageContent,
    siteId
  } = context

  // Handle settings save
  const handleSettingsSave = (settings: Record<string, unknown>, options?: { silent?: boolean }) => {
    updateSectionSettings(sectionKey, settings, options)
  }

  // Handle add item - dispatch to correct method based on section type
  const handleAddItem = (sectionKey: string, newItem: Record<string, unknown>) => {
    switch (section.type) {
      case 'features':
        addFeatureItem(sectionKey, newItem)
        break
      case 'values':
        addValueItem(sectionKey, newItem)
        break
      case 'faq':
        addFAQItem(sectionKey, newItem)
        break
      case 'hero':
        // Hero uses same data.features structure as Features section
        addFeatureItem(sectionKey, newItem)
        break
      case 'featured':
        addFeaturedContent(sectionKey, newItem)
        break
      case 'categories':
        addCategoryContent(sectionKey, newItem)
        break
      default:
        console.warn(`[EditableCustomerSiteSection] Add item not supported for section type: ${section.type}`)
    }
  }

  // Handle delete item - dispatch to correct method based on section type
  const handleDeleteItem = (sectionKey: string, itemIndex: number) => {
    switch (section.type) {
      case 'features':
        deleteFeatureItem(sectionKey, itemIndex)
        break
      case 'values':
        deleteValueItem(sectionKey, itemIndex)
        break
      case 'faq':
        deleteFAQItem(sectionKey, itemIndex)
        break
      case 'hero':
        // Hero uses same data.features structure as Features section
        deleteFeatureItem(sectionKey, itemIndex)
        break
      case 'featured':
        deleteFeaturedContent(sectionKey, itemIndex)
        break
      case 'categories':
        deleteCategoryContent(sectionKey, itemIndex)
        break
      default:
        console.warn(`[EditableCustomerSiteSection] Delete item not supported for section type: ${section.type}`)
    }
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
            siteId={siteId}
            // No onContentUpdate or onFeatureUpdate = no inline editing
          />
        </div>
      )
    }

    // In Edit mode: render PreviewComponent WITH edit callbacks (editing enabled)
    const isHidden = mergedSection.visible === false

    return (
      <>
      <div
        className={`relative ${className} ${isHidden ? 'opacity-50' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setActiveSection(sectionKey)}
        data-section-key={sectionKey}
        data-edit-mode="edit"
        data-section-hidden={isHidden}
        style={{
          outline: isHovered ? '2px dashed rgba(59, 130, 246, 0.5)' : 'none',
          outlineOffset: '4px',
          transition: 'outline 0.2s ease, opacity 0.2s ease'
        }}
      >
        {/* Hidden Section Badge */}
        {isHidden && (
          <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded shadow-lg">
            Hidden
          </div>
        )}

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
          siteId={siteId}
          onContentUpdate={(key, fieldPath, content) => {
            updateFieldContent(key, fieldPath, content)
          }}
          onFeatureUpdate={(key, featureIndex, field, value) => {
            updateFeatureContent(key, featureIndex, field, value)
          }}
          onFeaturedUpdate={(key, itemIndex, updatedItem) => {
            updateFeaturedContent(key, itemIndex, updatedItem)
          }}
          onFeaturedDelete={(key, itemIndex) => {
            deleteFeaturedContent(key, itemIndex)
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
        onAddItem={handleAddItem}
        onDeleteItem={handleDeleteItem}
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
  const isFallbackHidden = section.visible === false

  return (
    <>
      <div
        className={`relative ${className} ${isFallbackHidden ? 'opacity-50' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setActiveSection(sectionKey)}
        data-section-key={sectionKey}
        data-edit-mode="true"
        data-section-hidden={isFallbackHidden}
        style={{
          outline: showControls ? '2px dashed rgba(59, 130, 246, 0.5)' : 'none',
          outlineOffset: '4px',
          transition: 'outline 0.2s ease, opacity 0.2s ease'
        }}
      >
        {/* Hidden Section Badge */}
        {isFallbackHidden && (
          <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded shadow-lg">
            Hidden
          </div>
        )}

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
        onAddItem={handleAddItem}
        onDeleteItem={handleDeleteItem}
      />
    </>
  )
}
