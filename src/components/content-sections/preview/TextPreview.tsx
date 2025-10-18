/**
 * Text/RichText section preview component
 * Handles both 'text' and 'richText' section types with visual inline editing
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { ContentRenderer } from '@/src/components/preview/ContentRenderer'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { createResponsiveClassHelper, isPreviewMode } from '@/src/lib/utils/responsive-classes'
import { getSectionBackgroundStyle } from '@/src/components/content-sections/shared/background-utils'

interface TextPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string
  siteId?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
}

export function TextPreview({
  section,
  sectionKey,
  className = '',
  title,
  siteId,
  onContentUpdate,
  onFeatureUpdate
}: TextPreviewProps) {
  const { data, settings } = section
  const isPreview = isPreviewMode(onContentUpdate, onFeatureUpdate)
  const responsive = createResponsiveClassHelper(isPreview)

  // If we have onContentUpdate, use InlineTextEditor for visual editing
  if (onContentUpdate) {
    return (
      <section
        className={`relative ${responsive.spacing.sectionPadding} ${className}`}
        style={getSectionBackgroundStyle(settings)}
      >
        <div className="brand-container">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-gray max-w-none overflow-hidden">
              <InlineTextEditor
                content={data.content || ''}
                onUpdate={(htmlContent) => {
                  onContentUpdate(sectionKey, 'data.content', htmlContent)
                }}
                isEnabled={true}
                fieldPath="data.content"
                format="rich"
                siteId={siteId}
                className="prose prose-gray max-w-none min-h-[100px]"
                style={{
                  color: 'var(--theme-text)',
                  fontFamily: 'var(--theme-font-body)'
                }}
                placeholder="Click to add rich text content..."
                showToolbar={true}
                debounceDelay={500}
              />
            </div>
          </div>

          {/* CSS for Rich Text heading styles with text alignment support */}
          <style jsx>{`
            /* H1 Styles - responsive with container queries */
            :global(.prose h1) {
              font-size: 2.25rem; /* text-4xl */
              font-weight: 700; /* font-bold */
              margin-bottom: 1.5rem; /* mb-6 */
              color: var(--theme-primary);
              font-family: var(--theme-font-heading);
            }

            /* H1 responsive size for larger containers */
            @container (min-width: 28rem) {
              :global(.prose h1) {
                font-size: 3.75rem; /* @md:text-6xl */
              }
            }

            /* H2 Styles - responsive with container queries */
            :global(.prose h2) {
              font-size: 1.875rem; /* text-3xl */
              font-weight: 700; /* font-bold */
              margin-bottom: 2rem; /* mb-8 */
              color: var(--theme-primary);
              font-family: var(--theme-font-heading);
            }

            /* H2 responsive size for larger containers */
            @container (min-width: 28rem) {
              :global(.prose h2) {
                font-size: 2.25rem; /* @md:text-4xl */
              }
            }

            /* Text alignment support for headings */
            :global(.prose h1.text-center),
            :global(.prose h2.text-center) {
              text-align: center;
            }

            :global(.prose h1.text-right),
            :global(.prose h2.text-right) {
              text-align: right;
            }

            :global(.prose h1.text-left),
            :global(.prose h2.text-left),
            :global(.prose h1:not(.text-center):not(.text-right)),
            :global(.prose h2:not(.text-center):not(.text-right)) {
              text-align: left;
            }
          `}</style>
        </div>
      </section>
    )
  }

  // Fallback to read-only ContentRenderer for non-editable contexts
  return (
    <section
      className={`relative ${responsive.spacing.sectionPadding} ${className}`}
      style={getSectionBackgroundStyle(settings)}
    >
      <div className="brand-container">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-gray max-w-none overflow-hidden">
            {data.content && <ContentRenderer content={data.content} />}
          </div>
        </div>

        {/* CSS for Rich Text heading styles - same as edit mode */}
        <style jsx>{`
          /* H1 Styles - responsive with container queries */
          :global(.prose h1) {
            font-size: 2.25rem; /* text-4xl */
            font-weight: 700; /* font-bold */
            margin-bottom: 1.5rem; /* mb-6 */
            color: var(--theme-primary);
            font-family: var(--theme-font-heading);
          }

          /* H1 responsive size for larger containers */
          @container (min-width: 28rem) {
            :global(.prose h1) {
              font-size: 3.75rem; /* @md:text-6xl */
            }
          }

          /* H2 Styles - responsive with container queries */
          :global(.prose h2) {
            font-size: 1.875rem; /* text-3xl */
            font-weight: 700; /* font-bold */
            margin-bottom: 2rem; /* mb-8 */
            color: var(--theme-primary);
            font-family: var(--theme-font-heading);
          }

          /* H2 responsive size for larger containers */
          @container (min-width: 28rem) {
            :global(.prose h2) {
              font-size: 2.25rem; /* @md:text-4xl */
            }
          }

          /* Text alignment support for headings */
          :global(.prose h1.text-center),
          :global(.prose h2.text-center) {
            text-align: center;
          }

          :global(.prose h1.text-right),
          :global(.prose h2.text-right) {
            text-align: right;
          }

          :global(.prose h1.text-left),
          :global(.prose h2.text-left),
          :global(.prose h1:not(.text-center):not(.text-right)),
          :global(.prose h2:not(.text-center):not(.text-right)) {
            text-align: left;
          }
        `}</style>
      </div>
    </section>
  )
}