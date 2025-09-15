/**
 * Features section editor component
 * Handles features section configuration matching customer site structure:
 * headline, description, and simple features array
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { Plus, X } from 'lucide-react'
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

export function FeaturesEditor({ section, sectionKey, onUpdate }: FeaturesEditorProps) {
  const { data } = section
  const features = (data.features as string[]) || []

  const handleDataChange = (newData: Partial<ContentSection['data']>) => {
    onUpdate(sectionKey, {
      ...section,
      data: { ...section.data, ...newData }
    })
  }

  const handleAddFeature = () => {
    const newFeatures = [...features, 'New feature description']
    handleDataChange({ features: newFeatures })
  }

  const handleUpdateFeature = (index: number, newText: string) => {
    const newFeatures = [...features]
    newFeatures[index] = newText
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
      />

      {/* Features List Management */}
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
          {features.map((feature, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <textarea
                  value={feature}
                  onChange={(e) => handleUpdateFeature(index, e.target.value)}
                  placeholder="Feature description..."
                  className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[60px]"
                  rows={2}
                />
              </div>
              <Button
                onClick={() => handleRemoveFeature(index)}
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {features.length === 0 && (
          <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-lg">
            <p className="text-sm">No features added yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Feature" to get started</p>
          </div>
        )}
      </div>
    </>
  )
}