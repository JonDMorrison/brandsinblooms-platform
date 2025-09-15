/**
 * Hero section preview component
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { htmlToText, textToHtml } from '@/src/lib/utils/html-text'
import { getFeatureGridClasses } from '@/src/components/content-sections/shared'
import { createResponsiveClassHelper, isPreviewMode } from '@/src/lib/utils/responsive-classes'

interface HeroPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
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
              format="rich"
              className={`${responsive.typography.heroSubheadline} mb-8 leading-relaxed block [&_.ProseMirror_p:not(:first-child)]:mt-2`}
              style={{ 
                color: 'var(--theme-text)',
                opacity: 0.8,
                fontFamily: 'var(--theme-font-body)'
              }}
              placeholder="Click to add subtitle..."
              showToolbar={false}
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

          {/* Features Grid */}
          {data.features && Array.isArray(data.features) && data.features.length > 0 && (
            <div
              className={`grid gap-6 text-center ${getFeatureGridClasses(data.features.length, isPreview)}`}
            >
              {data.features.slice(0, 4).map((feature: string, index: number) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                  >
                    <svg 
                      className="w-6 h-6 text-white" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <InlineTextEditor
                    content={feature}
                    onUpdate={(content) => {
                      if (onFeatureUpdate) {
                        onFeatureUpdate(sectionKey, index, content)
                      }
                    }}
                    isEnabled={Boolean(onFeatureUpdate)}
                    fieldPath={`data.features.${index}`}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}