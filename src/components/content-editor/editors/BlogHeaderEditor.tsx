/**
 * Blog Header section editor component
 * Editor for blog post metadata: title, subtitle, author, date, and featured image
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import {
  FormField,
  TextareaField,
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
        <FormField
          id="blog-header-title"
          label="Title"
          value={String(data.title || '')}
          onChange={(value) => handleDataChange({ title: value })}
          placeholder="Enter blog post title"
          required
        />

        <TextareaField
          id="blog-header-subtitle"
          label="Subtitle"
          value={String(data.subtitle || '')}
          onChange={(value) => handleDataChange({ subtitle: value })}
          placeholder="Enter blog post subtitle or summary (optional)"
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
