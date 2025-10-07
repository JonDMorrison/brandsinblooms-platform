/**
 * Hero section preview component with icon support
 */

import React, { useState } from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { htmlToText, textToHtml } from '@/src/lib/utils/html-text'
import { getFeatureGridClasses } from '@/src/components/content-sections/shared'
import { getIcon } from '@/src/components/content-sections/shared/icon-utils'
import { createResponsiveClassHelper, isPreviewMode } from '@/src/lib/utils/responsive-classes'
import { IconSelector } from '@/src/components/ui/IconSelector'
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from '@/src/components/ui/dialog'

interface HeroPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, field: string, newContent: string) => void
}

interface HeroFeatureItem {
  id: string
  icon: string
  text: string
  title?: string  // Alias for compatibility with Features section
}

export function HeroPreview({
  section,
  sectionKey,
  className = '',
  title,
  onContentUpdate,
  onFeatureUpdate
}: HeroPreviewProps) {
  const { data } = section
  const isPreview = isPreviewMode(onContentUpdate, onFeatureUpdate)
  const responsive = createResponsiveClassHelper(isPreview)

  // Convert old string[] format to new object[] format for backward compatibility
  // Also handles mixed arrays (some strings, some objects) that may exist from partial migrations
  const rawFeatures = data.features as string[] | HeroFeatureItem[] | undefined
  const features: HeroFeatureItem[] = React.useMemo(() => {
    if (!rawFeatures || !Array.isArray(rawFeatures)) return []

    // Handle each item individually to support mixed arrays
    return rawFeatures.map((item, i) => {
      // If already an object with required fields, return as-is
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

      // Fallback for invalid items
      return {
        id: `feature-${i}`,
        icon: 'Check',
        text: '',
        title: ''
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
      className={`relative ${responsive.spacing.heroSectionPadding} ${className}`}
      style={{
        background: `linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-secondary-rgb), 0.1))`
      }}
    >
      <div className="brand-container">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main headline - use from data.headline or title */}
          {(data.headline || title) && (
            <InlineTextEditor
              content={data.headline || title || ''}
              onUpdate={(content) => {
                if (onContentUpdate) {
                  onContentUpdate(sectionKey, 'data.headline', content)
                }
              }}
              isEnabled={Boolean(onContentUpdate)}
              fieldPath="data.headline"
              format="plain"
              singleLine={true}
              className={`${responsive.typography.heroHeadline} mb-6 block`}
              style={{ 
                color: 'var(--theme-text)',
                fontFamily: 'var(--theme-font-heading)'
              }}
              placeholder="Enter your headline..."
              showToolbar={false}
              debounceDelay={0}
            />
          )}

          {/* Subheadline */}
          {(data.subheadline || onContentUpdate) && (
            <InlineTextEditor
              content={textToHtml(data.subheadline || '')}
              onUpdate={(htmlContent) => {
                if (onContentUpdate) {
                  const textContent = htmlToText(htmlContent)
                  onContentUpdate(sectionKey, 'data.subheadline', textContent)
                }
              }}
              isEnabled={Boolean(onContentUpdate)}
              fieldPath="data.subheadline"
              format="simple-toolbar"
              className={`${responsive.typography.heroSubheadline} mb-8 leading-relaxed block [&_.ProseMirror_p:not(:first-child)]:mt-2`}
              style={{ 
                color: 'var(--theme-text)',
                opacity: 0.8,
                fontFamily: 'var(--theme-font-body)'
              }}
              placeholder="Click to add subtitle..."
              debounceDelay={0}
            />
          )}

          {/* CTA Buttons */}
          <div className={`${responsive.flex.heroLayout} gap-4 justify-center mb-12`}>
            {(data.ctaText || onContentUpdate) && (
              <a 
                href={data.ctaLink || '#'}
                className="px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 inline-flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  color: 'rgb(255, 255, 255)',
                  fontFamily: 'var(--theme-font-body)'
                }}
                onClick={(e) => {
                  // Check if inline editor is currently active/editing
                  const isEditing = e.target.closest('[data-editing="true"]') || 
                                   e.target.closest('.ProseMirror') ||
                                   e.target.closest('.inline-editor-wrapper')
                  if (isEditing) {
                    e.preventDefault()
                    e.stopPropagation()
                    // Let the editor handle the click
                  }
                }}
              >
                <InlineTextEditor
                  content={data.ctaText || ''}
                  onUpdate={(content) => {
                    if (onContentUpdate) {
                      onContentUpdate(sectionKey, 'data.ctaText', content)
                    }
                  }}
                  isEnabled={Boolean(onContentUpdate)}
                  fieldPath="data.ctaText"
                  format="plain"
                  singleLine={true}
                  className="font-semibold leading-none [&_.ProseMirror]:text-center [&_.ProseMirror]:!min-h-0 [&_.ProseMirror]:leading-none [&_.inline-editor-wrapper]:min-h-0 [&_.inline-editor-wrapper]:leading-none"
                  style={{
                    color: 'inherit',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Add button text..."
                  showToolbar={false}
                  debounceDelay={0}
                />
              </a>
            )}
            {(data.secondaryCtaText || onContentUpdate) && (
              <a 
                href={data.secondaryCtaLink || '#'}
                className="border px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:opacity-80 inline-flex items-center justify-center"
                style={{
                  borderColor: 'var(--theme-secondary)',
                  color: 'var(--theme-secondary)',
                  backgroundColor: 'transparent',
                  fontFamily: 'var(--theme-font-body)'
                }}
                onClick={(e) => {
                  // Check if inline editor is currently active/editing
                  const isEditing = e.target.closest('[data-editing="true"]') || 
                                   e.target.closest('.ProseMirror') ||
                                   e.target.closest('.inline-editor-wrapper')
                  if (isEditing) {
                    e.preventDefault()
                    e.stopPropagation()
                    // Let the editor handle the click
                  }
                }}
              >
                <InlineTextEditor
                  content={data.secondaryCtaText || ''}
                  onUpdate={(content) => {
                    if (onContentUpdate) {
                      onContentUpdate(sectionKey, 'data.secondaryCtaText', content)
                    }
                  }}
                  isEnabled={Boolean(onContentUpdate)}
                  fieldPath="data.secondaryCtaText"
                  format="plain"
                  singleLine={true}
                  className="font-semibold leading-none [&_.ProseMirror]:text-center [&_.ProseMirror]:!min-h-0 [&_.ProseMirror]:leading-none [&_.inline-editor-wrapper]:min-h-0 [&_.inline-editor-wrapper]:leading-none"
                  style={{
                    color: 'inherit',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Add secondary button text..."
                  showToolbar={false}
                  debounceDelay={0}
                />
              </a>
            )}
          </div>

          {/* Features Grid with Icon Support */}
          {features.length > 0 && (
            <div
              className={`grid gap-6 text-center ${getFeatureGridClasses(features.length, isPreview)}`}
            >
              {features.slice(0, 4).map((feature, index) => {
                const IconComponent = getIcon(feature.icon)

                return (
                  <div key={feature.id || index} className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 flex-shrink-0 ${
                        isPreview && onFeatureUpdate ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
                      }`}
                      style={{ backgroundColor: 'var(--theme-primary)' }}
                      onClick={(e) => handleIconClick(index, e)}
                      title={isPreview && onFeatureUpdate ? 'Click to change icon' : undefined}
                    >
                      {IconComponent && <IconComponent className="w-6 h-6 text-white" />}
                    </div>
                    <InlineTextEditor
                      content={feature.text}
                      onUpdate={(content) => {
                        if (onFeatureUpdate) {
                          onFeatureUpdate(sectionKey, index, 'text', content)
                        }
                      }}
                      isEnabled={Boolean(onFeatureUpdate)}
                      fieldPath={`data.features.${index}.text`}
                      format="plain"
                      singleLine={true}
                      className="text-sm font-medium [&_.ProseMirror]:text-center [&_.ProseMirror]:!min-h-0 [&_.ProseMirror]:leading-none [&_.inline-editor-wrapper]:min-h-0"
                      style={{
                        color: 'var(--theme-text)',
                        fontFamily: 'var(--theme-font-body)'
                      }}
                      placeholder="Add feature text..."
                      showToolbar={false}
                      debounceDelay={0}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Icon Selection Modal */}
      <Dialog open={editingIconIndex !== null} onOpenChange={handleCloseModal}>
        <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[500px] max-w-[90vw] bg-white rounded-lg shadow-xl p-0">
          <DialogTitle className="sr-only">Select Icon</DialogTitle>
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Choose an Icon</h3>
            <p className="text-sm text-gray-600 mt-1">
              {editingIconIndex !== null ? `Editing icon for feature "${features[editingIconIndex]?.text || 'feature'}"` : ''}
            </p>
          </div>
          <div className="p-6">
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