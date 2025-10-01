/**
 * Featured section editor component
 * Handles featured section configuration including headline, subtitle, background, and view all button
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { htmlToText, textToHtml } from '@/src/lib/utils/html-text'
import { 
  FormField, 
  ButtonConfigField, 
  FormSection 
} from './shared/form-utils'
import { BackgroundToggle } from './shared/background-toggle'
import { Label } from '@/src/components/ui/label'

interface FeaturedEditorProps {
  section: ContentSection
  sectionKey: string
  onUpdate: (sectionKey: string, section: ContentSection) => void
}

export function FeaturedEditor({ section, sectionKey, onUpdate }: FeaturedEditorProps) {
  const { data } = section

  const handleDataChange = (newData: Partial<ContentSection['data']>) => {
    onUpdate(sectionKey, {
      ...section,
      data: { ...section.data, ...newData }
    })
  }

  return (
    <>
      {/* Featured Section Title and Subtitle fields */}
      <FormSection>
        <FormField
          id="featured-headline"
          label="Title"
          value={data.headline || ''}
          onChange={(value) => handleDataChange({ headline: value })}
          placeholder="Featured Plants This Season"
        />
        
        <div className="space-y-2">
          <Label htmlFor="featured-subheadline" className="text-xs font-medium">
            Subtitle
          </Label>
          <textarea
            id="featured-subheadline"
            value={htmlToText(data.subheadline || '')}
            onChange={(e) => handleDataChange({ subheadline: textToHtml(e.target.value) })}
            placeholder="Supporting subtitle or description"
            className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[60px]"
            rows={3}
          />
        </div>
      </FormSection>

      {/* Background Color Toggle */}
      <BackgroundToggle
        sectionKey={sectionKey}
        section={section}
        onUpdate={onUpdate}
        className="mb-4"
        availableOptions={['default', 'alternate']}
      />

      {/* View All Button Configuration */}
      <ButtonConfigField
        label="View All Button"
        textValue={data.viewAllText || ''}
        linkValue={data.viewAllLink || ''}
        onTextChange={(value) => handleDataChange({ viewAllText: value })}
        onLinkChange={(value) => handleDataChange({ viewAllLink: value })}
        textPlaceholder="View All Plants"
        linkPlaceholder="/plants"
      />
    </>
  )
}