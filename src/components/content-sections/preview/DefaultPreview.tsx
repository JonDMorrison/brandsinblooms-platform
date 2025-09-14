/**
 * Default section preview component for unknown section types
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { ContentRenderer } from '@/src/components/preview/ContentRenderer'
import { renderItems } from '@/src/components/content-sections/shared'

interface DefaultPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
}

export function DefaultPreview({ 
  section, 
  sectionKey, 
  className = '', 
  title, 
  onContentUpdate, 
  onFeatureUpdate 
}: DefaultPreviewProps) {
  const { data } = section

  return (
    <div className={`space-y-4 ${className}`}>
      {data.content && <ContentRenderer content={data.content} />}
      {data.items && renderItems(data.items, data.columns || 3)}
    </div>
  )
}