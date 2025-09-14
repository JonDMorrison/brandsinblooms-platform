/**
 * Text section editor component
 * Handles plain text sections with multiline input
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { SimpleTextInput } from '@/src/components/content-editor'

interface TextSectionEditorProps {
  section: ContentSection
  onUpdate: (newData: Partial<ContentSection['data']>) => void
}

export function TextSectionEditor({ section, onUpdate }: TextSectionEditorProps) {
  const { data, type } = section

  return (
    <SimpleTextInput
      value={data.content || ''}
      onChange={(content) => onUpdate({ content })}
      placeholder={`Enter ${type} content...`}
      multiline
    />
  )
}