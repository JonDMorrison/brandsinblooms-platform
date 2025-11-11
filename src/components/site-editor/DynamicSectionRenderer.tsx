'use client'

/**
 * Dynamic Section Renderer
 * Conditionally renders sections based on edit mode state
 * In edit mode: uses ClientSectionRenderer (reads from context, updates live)
 * Not in edit mode: renders static server sections
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { useIsEditModeActive } from '@/src/contexts/FullSiteEditorContext'
import { ClientSectionRenderer } from './ClientSectionRenderer'
import { EditableCustomerSiteSection } from './EditableCustomerSiteSection'
import { CustomerSiteSection } from '@/src/components/customer-site/CustomerSiteSection'

interface DynamicSectionRendererProps {
  // Initial sections from server (used when NOT in edit mode)
  initialSections: Array<{ key: string; section: unknown }>
  // Section data mapping (used for both modes)
  sectionDataMap: Record<string, {
    data: unknown
    status: string
    backgroundSetting: string
  }>
  // Optional fallback content
  fallbackContent?: React.ReactNode
}

/**
 * Conditionally renders sections based on edit mode
 * Enables real-time updates in edit mode while maintaining server rendering for public view
 */
export function DynamicSectionRenderer({
  initialSections,
  sectionDataMap,
  fallbackContent
}: DynamicSectionRendererProps) {
  const isEditMode = useIsEditModeActive()

  // In edit mode: use ClientSectionRenderer (reads from context, updates live)
  if (isEditMode) {
    return (
      <ClientSectionRenderer
        sectionDataMap={sectionDataMap}
        fallbackContent={fallbackContent}
      />
    )
  }

  // Not in edit mode: render server sections (static, no context needed)
  if (initialSections.length === 0) {
    return <>{fallbackContent}</>
  }

  return (
    <>
      {initialSections.map(({ key, section }) => {
        const sectionInfo = sectionDataMap[key as keyof typeof sectionDataMap]
        const typedSection = section as ContentSection

        // Determine data source and background setting
        // Priority: sectionDataMap (server data) > section.data (sections with inline data)
        let sectionData: unknown
        let backgroundSetting: string

        if (sectionInfo && sectionInfo.status === 'available' && sectionInfo.data) {
          // Use server data if available
          sectionData = sectionInfo.data
          backgroundSetting = sectionInfo.backgroundSetting
        } else if (typedSection.data) {
          // Use section's own data (for sections not in sectionDataMap)
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
    </>
  )
}
