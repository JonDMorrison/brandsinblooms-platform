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
import { DeleteSectionModal } from './modals/DeleteSectionModal'
import { SectionInsertButton } from './SectionInsertButton'
import { AddSectionModal } from './AddSectionModal'

interface EditableCustomerSiteSectionProps {
  children: ReactNode
  sectionKey: string
  section: ContentSection
  sectionData?: any
  className?: string
}

export const EditableCustomerSiteSection = React.memo(function EditableCustomerSiteSection({
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddSectionModal, setShowAddSectionModal] = useState(false)
  const [insertPosition, setInsertPosition] = useState<'above' | 'below'>('below')

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
    updateSectionContent,
    addFeatureItem,
    deleteFeatureItem,
    addValueItem,
    deleteValueItem,
    addFAQItem,
    deleteFAQItem,
    addFeaturedContent,
    addCategoryContent,
    addSection,
    pageContent,
    layout,
    siteId
  } = context

  // Handle settings save
  const handleSettingsSave = (settings: Record<string, unknown>, options?: { silent?: boolean }) => {
    updateSectionSettings(sectionKey, settings, options)
  }

  // Handle data update - merge updates into section data
  const handleDataUpdate = (updates: Record<string, unknown>) => {
    const currentSection = pageContent?.sections?.[sectionKey]
    if (!currentSection) return

    const mergedData = {
      ...currentSection.data,
      ...updates
    }

    updateSectionContent(sectionKey, mergedData)
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
    }
  }

  // Handle delete section
  const handleDeleteSection = () => {
    context.deleteSection(sectionKey)
  }

  // Handle insert section button click
  const handleInsertClick = (position: 'above' | 'below') => {
    setInsertPosition(position)
    setShowAddSectionModal(true)
  }

  // Handle section type selection from modal
  const handleAddSection = (sectionType: string, variant?: string) => {
    const positionParam = insertPosition === 'above'
      ? { before: sectionKey }
      : { after: sectionKey }

    addSection(sectionType as any, variant, positionParam)
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
      // Don't render hidden sections in Navigate mode (matches logged-out customer site behavior)
      if (mergedSection.visible === false) {
        return null
      }

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
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Insert Above Button */}
        {editorMode === 'edit' && (
          <SectionInsertButton
            position="above"
            relativeTo={sectionKey}
            onInsert={() => handleInsertClick('above')}
            visible={isHovered}
          />
        )}

        <div
          className={`relative ${className} ${isHidden ? 'opacity-50' : ''}`}
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
            onDeleteClick={() => setShowDeleteModal(true)}
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
          onFeaturedUpdate={(key: string, itemIndex: number, updatedItem: Record<string, unknown>) => {
            updateFeaturedContent(key, itemIndex, updatedItem)
          }}
          onFeaturedDelete={(key: string, itemIndex: number) => {
            deleteFeaturedContent(key, itemIndex)
          }}
        />
      </div>

      {/* Insert Below Button */}
      {editorMode === 'edit' && (
        <SectionInsertButton
          position="below"
          relativeTo={sectionKey}
          onInsert={() => handleInsertClick('below')}
          visible={isHovered}
        />
      )}
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
        onDataUpdate={handleDataUpdate}
      />

      {/* Delete Modal - rendered outside conditional to prevent unmounting on hover loss */}
      <DeleteSectionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        sectionKey={sectionKey}
        sectionType={mergedSection.type}
        onConfirm={handleDeleteSection}
      />

      {/* Add Section Modal - for inserting sections above/below */}
      <AddSectionModal
        isOpen={showAddSectionModal}
        onClose={() => setShowAddSectionModal(false)}
        currentLayout={layout}
        existingSections={pageContent ? Object.keys(pageContent.sections) : []}
        onAddSection={handleAddSection}
      />
    </>
    )
  }

  // Fallback: No PreviewComponent available
  // In Navigate mode, render children without editing UI
  if (editorMode === 'navigate') {
    // Don't render hidden sections in Navigate mode (matches logged-out customer site behavior)
    if (mergedSection.visible === false) {
      return null
    }

    return <>{children}</>
  }

  // Fallback: render children with controls (no preview component available)
  const isActive = activeSection === sectionKey
  const showControls = (isHovered || isActive)
  const isFallbackHidden = section.visible === false

  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Insert Above Button */}
        {editorMode === 'edit' && (
          <SectionInsertButton
            position="above"
            relativeTo={sectionKey}
            onInsert={() => handleInsertClick('above')}
            visible={isHovered}
          />
        )}

        <div
          className={`relative ${className} ${isFallbackHidden ? 'opacity-50' : ''}`}
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
            onDeleteClick={() => setShowDeleteModal(true)}
          />
        )}

        {/* Section Content */}
        {children}
      </div>

      {/* Insert Below Button */}
      {editorMode === 'edit' && (
        <SectionInsertButton
          position="below"
          relativeTo={sectionKey}
          onInsert={() => handleInsertClick('below')}
          visible={isHovered}
        />
      )}
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
        onDataUpdate={handleDataUpdate}
      />

      {/* Delete Modal - rendered outside conditional to prevent unmounting on hover loss */}
      <DeleteSectionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        sectionKey={sectionKey}
        sectionType={section.type}
        onConfirm={handleDeleteSection}
      />

      {/* Add Section Modal - for inserting sections above/below */}
      <AddSectionModal
        isOpen={showAddSectionModal}
        onClose={() => setShowAddSectionModal(false)}
        currentLayout={layout}
        existingSections={pageContent ? Object.keys(pageContent.sections) : []}
        onAddSection={handleAddSection}
      />
    </>
  )
}, (prevProps, nextProps) => {
  // Only re-render if key props actually changed
  return (
    prevProps.sectionKey === nextProps.sectionKey &&
    prevProps.section.visible === nextProps.section.visible &&
    prevProps.section.type === nextProps.section.type &&
    prevProps.className === nextProps.className &&
    JSON.stringify(prevProps.section.data) === JSON.stringify(nextProps.section.data) &&
    JSON.stringify(prevProps.sectionData) === JSON.stringify(nextProps.sectionData)
  )
})
