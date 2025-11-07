/**
 * Mission section preview component
 * Matches the exact design and layout of the customer site mission section
 * Implements visual inline editing for both headline and content
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { getSectionBackgroundStyle } from '@/src/components/content-sections/shared/background-utils'
import { isPreviewMode, createResponsiveClassHelper } from '@/src/lib/utils/responsive-classes'

interface MissionPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string
  siteId?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
}

export function MissionPreview({
  section,
  sectionKey,
  className = '',
  siteId,
  onContentUpdate,
  onFeatureUpdate
}: MissionPreviewProps) {
  const { data, settings } = section
  const isPreview = isPreviewMode(onContentUpdate, onFeatureUpdate)
  const responsive = createResponsiveClassHelper(isPreview)
  const backgroundStyle = getSectionBackgroundStyle(settings)

  return (
    <section
      className={`py-16 ${className}`}
      style={backgroundStyle}
    >
      <div className="brand-container">
        <div className="max-w-4xl mx-auto text-center">
          {/* Inline editable headline */}
          <InlineTextEditor
            content={String(data.headline || 'Our Mission')}
            onUpdate={(content) => {
              if (onContentUpdate) {
                onContentUpdate(sectionKey, 'data.headline', content)
              }
            }}
            isEnabled={Boolean(onContentUpdate)}
            fieldPath="data.headline"
            format="plain"
            singleLine={true}
            className="text-3xl md:text-4xl font-bold mb-6"
            style={{
              color: 'var(--theme-text)',
              fontFamily: 'var(--theme-font-heading)'
            }}
            placeholder="Enter mission headline..."
            showToolbar={false}
          />

          {/* Rich text content with HTML support and proper paragraph spacing */}
          <div
            className="text-lg md:text-xl leading-relaxed [&_p]:mb-0 [&_p:not(:first-child)]:mt-4"
            style={{
              color: 'var(--theme-text)',
              opacity: '0.8',
              fontFamily: 'var(--theme-font-body)'
            }}
          >
            <InlineTextEditor
              content={data.content || ''}
              onUpdate={(content) => {
                if (onContentUpdate) {
                  onContentUpdate(sectionKey, 'data.content', content)
                }
              }}
              isEnabled={Boolean(onContentUpdate)}
              fieldPath="data.content"
              format="rich"
              className="block w-full min-h-[60px]"
              placeholder="Enter your mission statement..."
              siteId={siteId}
              showToolbar={true}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
