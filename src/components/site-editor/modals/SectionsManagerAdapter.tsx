'use client'

/**
 * Sections Manager Adapter
 * Adapts FullSiteEditorContext to work with CombinedSectionManager component
 * Provides a bridge between customer site editor and dashboard sections manager
 */

import React, { useCallback } from 'react'
import { useFullSiteEditor } from '@/src/contexts/FullSiteEditorContext'
import { CombinedSectionManager } from '@/src/components/content-editor/CombinedSectionManager'
import { ContentSection } from '@/src/lib/content/schema'

export function SectionsManagerAdapter() {
  const {
    pageContent,
    layout,
    activeSection,
    setActiveSection,
    toggleSectionVisibility,
    reorderSection,
    reorderSections,
    addSection,
    updateSection,
    deleteSection
  } = useFullSiteEditor()

  // Guard: must have page content
  if (!pageContent) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No content available</p>
      </div>
    )
  }

  // Adapter functions
  const handleToggleVisibility = useCallback((sectionKey: string) => {
    toggleSectionVisibility(sectionKey)
  }, [toggleSectionVisibility])

  const handleMoveUp = useCallback((sectionKey: string) => {
    reorderSection(sectionKey, 'up')
  }, [reorderSection])

  const handleMoveDown = useCallback((sectionKey: string) => {
    reorderSection(sectionKey, 'down')
  }, [reorderSection])

  const handleReorderSections = useCallback((sections: Array<{ key: string; section: ContentSection }>) => {
    reorderSections(sections)
  }, [reorderSections])

  const handleSectionClick = useCallback((sectionKey: string) => {
    setActiveSection(sectionKey)
  }, [setActiveSection])

  const handleSectionUpdate = useCallback((sectionKey: string, section: ContentSection) => {
    updateSection(sectionKey, section)
  }, [updateSection])

  const handleAddSection = useCallback((sectionType: any, variant?: string) => {
    addSection(sectionType, variant)
  }, [addSection])

  const handleRemoveSection = useCallback((sectionKey: string) => {
    deleteSection(sectionKey)
  }, [deleteSection])

  return (
    <CombinedSectionManager
      content={pageContent}
      layout={layout}
      onToggleVisibility={handleToggleVisibility}
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
      onReorderSections={handleReorderSections}
      onSectionClick={handleSectionClick}
      activeSectionKey={activeSection || undefined}
      isDraggingEnabled={true}
      onSectionUpdate={handleSectionUpdate}
      onAddSection={handleAddSection}
      onRemoveSection={handleRemoveSection}
    />
  )
}
