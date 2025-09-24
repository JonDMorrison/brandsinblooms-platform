/**
 * Text/RichText section preview component
 * Handles both 'text' and 'richText' section types with visual inline editing
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { ContentRenderer } from '@/src/components/preview/ContentRenderer'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'

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

  // If we have onContentUpdate, use InlineTextEditor for visual editing
  if (onContentUpdate) {
    return (
      <div className={`prose prose-gray max-w-none ${className}`}>
        <InlineTextEditor
          content={data.content || ''}
          onUpdate={(htmlContent) => {
            onContentUpdate(sectionKey, 'data.content', htmlContent)
          }}
          isEnabled={true}
          fieldPath="data.content"
          format="rich"
          className="prose prose-gray max-w-none min-h-[100px]"
          style={{
            color: 'var(--theme-text)',
            fontFamily: 'var(--theme-font-body)'
          }}
          placeholder="Click to add rich text content..."
          showToolbar={true}
          debounceDelay={500}
        />
      </div>
    )
  }

  // Fallback to read-only ContentRenderer for non-editable contexts
  return (
    <div className={`prose prose-gray max-w-none ${className}`}>
      {data.content && <ContentRenderer content={data.content} />}
    </div>
  )
}