/**
 * Feature list management component
 * Handles adding, editing, removing, and managing feature lists with a maximum limit
 */

import React from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Plus } from 'lucide-react'

interface FeatureManagerProps {
  features: string[] | undefined
  onFeaturesChange: (features: string[]) => void
  maxFeatures?: number
  label?: string
  description?: string
  defaultFeatures?: string[]
  className?: string
}

export function FeatureManager({ 
  features = [], 
  onFeaturesChange, 
  maxFeatures = 4,
  label = 'Features',
  description = 'Highlight key features or benefits',
  defaultFeatures = ['Premium Quality', 'Fast Shipping', 'Expert Support', 'Easy Returns'],
  className = ''
}: FeatureManagerProps) {
  const currentFeatures = Array.isArray(features) ? features : []
  const canAddMore = currentFeatures.length < maxFeatures
  const hasFeatures = currentFeatures.length > 0

  const handleFeatureUpdate = (index: number, value: string) => {
    const newFeatures = [...currentFeatures]
    newFeatures[index] = value
    onFeaturesChange(newFeatures)
  }

  const handleFeatureRemove = (index: number) => {
    const newFeatures = currentFeatures.filter((_, i) => i !== index)
    onFeaturesChange(newFeatures)
  }

  const handleFeatureAdd = () => {
    if (canAddMore) {
      const newFeatures = [...currentFeatures, 'New feature']
      onFeaturesChange(newFeatures)
    }
  }

  const handleAddDefaults = () => {
    onFeaturesChange(defaultFeatures)
  }

  return (
    <div className={`space-y-3 mb-4 ${className}`}>
      <Label className="text-xs font-medium">{label} (Optional)</Label>
      {description && (
        <p className="text-xs text-gray-500 mb-3">
          {description}
        </p>
      )}
      
      {/* Current Features */}
      {hasFeatures && (
        <div className="space-y-2">
          {currentFeatures.map((feature: string, index: number) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
              <Input
                type="text"
                value={feature}
                onChange={(e) => handleFeatureUpdate(index, e.target.value)}
                className="h-8 flex-1"
                placeholder="Feature text"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFeatureRemove(index)}
                className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Add Feature Button */}
      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFeatureAdd}
          className="w-full h-8 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Feature {hasFeatures ? `(${maxFeatures - currentFeatures.length} remaining)` : ''}
        </Button>
      )}
      
      {/* Maximum Reached Message */}
      {currentFeatures.length >= maxFeatures && (
        <div className="text-center p-2 text-xs text-gray-500 bg-muted/30 rounded-lg">
          Maximum of {maxFeatures} features reached
        </div>
      )}
      
      {/* Empty State with Default Features Option */}
      {!hasFeatures && (
        <div className="text-center p-4 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">No features added yet</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddDefaults}
            className="h-8 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Default Features
          </Button>
        </div>
      )}
    </div>
  )
}