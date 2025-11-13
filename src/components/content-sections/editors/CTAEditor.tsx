/**
 * CTA section editor component
 * Handles CTA section configuration matching customer site structure:
 * headline, description, primary CTA, secondary CTA, and background modes
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { TextInputWithColorPicker } from '@/src/components/content-editor/inputs/TextInputWithColorPicker'
import {
  ButtonConfigField,
  FormSection
} from '@/src/components/content-editor/editors/shared/form-utils'
import { BackgroundToggle } from '@/src/components/content-editor/editors/shared/background-toggle'

interface CTAEditorProps {
  section: ContentSection
  sectionKey: string
  onUpdate: (sectionKey: string, section: ContentSection) => void
}

export function CTAEditor({ section, sectionKey, onUpdate }: CTAEditorProps) {
  const { data } = section

  const handleDataChange = (newData: Partial<ContentSection['data']>) => {
    onUpdate(sectionKey, {
      ...section,
      data: { ...section.data, ...newData }
    })
  }

  return (
    <>
      {/* CTA Section Title and Description fields */}
      <FormSection>
        <TextInputWithColorPicker
          label="Title"
          value={data.headline || ''}
          colorValue={data.headlineColor}
          onTextChange={(value) => handleDataChange({ headline: value })}
          onColorChange={(color) => handleDataChange({ headlineColor: color })}
          placeholder="Growing Together, Sustainably"
        />

        <TextInputWithColorPicker
          label="Description"
          value={data.description || ''}
          colorValue={data.descriptionColor}
          onTextChange={(value) => handleDataChange({ description: value })}
          onColorChange={(color) => handleDataChange({ descriptionColor: color })}
          placeholder="Our mission is to help you create thriving plant sanctuaries while protecting our planet..."
          multiline
          rows={4}
        />
      </FormSection>

      {/* Background Color Toggle with 3 options */}
      <BackgroundToggle
        sectionKey={sectionKey}
        section={section}
        onUpdate={onUpdate}
        className="mb-4"
      />

      {/* CTA Buttons Configuration */}
      <FormSection>
        {/* Primary Button */}
        <ButtonConfigField
          label="Primary Button"
          textValue={data.ctaText || ''}
          linkValue={data.ctaLink || ''}
          onTextChange={(value) => handleDataChange({ ctaText: value })}
          onLinkChange={(value) => handleDataChange({ ctaLink: value })}
          textPlaceholder="Shop Plants"
          linkPlaceholder="/plants"
        />
        
        {/* Secondary Button */}
        <ButtonConfigField
          label="Secondary Button"
          textValue={data.secondaryCtaText || ''}
          linkValue={data.secondaryCtaLink || ''}
          onTextChange={(value) => handleDataChange({ secondaryCtaText: value })}
          onLinkChange={(value) => handleDataChange({ secondaryCtaLink: value })}
          textPlaceholder="Browse Plants"
          linkPlaceholder="/products"
        />
      </FormSection>
    </>
  )
}