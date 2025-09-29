/**
 * Features section editor component
 * Handles features section configuration with icons matching customer site structure:
 * headline, description, and features array with icons
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
  FormSection
} from '@/src/components/content-editor/editors/shared/form-utils'
import { BackgroundToggle } from '@/src/components/content-editor/editors/shared/background-toggle'

interface FeaturesEditorProps {
  section: ContentSection
  sectionKey: string
  onUpdate: (sectionKey: string, section: ContentSection) => void
}

interface FeatureItem {
  id: string
  icon: string
  title: string
}

export function FeaturesEditor({ section, sectionKey, onUpdate }: FeaturesEditorProps) {
  const { data } = section

  // Convert old string[] format to new object[] format for backward compatibility
  const rawFeatures = data.features as string[] | FeatureItem[] | undefined
  const features: FeatureItem[] = React.useMemo(() => {
    if (!rawFeatures || !Array.isArray(rawFeatures)) return []

    // Check if it's old string[] format
    if (typeof rawFeatures[0] === 'string') {
      return (rawFeatures as string[]).map((title, i) => ({
        id: `feature-${Date.now()}-${i}`,
        icon: 'Check',
        title
      }))
    }

    return rawFeatures as FeatureItem[]
  }, [rawFeatures])

  const handleDataChange = (newData: Partial<ContentSection['data']>) => {
    onUpdate(sectionKey, {
      ...section,
      data: { ...section.data, ...newData }
    })
  }

  const handleAddFeature = () => {
    const newFeature: FeatureItem = {
      id: `feature-${Date.now()}`,
      icon: 'Check',
      title: 'New feature'
    }
    const newFeatures = [...features, newFeature]
    handleDataChange({ features: newFeatures })
  }

  const handleUpdateFeature = (index: number, field: keyof FeatureItem, value: string) => {
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
      {/* Features Section Title and Description fields */}
      <FormSection>
        <FormField
          id="features-headline"
          label="Title"
          value={data.headline || ''}
          onChange={(value) => handleDataChange({ headline: value })}
          placeholder="Essential Plant Care Features"
        />
        
        <TextareaField
          id="features-description"
          label="Description"
          value={data.description || ''}
          onChange={(value) => handleDataChange({ description: value })}
          placeholder="Master these key practices for healthy, thriving plants year-round"
          rows={3}
        />
      </FormSection>

      {/* Background Color Toggle */}
      <BackgroundToggle
        sectionKey={sectionKey}
        section={section}
        onUpdate={onUpdate}
        className="mb-4"
        availableOptions={['default', 'alternate']}
      />

      {/* Features List Management with Icons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Features</Label>
          <Button
            onClick={handleAddFeature}
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Feature
          </Button>
        </div>

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

              {/* Vertical layout for Icon and Title */}
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
                  <Label className="text-xs text-gray-500 mb-1 block">Title</Label>
                  <Input
                    value={featureItem.title || ''}
                    onChange={(e) => handleUpdateFeature(index, 'title', e.target.value)}
                    placeholder="Feature title"
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {features.length === 0 && (
          <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-lg">
            <p className="text-sm">No features added yet</p>
            <p className="text-xs text-gray-400 mt-1">Click &ldquo;Add Feature&rdquo; to get started</p>
          </div>
        )}
      </div>
    </>
  )
}