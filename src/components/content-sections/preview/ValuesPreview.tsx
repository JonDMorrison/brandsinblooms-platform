/**
 * Values section preview component
 * Matches the exact design and layout of the customer site values section
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { textToHtml, htmlToText } from '@/src/lib/utils/html-text'
import { getSectionBackgroundStyle } from '@/src/components/content-sections/shared'
import { getIcon } from '@/src/components/content-sections/shared/icon-utils'
import { isPreviewMode, createResponsiveClassHelper } from '@/src/lib/utils/responsive-classes'

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
                  {/* Icon container with dynamic icon */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--theme-primary)' }}
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
    </section>
  )
}