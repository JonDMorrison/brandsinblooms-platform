/**
 * Features section preview component with icon support
 * Matches the exact design and layout of the customer site features section
 */

import React, { useState } from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { textToHtml, htmlToText } from '@/src/lib/utils/html-text'
import { getSectionBackgroundStyle } from '@/src/components/content-sections/shared'
import { getIcon } from '@/src/components/content-sections/shared/icon-utils'
import { isPreviewMode, createResponsiveClassHelper } from '@/src/lib/utils/responsive-classes'
import { IconSelector } from '@/src/components/ui/IconSelector'
import { Dialog, DialogContent, DialogTitle } from '@/src/components/ui/dialog'

interface FeaturesPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, field: string, newContent: string) => void
}

interface FeatureItem {
  id: string
  icon: string
  title: string
  text?: string  // Alias for compatibility with Hero section
}

export function FeaturesPreview({
  section,
  sectionKey,
  className = '',
  onContentUpdate,
  onFeatureUpdate
}: FeaturesPreviewProps) {
  const { data, settings } = section
  const isPreview = isPreviewMode(onContentUpdate, onFeatureUpdate)
  const responsive = createResponsiveClassHelper(isPreview)

  // Convert old string[] format to new object[] format for backward compatibility
  // Also handles mixed arrays (some strings, some objects) that may exist from partial migrations
  const rawFeatures = data.features as string[] | FeatureItem[] | undefined
  const features: FeatureItem[] = React.useMemo(() => {
    if (!rawFeatures || !Array.isArray(rawFeatures)) return []

    // Handle each item individually to support mixed arrays
    return rawFeatures.map((item, i) => {
      // If already an object with required fields, return as-is
      if (item && typeof item === 'object' && ('title' in item || 'text' in item)) {
        const displayText = (item as any).title || (item as any).text || ''
        return {
          id: (item as any).id || `feature-${i}`,
          icon: (item as any).icon || 'Check',
          title: displayText,
          text: displayText
        }
      }

      // Convert string to object
      if (typeof item === 'string') {
        return {
          id: `feature-${i}`,
          icon: 'Check',
          title: item,
          text: item
        }
      }

      // Fallback for invalid items
      return {
        id: `feature-${i}`,
        icon: 'Check',
        title: '',
        text: ''
      }
    })
  }, [rawFeatures])

  // State for inline icon editing
  const [editingIconIndex, setEditingIconIndex] = useState<number | null>(null)

  // Handle icon click to open selector
  const handleIconClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Only allow icon editing in preview mode
    if (onFeatureUpdate && isPreview) {
      setEditingIconIndex(index)
    }
  }

  // Handle icon selection from modal
  const handleIconSelect = (iconName: string) => {
    if (editingIconIndex !== null && onFeatureUpdate) {
      onFeatureUpdate(sectionKey, editingIconIndex, 'icon', iconName)
    }
    setEditingIconIndex(null)
  }

  // Close modal
  const handleCloseModal = () => {
    setEditingIconIndex(null)
  }

  return (
    <section 
      className={`py-16 ${className}`} 
      style={getSectionBackgroundStyle(settings)}
    >
      <div className="brand-container">
        <div className="text-center mb-12">
          {/* Inline editable headline */}
          <InlineTextEditor
            content={String(data.headline || 'Essential Plant Care Features')}
            onUpdate={(content) => {
              if (onContentUpdate) {
                onContentUpdate(sectionKey, 'data.headline', content)
              }
            }}
            isEnabled={Boolean(onContentUpdate)}
            fieldPath="data.headline"
            format="plain"
            singleLine={true}
            className={`${responsive.typography.sectionHeading} mb-4`}
            style={{
              color: 'var(--theme-text)',
              fontFamily: 'var(--theme-font-heading)'
            }}
            placeholder="Enter headline..."
            showToolbar={false}
          />
          
          {/* Rich text description with HTML conversion */}
          <InlineTextEditor
            content={textToHtml(String(data.description || ''))}
            onUpdate={(htmlContent) => {
              if (onContentUpdate) {
                const textContent = htmlToText(htmlContent)
                onContentUpdate(sectionKey, 'data.description', textContent)
              }
            }}
            isEnabled={Boolean(onContentUpdate)}
            fieldPath="data.description"
            format="simple-toolbar"
            className="text-lg max-w-2xl mx-auto"
            style={{
              color: 'var(--theme-text)',
              opacity: '0.7',
              fontFamily: 'var(--theme-font-body)'
            }}
            placeholder="Enter description..."
          />
        </div>
        
        {/* Features Grid - matches customer site exactly */}
        <div className={`grid grid-cols-1 ${isPreview ? '@md:grid-cols-3' : 'md:grid-cols-3'} gap-6`}>
          {features.map((feature, index) => {
            const IconComponent = getIcon(feature.icon)

            return (
              <div
                key={`feature-${index}`}
                className="p-6 rounded-lg border text-center"
                style={{
                  backgroundColor: 'rgba(var(--theme-primary-rgb), 0.05)',
                  borderColor: 'rgba(var(--theme-primary-rgb), 0.1)'
                }}
                onClick={(e) => {
                  // Prevent navigation during inline editing
                  const isEditing = e.target.closest('[data-editing="true"]') ||
                                   e.target.closest('.ProseMirror') ||
                                   e.target.closest('.inline-editor-wrapper')
                  if (isEditing) {
                    e.preventDefault()
                    e.stopPropagation()
                  }
                }}
              >
                {/* Circular primary icon - matches customer site */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${
                    isPreview && onFeatureUpdate ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
                  }`}
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                  onClick={(e) => handleIconClick(index, e)}
                  title={isPreview && onFeatureUpdate ? 'Click to change icon' : undefined}
                >
                  {IconComponent && <IconComponent className="w-6 h-6 text-white" />}
                </div>

                {/* Inline editable feature text */}
                <InlineTextEditor
                  content={String(feature.title)}
                  onUpdate={(content) => {
                    if (onFeatureUpdate) {
                      onFeatureUpdate(sectionKey, index, 'title', content)
                    }
                  }}
                  isEnabled={Boolean(onFeatureUpdate)}
                  fieldPath={`data.features.${index}.title`}
                  format="plain"
                  singleLine={false}
                  className="text-sm font-medium"
                  style={{
                    color: 'var(--theme-text)',
                    fontFamily: 'var(--theme-font-body)'
                  }}
                  placeholder="Enter feature description..."
                  showToolbar={false}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Icon Selection Modal */}
      <Dialog open={editingIconIndex !== null} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogTitle className="sr-only">Select Icon</DialogTitle>
          <div className="p-4 sm:p-6 border-b">
            <h3 className="text-base sm:text-lg font-semibold">Choose an Icon</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {editingIconIndex !== null ? `Editing icon for feature "${features[editingIconIndex]?.title || 'feature'}"` : ''}
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <IconSelector
              value={editingIconIndex !== null ? features[editingIconIndex]?.icon || '' : ''}
              onChange={handleIconSelect}
              iconSize={16}
              maxResults={60}
            />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}