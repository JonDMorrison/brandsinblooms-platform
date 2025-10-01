/**
 * Hero section editor component
 * Handles hero section configuration including headline, subtitle, CTA buttons, and features with icons
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Plus, X } from 'lucide-react'
import { IconSelector } from '@/src/components/ui/IconSelector'
import {
  FormField,
  TextareaField,
  ButtonConfigField,
  FormSection
} from './shared/form-utils'

interface HeroEditorProps {
  section: ContentSection
  onUpdate: (newData: Partial<ContentSection['data']>) => void
}

interface HeroFeatureItem {
  id: string
  icon: string
  text: string
}

export function HeroEditor({ section, onUpdate }: HeroEditorProps) {
  const { data } = section

  // Convert old string[] format to new object[] format for backward compatibility
  const rawFeatures = data.features as string[] | HeroFeatureItem[] | undefined
  const features: HeroFeatureItem[] = React.useMemo(() => {
    if (!rawFeatures || !Array.isArray(rawFeatures)) return []

    // Check if it's old string[] format
    if (typeof rawFeatures[0] === 'string') {
      return (rawFeatures as string[]).map((text, i) => ({
        id: `feature-${Date.now()}-${i}`,
        icon: 'Check',
        text
      }))
    }

    return rawFeatures as HeroFeatureItem[]
  }, [rawFeatures])

  const handleDataChange = (newData: Partial<ContentSection['data']>) => {
    onUpdate(newData)
  }

  const handleAddFeature = () => {
    const newFeature: HeroFeatureItem = {
      id: `feature-${Date.now()}`,
      icon: 'Check',
      text: 'New feature'
    }
    const newFeatures = [...features, newFeature]
    handleDataChange({ features: newFeatures })
  }

  const handleUpdateFeature = (index: number, field: keyof HeroFeatureItem, value: string) => {
    const newFeatures = [...features]
    newFeatures[index] = { ...newFeatures[index], [field]: value }
    handleDataChange({ features: newFeatures })
  }

  const handleRemoveFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index)
    handleDataChange({ features: newFeatures })
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

      {/* Features List Management with Icons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Features (Optional)</Label>
          <Button
            onClick={handleAddFeature}
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            disabled={features.length >= 4}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Feature
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          Highlight key features or benefits in your hero section
        </p>

        <div className="space-y-2">
          {features.map((featureItem, index) => (
            <div key={featureItem.id || index} className="border border-input rounded-md p-3 space-y-2">
              {/* Header with Feature # and Remove button */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-600">Feature {index + 1}</Label>
                <Button
                  onClick={() => handleRemoveFeature(index)}
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Vertical layout for Icon and Text */}
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Icon</Label>
                  <IconSelector
                    value={featureItem.icon || 'Check'}
                    onChange={(icon) => handleUpdateFeature(index, 'icon', icon)}
                    iconSize={16}
                    maxResults={60}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Text</Label>
                  <Input
                    value={featureItem.text || ''}
                    onChange={(e) => handleUpdateFeature(index, 'text', e.target.value)}
                    placeholder="Feature text"
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Maximum Reached Message */}
        {features.length >= 4 && (
          <div className="text-center p-2 text-xs text-gray-500 bg-muted/30 rounded-lg">
            Maximum of 4 features reached
          </div>
        )}

        {/* Empty State */}
        {features.length === 0 && (
          <div className="text-center p-4 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">No features added yet</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const defaultFeatures: HeroFeatureItem[] = [
                  { id: `f-1-${Date.now()}`, icon: 'Check', text: 'Premium Quality' },
                  { id: `f-2-${Date.now()}`, icon: 'Truck', text: 'Fast Shipping' },
                  { id: `f-3-${Date.now()}`, icon: 'Users', text: 'Expert Support' },
                  { id: `f-4-${Date.now()}`, icon: 'RotateCcw', text: 'Easy Returns' }
                ]
                handleDataChange({ features: defaultFeatures })
              }}
              className="h-8 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Default Features
            </Button>
          </div>
        )}
      </div>
    </>
  )
}