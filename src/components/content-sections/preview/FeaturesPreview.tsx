/**
 * Features section preview component
 * Matches the exact design and layout of the customer site features section
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { textToHtml, htmlToText } from '@/src/lib/utils/html-text'
import { getSectionBackgroundStyle } from '@/src/components/content-sections/shared'
import { isPreviewMode, createResponsiveClassHelper } from '@/src/lib/utils/responsive-classes'

interface FeaturesPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
}

export function FeaturesPreview({ 
  section, 
  sectionKey, 
  className = '', 
  title, 
  onContentUpdate, 
  onFeatureUpdate 
}: FeaturesPreviewProps) {
  const { data, settings } = section
  const features = (data.features as string[]) || []
  const isPreview = isPreviewMode(onContentUpdate, onFeatureUpdate)
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
          {features.map((feature, index) => (
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
              {/* Circular primary icon with checkmark - matches customer site */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              
              {/* Inline editable feature text */}
              <InlineTextEditor
                content={String(feature)}
                onUpdate={(content) => {
                  if (onFeatureUpdate) {
                    onFeatureUpdate(sectionKey, index, content)
                  }
                }}
                isEnabled={Boolean(onFeatureUpdate)}
                fieldPath={`data.features.${index}`}
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
          ))}
        </div>
      </div>
    </section>
  )
}