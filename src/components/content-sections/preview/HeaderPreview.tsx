/**
 * Header section preview component
 * Simplified hero with only title and subtitle (no buttons or features)
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { isPreviewMode, createResponsiveClassHelper } from '@/src/lib/utils/responsive-classes'
import { getSectionBackgroundStyle } from '@/src/components/content-sections/shared/background-utils'

interface HeaderPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
}

export function HeaderPreview({
  section,
  sectionKey,
  className = '',
  onContentUpdate
}: HeaderPreviewProps) {
  const { data, settings } = section
  const isPreview = isPreviewMode(onContentUpdate)
  const responsive = createResponsiveClassHelper(isPreview)
  const backgroundStyle = getSectionBackgroundStyle(settings)

  return (
    <section
      className={`py-16 ${className}`}
      style={backgroundStyle}
    >
      <div className="brand-container">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <InlineTextEditor
            content={String(data.headline || '')}
            onUpdate={(content) => {
              if (onContentUpdate) {
                onContentUpdate(sectionKey, 'data.headline', content)
              }
            }}
            isEnabled={Boolean(onContentUpdate)}
            fieldPath="data.headline"
            format="plain"
            singleLine={true}
            className={`${responsive.typography.heroHeadline} mb-6`}
            style={{
              color: data.headlineColor || 'var(--theme-text)',
              fontFamily: 'var(--theme-font-heading)'
            }}
            placeholder="Enter page title..."
            showToolbar={true}
            debounceDelay={0}
          />

          {/* Subheadline */}
          {(data.subheadline || onContentUpdate) && (
            <InlineTextEditor
              content={data.subheadline || ''}
              onUpdate={(htmlContent) => {
                if (onContentUpdate) {
                  onContentUpdate(sectionKey, 'data.subheadline', htmlContent)
                }
              }}
              isEnabled={Boolean(onContentUpdate)}
              fieldPath="data.subheadline"
              format="simple-toolbar"
              singleLine={false}
              className="text-xl leading-relaxed"
              style={{
                color: data.subheadlineColor || 'var(--theme-text)',
                opacity: '0.8',
                fontFamily: 'var(--theme-font-body)'
              }}
              placeholder="Enter subtitle or description..."
              showToolbar={true}
              debounceDelay={0}
            />
          )}
        </div>
      </div>
    </section>
  )
}