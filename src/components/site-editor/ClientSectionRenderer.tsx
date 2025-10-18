'use client'

/**
 * Client Section Renderer
 * Dynamically renders sections in edit mode using FullSiteEditorContext
 * Ensures sections re-render and reorder when context state changes
 */

import React, { useMemo } from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { useFullSiteEditor } from '@/src/contexts/FullSiteEditorContext'
import { getLayoutSections } from '@/src/lib/preview/section-renderers'
import { EditableCustomerSiteSection } from './EditableCustomerSiteSection'
import { CustomerSiteSection } from '@/src/components/customer-site/CustomerSiteSection'

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
  const { pageContent, layout } = useFullSiteEditor()

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

  // If no sections available, show fallback
  if (orderedSections.length === 0) {
    return <>{fallbackContent}</>
  }

  return (
    <>
      {orderedSections.map(({ key, section }) => {
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
