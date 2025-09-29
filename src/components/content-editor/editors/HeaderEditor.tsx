/**
 * Header section editor component
 * Simplified hero with only title and subtitle (no buttons or features)
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import {
  FormField,
  TextareaField,
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
        <FormField
          id="header-headline"
          label="Title"
          value={String(data.headline || '')}
          onChange={(value) => handleDataChange({ headline: value })}
          placeholder="Enter page title"
        />

        <TextareaField
          id="header-subheadline"
          label="Subtitle"
          value={String(data.subheadline || '')}
          onChange={(value) => handleDataChange({ subheadline: value })}
          placeholder="Enter page subtitle or description"
          rows={3}
        />
      </FormSection>

      {/* Background Color Toggle */}
      <BackgroundToggle
        sectionKey={sectionKey}
        section={section}
        onUpdate={onUpdate}
        className="mb-4"
        availableOptions={['default', 'gradient']}
      />
    </>
  )
}