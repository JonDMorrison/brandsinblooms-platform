'use client'

/**
 * Hero Features Item Manager
 * Manages add/delete operations for Hero section mini-features (up to 4)
 * Used within Section Settings Modal
 * Note: Hero uses the same data.features structure as Features section
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { getIcon } from '@/src/components/content-sections/shared/icon-utils'
import { htmlToText } from '@/src/lib/utils/html-text'

interface HeroFeatureItem {
  id: string
  icon: string
  text: string
  title?: string  // Alias for compatibility
}

interface HeroFeaturesItemManagerProps {
  section: ContentSection
  sectionKey: string
  onAdd: () => void
  onDelete: (itemIndex: number) => void
}

export function HeroFeaturesItemManager({
  section,
  sectionKey,
  onAdd,
  onDelete
}: HeroFeaturesItemManagerProps) {
  const { data } = section

  // Convert features to typed array (same logic as HeroPreview)
  const rawFeatures = data.features as string[] | HeroFeatureItem[] | undefined
  const features: HeroFeatureItem[] = React.useMemo(() => {
    if (!rawFeatures || !Array.isArray(rawFeatures)) return []

    return rawFeatures.map((item, i) => {
      // If already an object with required fields
      if (item && typeof item === 'object' && ('text' in item || 'title' in item)) {
        const displayText = (item as any).text || (item as any).title || ''
        return {
          id: (item as any).id || `feature-${i}`,
          icon: (item as any).icon || 'Check',
          text: displayText,
          title: displayText
        }
      }

      // Convert string to object
      if (typeof item === 'string') {
        return {
          id: `feature-${i}`,
          icon: 'Check',
          text: item,
          title: item
        }
      }

      // Fallback
      return {
        id: `feature-${i}`,
        icon: 'Check',
        text: '',
        title: ''
      }
    })
  }, [rawFeatures])

  // Hero displays up to 4 features
  const maxFeatures = 4
  const canAddMore = features.length < maxFeatures

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Hero Features</Label>
          <p className="text-xs text-gray-500 mt-1">
            Mini-features displayed below CTA buttons (max {maxFeatures})
          </p>
        </div>
        <Button
          onClick={onAdd}
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs"
          disabled={!canAddMore}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Feature
        </Button>
      </div>

      {/* Features List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {features.map((feature, index) => {
          const IconComponent = getIcon(feature.icon)

          return (
            <div
              key={feature.id || index}
              className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {/* Icon Preview */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                {IconComponent && (
                  <IconComponent className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Feature Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {htmlToText(feature.text) || 'Untitled Feature'}
                </p>
                <p className="text-xs text-gray-500">
                  Icon: {feature.icon}
                </p>
              </div>

              {/* Delete Button */}
              <Button
                onClick={() => onDelete(index)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {features.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-500">No hero features added yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Click "Add Feature" to get started
          </p>
        </div>
      )}

      {/* Max Limit Warning */}
      {!canAddMore && (
        <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
          <p className="text-xs text-yellow-800">
            Maximum {maxFeatures} features reached. Delete a feature to add more.
          </p>
        </div>
      )}

      {/* Info Note */}
      <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> After adding or deleting features, you can edit their text and icons
          by clicking on them in Edit mode.
        </p>
      </div>
    </div>
  )
}
