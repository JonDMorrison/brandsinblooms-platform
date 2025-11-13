/**
 * Header section editor component
 * Simplified hero with only title and subtitle (no buttons or features)
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { TextInputWithColorPicker } from '@/src/components/content-editor/inputs/TextInputWithColorPicker'
import {
  FormSection,
  BackgroundToggle
} from './shared'

interface HeaderEditorProps {
  section: ContentSection
  sectionKey: string
  onUpdate: (sectionKey: string, section: ContentSection) => void
}

export function HeaderEditor({ section, sectionKey, onUpdate }: HeaderEditorProps) {
  const { data } = section

  const handleDataChange = (newData: Partial<ContentSection['data']>) => {
    onUpdate(sectionKey, {
      ...section,
      data: { ...section.data, ...newData }
    })
  }

  return (
    <>
      <FormSection>
        <TextInputWithColorPicker
          label="Title"
          value={String(data.headline || '')}
          colorValue={data.headlineColor}
          onTextChange={(value) => handleDataChange({ headline: value })}
          onColorChange={(color) => handleDataChange({ headlineColor: color })}
          placeholder="Enter page title"
        />

        <TextInputWithColorPicker
          label="Subtitle"
          value={String(data.subheadline || '')}
          colorValue={data.subheadlineColor}
          onTextChange={(value) => handleDataChange({ subheadline: value })}
          onColorChange={(color) => handleDataChange({ subheadlineColor: color })}
          placeholder="Enter page subtitle or description"
          multiline
          rows={3}
        />
      </FormSection>

      {/* Background Color Toggle */}
      <BackgroundToggle
        sectionKey={sectionKey}
        section={section}
        onUpdate={onUpdate}
        className="mb-4"
        availableOptions={['default', 'alternate', 'primary', 'gradient']}
      />
    </>
  )
}