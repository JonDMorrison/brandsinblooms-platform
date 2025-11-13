/**
 * Blog Header section editor component
 * Editor for blog post metadata: title, subtitle, author, date, and featured image
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { TextInputWithColorPicker } from '@/src/components/content-editor/inputs/TextInputWithColorPicker'
import {
  FormField,
  FormSection,
  BackgroundToggle
} from './shared'
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'

interface BlogHeaderEditorProps {
  section: ContentSection
  sectionKey: string
  onUpdate: (sectionKey: string, section: ContentSection) => void
}

export function BlogHeaderEditor({ section, sectionKey, onUpdate }: BlogHeaderEditorProps) {
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
          value={String(data.title || '')}
          colorValue={data.titleColor}
          onTextChange={(value) => handleDataChange({ title: value })}
          onColorChange={(color) => handleDataChange({ titleColor: color })}
          placeholder="Enter blog post title"
        />

        <TextInputWithColorPicker
          label="Subtitle"
          value={String(data.subtitle || '')}
          colorValue={data.subtitleColor}
          onTextChange={(value) => handleDataChange({ subtitle: value })}
          onColorChange={(color) => handleDataChange({ subtitleColor: color })}
          placeholder="Enter blog post subtitle or summary (optional)"
          multiline
          rows={3}
        />

        <FormField
          id="blog-header-author"
          label="Author"
          value={String(data.author || '')}
          onChange={(value) => handleDataChange({ author: value })}
          placeholder="Enter author name"
          required
        />

        <div className="space-y-2">
          <Label htmlFor="blog-header-publishedDate" className="text-sm font-medium">
            Published Date
          </Label>
          <Input
            id="blog-header-publishedDate"
            type="date"
            value={String(data.publishedDate || '')}
            onChange={(e) => handleDataChange({ publishedDate: e.target.value })}
            required
            className="w-full"
          />
        </div>

        <FormField
          id="blog-header-image"
          label="Featured Image URL"
          value={String(data.image || '')}
          onChange={(value) => handleDataChange({ image: value })}
          placeholder="https://example.com/image.jpg (optional)"
        />
      </FormSection>

      {/* Background Color Toggle */}
      <BackgroundToggle
        sectionKey={sectionKey}
        section={section}
        onUpdate={onUpdate}
        className="mb-4"
        availableOptions={['default', 'alternate', 'gradient']}
      />
    </>
  )
}
