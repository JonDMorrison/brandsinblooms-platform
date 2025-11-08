'use client'

/**
 * Client Section Renderer
 * Dynamically renders sections in edit mode using FullSiteEditorContext
 * Ensures sections re-render and reorder when context state changes
 */

import React, { useMemo, useState } from 'react'
import { ContentSection, ContentSectionType } from '@/src/lib/content/schema'
import { useFullSiteEditor } from '@/src/contexts/FullSiteEditorContext'
import { getLayoutSections } from '@/src/lib/preview/section-renderers'
import { EditableCustomerSiteSection } from './EditableCustomerSiteSection'
import { CustomerSiteSection } from '@/src/components/customer-site/CustomerSiteSection'
import { SectionInsertButton } from './SectionInsertButton'
import { AddSectionModal } from './AddSectionModal'

interface ClientSectionRendererProps {
  // Section data mapping from server (for data that's not in pageContent)
  sectionDataMap: Record<string, {
    data: unknown
    status: string
    backgroundSetting: string
  }>
  // Optional fallback content if no sections available
  fallbackContent?: React.ReactNode
}

/**
 * Client-side section renderer that reads from FullSiteEditorContext
 * Enables real-time section reordering and updates in edit mode
 */
export function ClientSectionRenderer({
  sectionDataMap,
  fallbackContent
}: ClientSectionRendererProps) {
  const { pageContent, layout, editorMode, addSection } = useFullSiteEditor()
  const [showAddSectionModal, setShowAddSectionModal] = useState(false)
  const [isEndButtonHovered, setIsEndButtonHovered] = useState(false)

  // Compute ordered sections from context (not server state)
  // This ensures re-renders when context.pageContent changes
  const orderedSections = useMemo(() => {
    if (!pageContent?.sections) return []

    // Get all sections sorted by order property
    // Include ALL sections (visible and hidden)
    // EditableCustomerSiteSection will handle visibility based on mode:
    // - Edit mode: shows hidden sections with opacity/badge
    // - Navigate mode: hides hidden sections
    return getLayoutSections(pageContent.sections, layout)
  }, [pageContent?.sections, layout])

  // Handle adding section at end of page
  const handleAddSectionAtEnd = (sectionType: ContentSectionType, variant?: string) => {
    addSection(sectionType, variant) // No position = adds at end
  }

  // If no sections available, show fallback
  if (orderedSections.length === 0) {
    return <>{fallbackContent}</>
  }

  return (
    <>
      {orderedSections.map(({ key, section }) => {
        const sectionInfo = sectionDataMap[key as keyof typeof sectionDataMap]
        const typedSection = section as ContentSection

        // Determine data source and background setting
        // Priority: sectionDataMap (server data) > section.data (newly added sections)
        let sectionData: unknown
        let backgroundSetting: string

        if (sectionInfo && sectionInfo.status === 'available' && sectionInfo.data) {
          // Use server data if available
          sectionData = sectionInfo.data
          backgroundSetting = sectionInfo.backgroundSetting
        } else if (typedSection.data) {
          // Use section's own data (for newly added sections)
          sectionData = typedSection.data
          backgroundSetting = String(typedSection.settings?.backgroundColor || 'default')
        } else {
          // No data available - skip rendering
          return null
        }

        return (
          <EditableCustomerSiteSection
            key={key}
            sectionKey={key}
            section={typedSection}
            sectionData={sectionData}
          >
            <CustomerSiteSection
              section={typedSection}
              sectionKey={key}
              sectionData={sectionData}
              backgroundSetting={backgroundSetting}
            />
          </EditableCustomerSiteSection>
        )
      })}

      {/* End of page insert button - only in edit mode */}
      {editorMode === 'edit' && orderedSections.length > 0 && (
        <div
          className="relative"
          onMouseEnter={() => setIsEndButtonHovered(true)}
          onMouseLeave={() => setIsEndButtonHovered(false)}
        >
          <SectionInsertButton
            position="below"
            onInsert={() => setShowAddSectionModal(true)}
            visible={true}
            className="my-8"
          />
        </div>
      )}

      {/* Add Section Modal for end-of-page insertion */}
      <AddSectionModal
        isOpen={showAddSectionModal}
        onClose={() => setShowAddSectionModal(false)}
        currentLayout={layout}
        existingSections={pageContent ? Object.keys(pageContent.sections) : []}
        onAddSection={handleAddSectionAtEnd}
      />
    </>
  )
}
