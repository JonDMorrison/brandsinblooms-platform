/**
 * CTA section preview component
 * Matches the exact design and layout of the customer site CTA section
 * Implements proper container query responsive design and visual editing
 */

import React, { useState } from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { textToHtml, htmlToText } from '@/src/lib/utils/html-text'
import { getSectionBackgroundStyle } from '@/src/components/content-sections/shared/background-utils'
import { isPreviewMode, createResponsiveClassHelper } from '@/src/lib/utils/responsive-classes'
import { SmartLink } from '@/src/components/ui/smart-link'
import { LinkEditModal } from '@/src/components/site-editor/modals/LinkEditModal'
import { Settings } from 'lucide-react'
import { Button } from '@/src/components/ui/button'

interface CtaPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
}

export function CtaPreview({
  section,
  sectionKey,
  className = '',
  title,
  onContentUpdate,
  onFeatureUpdate
}: CtaPreviewProps) {
  const { data, settings } = section
  const isPreview = isPreviewMode(onContentUpdate, onFeatureUpdate)
  const responsive = createResponsiveClassHelper(isPreview)
  const backgroundStyle = getSectionBackgroundStyle(settings)
  const isPrimaryBackground = settings?.backgroundColor === 'primary'

  // Dynamic styling based on background mode
  const textColor = isPrimaryBackground ? 'white' : 'var(--theme-text)'
  const descriptionOpacity = isPrimaryBackground ? 1 : 0.7
  const descriptionColor = isPrimaryBackground ? 'rgba(255,255,255,0.9)' : 'var(--theme-text)'

  // State for link editing
  const [linkEditModalOpen, setLinkEditModalOpen] = useState(false)
  const [editingLinkField, setEditingLinkField] = useState<'cta' | 'secondaryCta' | null>(null)

  // Handle link editing
  const handleOpenLinkModal = (linkType: 'cta' | 'secondaryCta', e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingLinkField(linkType)
    setLinkEditModalOpen(true)
  }

  const handleLinkSave = (url: string) => {
    if (editingLinkField && onContentUpdate) {
      const fieldPath = editingLinkField === 'cta' ? 'data.ctaLink' : 'data.secondaryCtaLink'
      onContentUpdate(sectionKey, fieldPath, url)
    }
  }

  return (
    <section
      className={`py-16 ${className}`}
      style={backgroundStyle}
      data-bg-mode={isPrimaryBackground ? 'primary' : 'default'}
    >
      <div className="brand-container">
        <div className="max-w-4xl mx-auto text-center">
          {/* Inline editable headline */}
          <InlineTextEditor
            content={String(data.headline || 'Growing Together, Sustainably')}
            onUpdate={(content) => {
              if (onContentUpdate) {
                onContentUpdate(sectionKey, 'data.headline', content)
              }
            }}
            isEnabled={Boolean(onContentUpdate)}
            fieldPath="data.headline"
            format="plain"
            singleLine={true}
            className={`${responsive.typography.heroHeadline} mb-6 leading-tight`}
            style={{
              color: textColor,
              fontFamily: 'var(--theme-font-heading)'
            }}
            placeholder="Enter CTA headline..."
            showToolbar={false}
          />
          
          {/* Rich text description with HTML conversion */}
          <InlineTextEditor
            content={textToHtml(String(data.description || 'Our mission is to help you create thriving plant sanctuaries while protecting our planet for future generations.'))}
            onUpdate={(htmlContent) => {
              if (onContentUpdate) {
                const textContent = htmlToText(htmlContent)
                onContentUpdate(sectionKey, 'data.description', textContent)
              }
            }}
            isEnabled={Boolean(onContentUpdate)}
            fieldPath="data.description"
            format="simple-toolbar"
            className={`${responsive.typography.heroSubheadline} mb-8 max-w-2xl mx-auto leading-relaxed`}
            style={{
              color: descriptionColor,
              opacity: descriptionOpacity,
              fontFamily: 'var(--theme-font-body)'
            }}
            placeholder="Enter CTA description..."
          />

          {/* CTA Buttons with responsive layout */}
          <div
            className={`${responsive.flex.heroLayout} gap-4 justify-center`}
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
            {/* Primary CTA Button */}
            {(data.ctaText || data.ctaLink) && (
              <SmartLink
                href={String(data.ctaLink || '/plants')}
                className={`group relative inline-block px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 hover:opacity-90 ${
                  isPrimaryBackground
                    ? 'bg-white hover:bg-gray-100'
                    : 'hover:bg-theme-primary/90'
                }`}
                style={{
                  backgroundColor: isPrimaryBackground ? 'white' : 'var(--theme-primary)',
                  color: isPrimaryBackground ? 'var(--theme-primary)' : 'white',
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
                  }
                }}
              >
                <InlineTextEditor
                  content={String(data.ctaText || 'Shop Plants')}
                  onUpdate={(content) => {
                    if (onContentUpdate) {
                      onContentUpdate(sectionKey, 'data.ctaText', content)
                    }
                  }}
                  isEnabled={Boolean(onContentUpdate)}
                  fieldPath="data.ctaText"
                  format="plain"
                  singleLine={true}
                  className="inline"
                  style={{
                    color: isPrimaryBackground ? 'var(--theme-primary)' : 'white',
                    fontFamily: 'var(--theme-font-body)'
                  }}
                  placeholder="Button text..."
                  showToolbar={false}
                />
                {/* Link Settings Icon */}
                {isPreview && onContentUpdate && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-md rounded-full border border-gray-200 hover:bg-gray-50 z-10"
                    onClick={(e) => handleOpenLinkModal('cta', e)}
                    title="Edit link URL"
                  >
                    <Settings className="w-3 h-3 text-gray-700" />
                  </Button>
                )}
              </SmartLink>
            )}

            {/* Secondary CTA Button */}
            {(data.secondaryCtaText || data.secondaryCtaLink) && (
              <SmartLink
                href={String(data.secondaryCtaLink || '/products')}
                className={`group relative inline-block px-8 py-3 text-lg font-semibold rounded-lg border-2 transition-all duration-200 hover:opacity-80 ${
                  isPrimaryBackground
                    ? 'border-white text-white hover:bg-white hover:text-theme-primary'
                    : 'hover:bg-theme-primary hover:text-white'
                }`}
                style={{
                  borderColor: isPrimaryBackground ? 'white' : 'var(--theme-primary)',
                  color: isPrimaryBackground ? 'white' : 'var(--theme-primary)',
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
                  }
                }}
              >
                <InlineTextEditor
                  content={String(data.secondaryCtaText || 'Browse Plants')}
                  onUpdate={(content) => {
                    if (onContentUpdate) {
                      onContentUpdate(sectionKey, 'data.secondaryCtaText', content)
                    }
                  }}
                  isEnabled={Boolean(onContentUpdate)}
                  fieldPath="data.secondaryCtaText"
                  format="plain"
                  singleLine={true}
                  className="inline"
                  style={{
                    color: isPrimaryBackground ? 'white' : 'var(--theme-primary)',
                    fontFamily: 'var(--theme-font-body)'
                  }}
                  placeholder="Button text..."
                  showToolbar={false}
                />
                {/* Link Settings Icon */}
                {isPreview && onContentUpdate && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-md rounded-full border border-gray-200 hover:bg-gray-50 z-10"
                    onClick={(e) => handleOpenLinkModal('secondaryCta', e)}
                    title="Edit link URL"
                  >
                    <Settings className="w-3 h-3 text-gray-700" />
                  </Button>
                )}
              </SmartLink>
            )}
          </div>
        </div>
      </div>

      {/* Link Edit Modal */}
      <LinkEditModal
        isOpen={linkEditModalOpen}
        onClose={() => {
          setLinkEditModalOpen(false)
          setEditingLinkField(null)
        }}
        currentUrl={editingLinkField === 'cta' ? (data.ctaLink || '') : (data.secondaryCtaLink || '')}
        onSave={handleLinkSave}
        fieldLabel={editingLinkField === 'cta' ? 'Primary CTA Button' : 'Secondary CTA Button'}
        sectionType="CTA"
      />
    </section>
  )
}