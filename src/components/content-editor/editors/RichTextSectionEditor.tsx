/**
 * Rich text section editor component
 * Handles richText and cta sections with rich text editing
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { RichTextEditor } from '@/src/components/content-editor'

interface RichTextSectionEditorProps {
  section: ContentSection
  onUpdate: (newData: Partial<ContentSection['data']>) => void
}

export function RichTextSectionEditor({ section, onUpdate }: RichTextSectionEditorProps) {
  const { data, type } = section

  return (
    <RichTextEditor
      initialContent={data.content || ''}
      onChange={(content) => onUpdate({ content })}
      placeholder={`Enter ${type} content...`}
    />
  )
}