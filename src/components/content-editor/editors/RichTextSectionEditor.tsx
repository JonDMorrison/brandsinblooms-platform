/**
 * Rich text section editor component
 * Handles richText and cta sections with rich text editing
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { RichTextEditor } from '@/src/components/content-editor'
import { BackgroundToggle } from '@/src/components/content-editor/editors/shared/background-toggle'

interface RichTextSectionEditorProps {
  section: ContentSection
  sectionKey: string
  onUpdate: (sectionKey: string, section: ContentSection) => void
}

export function RichTextSectionEditor({ section, sectionKey, onUpdate }: RichTextSectionEditorProps) {
  const { data, type } = section

  const handleDataChange = (newData: Partial<ContentSection['data']>) => {
    onUpdate(sectionKey, {
      ...section,
      data: { ...section.data, ...newData }
    })
  }

  return (
    <>
      {/* Background Color Toggle */}
      <BackgroundToggle
        sectionKey={sectionKey}
        section={section}
        onUpdate={onUpdate}
        className="mb-4"
        availableOptions={['default', 'alternate']}
      />

      <RichTextEditor
        initialContent={data.content || ''}
        onChange={(content) => handleDataChange({ content })}
        placeholder={`Enter ${type} content...`}
      />
    </>
  )
}