/**
 * CTA section editor component
 * Handles CTA section configuration matching customer site structure:
 * headline, description, primary CTA, secondary CTA, and background modes
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { 
  FormField, 
  TextareaField, 
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
        <FormField
          id="cta-headline"
          label="Title"
          value={data.headline || ''}
          onChange={(value) => handleDataChange({ headline: value })}
          placeholder="Growing Together, Sustainably"
        />
        
        <TextareaField
          id="cta-description"
          label="Description"
          value={data.description || ''}
          onChange={(value) => handleDataChange({ description: value })}
          placeholder="Our mission is to help you create thriving plant sanctuaries while protecting our planet..."
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