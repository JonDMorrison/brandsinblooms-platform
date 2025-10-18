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

        // Only render if section has data and is available
        if (!sectionInfo || sectionInfo.status !== 'available' || !sectionInfo.data) {
          return null
        }

        return (
          <EditableCustomerSiteSection
            key={key}
            sectionKey={key}
            section={section as ContentSection}
            sectionData={sectionInfo.data}
          >
            <CustomerSiteSection
              section={section as ContentSection}
              sectionKey={key}
              sectionData={sectionInfo.data}
              backgroundSetting={sectionInfo.backgroundSetting}
            />
          </EditableCustomerSiteSection>
        )
      })}
    </>
  )
}
