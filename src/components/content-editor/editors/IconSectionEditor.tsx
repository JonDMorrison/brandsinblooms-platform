/**
 * Icon section editor component
 * Handles icon sections with icon picker and description text
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { IconPicker, SimpleTextInput } from '@/src/components/content-editor'

interface IconSectionEditorProps {
  section: ContentSection
  onUpdate: (newData: Partial<ContentSection['data']>) => void
}

export function IconSectionEditor({ section, onUpdate }: IconSectionEditorProps) {
  const { data } = section

  return (
    <div className="space-y-3">
      <IconPicker
        value={data.icon || ''}
        onChange={(icon) => onUpdate({ icon })}
      />
      <SimpleTextInput
        value={data.content || ''}
        onChange={(content) => onUpdate({ content })}
        placeholder="Icon description..."
        multiline
      />
    </div>
  )
}