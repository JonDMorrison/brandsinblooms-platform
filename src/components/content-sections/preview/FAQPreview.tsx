/**
 * FAQ section preview component
 * Displays FAQs in a 2-column grid layout with inline editing
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { htmlToText, textToHtml } from '@/src/lib/utils/html-text'
import { getSectionBackgroundStyle } from '@/src/components/content-sections/shared'
import { isPreviewMode, createResponsiveClassHelper } from '@/src/lib/utils/responsive-classes'

interface FAQPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFAQUpdate?: (sectionKey: string, faqIndex: number, updatedFAQ: Record<string, unknown>) => void
}

interface FAQItem {
  id: string
  question: string
  answer: string
  order?: number
}

/**
 * Parse FAQ data with backward compatibility for stringified JSON
 * Handles legacy data that was incorrectly saved as JSON strings
 */
function parseFAQData(data: unknown): FAQItem[] {
  // Case 1: Already an array (correct format)
  if (Array.isArray(data)) {
    return data as FAQItem[]
  }

  // Case 2: Stringified JSON (corrupted format from bug)
  if (typeof data === 'string' && data.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        console.warn('[FAQPreview] Auto-migrating stringified FAQ data to array format')
        return parsed as FAQItem[]
      }
    } catch (error) {
      console.error('[FAQPreview] Failed to parse stringified FAQ data:', error)
    }
  }

  // Case 3: Invalid or missing data
  return []
}

export function FAQPreview({
  section,
  sectionKey,
  className = '',
  onContentUpdate,
  onFAQUpdate
}: FAQPreviewProps) {
  const { data, settings } = section
  const isPreview = isPreviewMode(onContentUpdate)
  const responsive = createResponsiveClassHelper(isPreview)

  // Parse FAQ data with backward compatibility for stringified JSON
  const faqs: FAQItem[] = parseFAQData(data.faqs)

  return (
    <section
      className={`py-16 ${className}`}
      style={getSectionBackgroundStyle(settings)}
    >
      <div className="brand-container">
        <div className="text-center mb-12">
          {/* Section Headline */}
          <InlineTextEditor
            content={String(data.headline || 'Frequently Asked Questions')}
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
            placeholder="Section title..."
            showToolbar={false}
          />

          {/* Optional Description */}
          {(data.description || onContentUpdate) && (
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
              placeholder="Optional description..."
            />
          )}
        </div>

        {/* FAQ Grid */}
        <div className={`grid grid-cols-1 ${isPreview ? '@md:grid-cols-2' : 'md:grid-cols-2'} gap-8`}>
          {faqs.map((faq, index) => (
            <div
              key={faq.id || index}
              className="bg-white rounded-lg p-6 border"
              onClick={(e) => {
                // Prevent navigation during inline editing
                const target = e.target as HTMLElement
                const isEditing = target.closest('[data-editing="true"]') ||
                                 target.closest('.ProseMirror') ||
                                 target.closest('.inline-editor-wrapper')
                if (isEditing) {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
            >
              {/* Question */}
              <InlineTextEditor
                content={textToHtml(String(faq.question || ''))}
                onUpdate={(htmlContent) => {
                  const textContent = htmlToText(htmlContent)
                  if (onFAQUpdate) {
                    // Use new FAQ-specific handler (correct way)
                    onFAQUpdate(sectionKey, index, { question: textContent })
                  } else if (onContentUpdate) {
                    // Fallback for backward compatibility
                    const newFAQs = [...faqs]
                    newFAQs[index] = { ...newFAQs[index], question: textContent }
                    onContentUpdate(sectionKey, 'data.faqs', JSON.stringify(newFAQs))
                  }
                }}
                isEnabled={Boolean(onContentUpdate || onFAQUpdate)}
                fieldPath={`data.faqs.${index}.question`}
                format="simple-toolbar"
                className="text-lg font-semibold mb-3"
                style={{
                  color: 'var(--theme-text)',
                  fontFamily: 'var(--theme-font-heading)'
                }}
                placeholder="Enter question..."
              />

              {/* Answer */}
              <InlineTextEditor
                content={textToHtml(String(faq.answer || ''))}
                onUpdate={(htmlContent) => {
                  const textContent = htmlToText(htmlContent)
                  if (onFAQUpdate) {
                    // Use new FAQ-specific handler (correct way)
                    onFAQUpdate(sectionKey, index, { answer: textContent })
                  } else if (onContentUpdate) {
                    // Fallback for backward compatibility
                    const newFAQs = [...faqs]
                    newFAQs[index] = { ...newFAQs[index], answer: textContent }
                    onContentUpdate(sectionKey, 'data.faqs', JSON.stringify(newFAQs))
                  }
                }}
                isEnabled={Boolean(onContentUpdate || onFAQUpdate)}
                fieldPath={`data.faqs.${index}.answer`}
                format="simple-toolbar"
                className="text-sm"
                style={{
                  color: 'var(--theme-text)',
                  opacity: '0.8',
                  fontFamily: 'var(--theme-font-body)'
                }}
                placeholder="Enter answer..."
              />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {faqs.length === 0 && onContentUpdate && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No FAQ items added yet. Use the sidebar editor to add FAQs.</p>
          </div>
        )}
      </div>
    </section>
  )
}