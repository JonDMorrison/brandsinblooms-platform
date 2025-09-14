/**
 * Hero section editor component
 * Handles hero section configuration including headline, subtitle, CTA buttons, and features
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { Label } from '@/src/components/ui/label'
import { 
  FormField, 
  TextareaField, 
  ButtonConfigField, 
  FormSection 
} from './shared/form-utils'
import { FeatureManager } from './shared/feature-manager'

interface HeroEditorProps {
  section: ContentSection
  onUpdate: (newData: Partial<ContentSection['data']>) => void
}

export function HeroEditor({ section, onUpdate }: HeroEditorProps) {
  const { data } = section

  const handleDataChange = (newData: Partial<ContentSection['data']>) => {
    onUpdate(newData)
  }

  return (
    <>
      {/* Hero Title and Subtitle fields */}
      <FormSection>
        <FormField
          id="hero-headline"
          label="Title"
          value={data.headline || ''}
          onChange={(value) => handleDataChange({ headline: value })}
          placeholder="Main hero headline"
        />
        
        <TextareaField
          id="hero-subheadline"
          label="Subtitle"
          value={data.subheadline || ''}
          onChange={(value) => handleDataChange({ subheadline: value })}
          placeholder="Supporting subtitle or description"
          rows={3}
        />
      </FormSection>
      
      {/* Hero Buttons Configuration */}
      <FormSection>
        <Label className="text-xs font-medium">Action Buttons (Optional)</Label>
        <div className="space-y-3">
          {/* Primary Button */}
          <ButtonConfigField
            label="Primary Button"
            textValue={data.ctaText || ''}
            linkValue={data.ctaLink || ''}
            onTextChange={(value) => handleDataChange({ ctaText: value })}
            onLinkChange={(value) => handleDataChange({ ctaLink: value })}
            textPlaceholder="Button text (optional)"
            linkPlaceholder="Link/Route (e.g., /plants)"
          />
          
          {/* Secondary Button */}
          <ButtonConfigField
            label="Secondary Button"
            textValue={data.secondaryCtaText || ''}
            linkValue={data.secondaryCtaLink || ''}
            onTextChange={(value) => handleDataChange({ secondaryCtaText: value })}
            onLinkChange={(value) => handleDataChange({ secondaryCtaLink: value })}
            textPlaceholder="Button text (optional)"
            linkPlaceholder="Link/Route (e.g., /care-guides)"
          />
        </div>
      </FormSection>
      
      {/* Features Management */}
      <FeatureManager
        features={data.features}
        onFeaturesChange={(features) => handleDataChange({ features })}
        maxFeatures={4}
        label="Features"
        description="Highlight key features or benefits in your hero section"
        defaultFeatures={['Premium Quality', 'Fast Shipping', 'Expert Support', 'Easy Returns']}
      />
    </>
  )
}