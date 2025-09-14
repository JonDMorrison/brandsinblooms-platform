/**
 * Features section preview component
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { ContentRenderer } from '@/src/components/preview/ContentRenderer'
import { renderItems } from '@/src/components/content-sections/shared'

interface FeaturesPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
}

export function FeaturesPreview({ 
  section, 
  sectionKey, 
  className = '', 
  title, 
  onContentUpdate, 
  onFeatureUpdate 
}: FeaturesPreviewProps) {
  const { data } = section

  return (
    <div className={`space-y-6 ${className}`}>
      {data.content && (
        <div className="text-center">
          <ContentRenderer content={data.content} className="text-2xl font-bold text-gray-900" />
        </div>
      )}
      {renderItems(data.items, data.columns || 3)}
    </div>
  )
}