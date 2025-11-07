'use client'

import React from 'react'
import { RichTextEditor } from '@/src/components/content-editor'
import { ContentSection } from '@/src/lib/content/schema'
import { FormField, FormSection } from '@/src/components/content-editor/editors/shared/form-utils'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

export function MissionEditor({ section, onUpdate }: SectionEditorProps) {

  return (
    <div className="space-y-4">
      <FormSection>
        <FormField
          id="mission-headline"
          label="Mission Headline"
          value={section.data.headline || ''}
          onChange={(value) => onUpdate({ headline: value })}
          placeholder="Our Mission"
        />
      </FormSection>

      <div className="space-y-2">
        <label className="text-sm font-medium">Mission Statement</label>
        <RichTextEditor
          initialContent={section.data.content || ''}
          onChange={(content) => onUpdate({ content })}
          placeholder="Enter your mission statement..."
        />
      </div>
    </div>
  )
}