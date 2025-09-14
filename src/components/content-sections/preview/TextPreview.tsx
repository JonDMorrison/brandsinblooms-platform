/**
 * Text/RichText section preview component
 * Handles both 'text' and 'richText' section types
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { ContentRenderer } from '@/src/components/preview/ContentRenderer'

interface TextPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
}

export function TextPreview({ 
  section, 
  sectionKey, 
  className = '', 
  title, 
  onContentUpdate, 
  onFeatureUpdate 
}: TextPreviewProps) {
  const { data } = section

  return (
    <div className={`prose prose-gray max-w-none ${className}`}>
      {data.content && <ContentRenderer content={data.content} />}
    </div>
  )
}