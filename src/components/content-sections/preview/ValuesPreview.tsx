/**
 * Values section preview component
 * Matches the exact design and layout of the customer site values section
 */

import React, { useState } from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { textToHtml, htmlToText } from '@/src/lib/utils/html-text'
import { getSectionBackgroundStyle } from '@/src/components/content-sections/shared'
import { getIcon } from '@/src/components/content-sections/shared/icon-utils'
import { isPreviewMode, createResponsiveClassHelper } from '@/src/lib/utils/responsive-classes'
import { IconSelector } from '@/src/components/ui/IconSelector'
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from '@/src/components/ui/dialog'

interface ValuesPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onValueUpdate?: (sectionKey: string, valueIndex: number, fieldPath: string, newContent: string) => void
}

export function ValuesPreview({
  section,
  sectionKey,
  className = '',
  title,
  onContentUpdate,
  onValueUpdate
}: ValuesPreviewProps) {
  const { data, settings } = section
  const items = (data.items as any[]) || []
  const isPreview = isPreviewMode(onContentUpdate, onValueUpdate)
  const responsive = createResponsiveClassHelper(isPreview)

  // State for inline icon editing
  const [editingIconIndex, setEditingIconIndex] = useState<number | null>(null)

  // Handle icon click to open selector
  const handleIconClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Only allow icon editing in preview mode
    if (onValueUpdate && isPreview) {
      setEditingIconIndex(index)
    }
  }

  // Handle icon selection from modal
  const handleIconSelect = (iconName: string) => {
    if (editingIconIndex !== null && onValueUpdate) {
      onValueUpdate(sectionKey, editingIconIndex, 'icon', iconName)
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
            content={String(data.headline || 'Our Core Values')}
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
          {data.description && (
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
          )}
        </div>

        {/* Values Grid - matches customer site exactly */}
        <div className={`grid grid-cols-1 ${isPreview ? '@md:grid-cols-2' : 'md:grid-cols-2'} gap-8`}>
          {items.map((value, index) => {
            const IconComponent = getIcon(value.icon)
            return (
              <div
                key={value.id || `value-${index}`}
                className="bg-white rounded-lg p-8 border hover:shadow-lg transition-shadow"
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
                <div className="flex items-start gap-4">
                  {/* Icon container with dynamic icon - clickable for editing */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isPreview && onValueUpdate ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
                    }`}
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                    onClick={(e) => handleIconClick(index, e)}
                    title={isPreview && onValueUpdate ? 'Click to change icon' : undefined}
                  >
                    {IconComponent ? (
                      <IconComponent className="w-6 h-6 text-white" />
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1">
                    {/* Inline editable value title */}
                    <InlineTextEditor
                      content={String(value.title || '')}
                      onUpdate={(content) => {
                        if (onValueUpdate) {
                          onValueUpdate(sectionKey, index, 'title', content)
                        }
                      }}
                      isEnabled={Boolean(onValueUpdate)}
                      fieldPath={`data.items.${index}.title`}
                      format="plain"
                      singleLine={true}
                      className="text-xl font-semibold mb-3"
                      style={{
                        color: 'var(--theme-text)',
                        fontFamily: 'var(--theme-font-heading)'
                      }}
                      placeholder="Enter value title..."
                      showToolbar={false}
                    />

                    {/* Inline editable value description */}
                    <InlineTextEditor
                      content={String(value.description || '')}
                      onUpdate={(content) => {
                        if (onValueUpdate) {
                          onValueUpdate(sectionKey, index, 'description', content)
                        }
                      }}
                      isEnabled={Boolean(onValueUpdate)}
                      fieldPath={`data.items.${index}.description`}
                      format="plain"
                      singleLine={false}
                      className="text-sm leading-relaxed"
                      style={{
                        color: 'var(--theme-text)',
                        opacity: '0.7',
                        fontFamily: 'var(--theme-font-body)'
                      }}
                      placeholder="Enter value description..."
                      showToolbar={false}
                    />
                  </div>
                </div>
              </div>
            )
          })}
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
              {editingIconIndex !== null ? `Editing icon for "${items[editingIconIndex]?.title || 'value'}"` : ''}
            </p>
          </div>
          <div className="p-6">
            <IconSelector
              value={editingIconIndex !== null ? items[editingIconIndex]?.icon || '' : ''}
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