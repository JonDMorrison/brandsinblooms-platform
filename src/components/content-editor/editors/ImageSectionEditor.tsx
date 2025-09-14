/**
 * Image section editor component
 * Handles image sections with URL, alt text, and caption
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { ImageInput } from '@/src/components/content-editor'

interface ImageSectionEditorProps {
  section: ContentSection
  onUpdate: (newData: Partial<ContentSection['data']>) => void
}

export function ImageSectionEditor({ section, onUpdate }: ImageSectionEditorProps) {
  const { data } = section

  return (
    <ImageInput
      value={{
        url: data.url || '',
        alt: data.alt || '',
        caption: data.caption || ''
      }}
      onChange={(imageData) => onUpdate({
        url: imageData.url,
        alt: imageData.alt,
        caption: imageData.caption
      })}
    />
  )
}