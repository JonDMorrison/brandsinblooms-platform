/**
 * Header section preview component
 * Simplified hero with only title and subtitle (no buttons or features)
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { htmlToText, textToHtml } from '@/src/lib/utils/html-text'
import { isPreviewMode, createResponsiveClassHelper } from '@/src/lib/utils/responsive-classes'

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

  // Determine background style
  const backgroundStyle = settings?.backgroundColor === 'gradient'
    ? { background: 'linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-secondary-rgb), 0.1))' }
    : { backgroundColor: 'var(--theme-background)' }

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
              color: 'var(--theme-text)',
              fontFamily: 'var(--theme-font-heading)'
            }}
            placeholder="Enter page title..."
            showToolbar={false}
          />

          {/* Subheadline */}
          {(data.subheadline || onContentUpdate) && (
            <InlineTextEditor
              content={textToHtml(String(data.subheadline || ''))}
              onUpdate={(htmlContent) => {
                if (onContentUpdate) {
                  const textContent = htmlToText(htmlContent)
                  onContentUpdate(sectionKey, 'data.subheadline', textContent)
                }
              }}
              isEnabled={Boolean(onContentUpdate)}
              fieldPath="data.subheadline"
              format="simple-toolbar"
              className="text-xl leading-relaxed"
              style={{
                color: 'var(--theme-text)',
                opacity: '0.8',
                fontFamily: 'var(--theme-font-body)'
              }}
              placeholder="Enter subtitle or description..."
            />
          )}
        </div>
      </div>
    </section>
  )
}