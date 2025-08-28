'use client'

import React from 'react'
import { RichTextEditor } from '@/src/components/content-editor'
import { ContentSection } from '@/src/lib/content/schema'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

export function MissionEditor({ section, onUpdate }: SectionEditorProps) {
  return (
    <div className="space-y-4">
      <RichTextEditor
        initialContent={section.data.content || ''}
        onChange={(content) => onUpdate({ content })}
        placeholder="Enter your mission statement..."
      />
    </div>
  )
}