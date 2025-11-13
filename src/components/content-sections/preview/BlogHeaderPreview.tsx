/**
 * Blog Header section preview component
 * Displays blog post metadata: title, subtitle, author, published date, and optional featured image
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { htmlToText, textToHtml } from '@/src/lib/utils/html-text'
import { isPreviewMode, createResponsiveClassHelper } from '@/src/lib/utils/responsive-classes'
import { Calendar, User } from 'lucide-react'

interface BlogHeaderPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
}

export function BlogHeaderPreview({
  section,
  sectionKey,
  className = '',
  onContentUpdate
}: BlogHeaderPreviewProps) {
  const { data, settings } = section
  const isPreview = isPreviewMode(onContentUpdate)
  const responsive = createResponsiveClassHelper(isPreview)

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Determine background style
  const backgroundStyle = settings?.backgroundColor === 'gradient'
    ? { background: 'linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-secondary-rgb), 0.1))' }
    : settings?.backgroundColor === 'alternate'
    ? { backgroundColor: 'var(--theme-background-alternate, #F9FAFB)' }
    : { backgroundColor: 'var(--theme-background)' }

  return (
    <section
      className={`py-16 ${className}`}
      style={backgroundStyle}
    >
      <div className="brand-container">
        <div className="max-w-4xl mx-auto">
          {/* Featured Image (optional) */}
          {data.image && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={String(data.image)}
                alt={String(data.title || 'Blog post featured image')}
                className="w-full h-auto object-cover max-h-96"
                style={{
                  aspectRatio: '16 / 9'
                }}
              />
            </div>
          )}

          {/* Blog Metadata */}
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
            {/* Author */}
            {(data.author || onContentUpdate) && (
              <div className="flex items-center gap-2">
                <User
                  className="h-4 w-4"
                  style={{ color: 'var(--theme-text-muted, #6B7280)' }}
                />
                <InlineTextEditor
                  content={String(data.author || '')}
                  onUpdate={(content) => {
                    if (onContentUpdate) {
                      onContentUpdate(sectionKey, 'data.author', content)
                    }
                  }}
                  isEnabled={Boolean(onContentUpdate)}
                  fieldPath="data.author"
                  format="plain"
                  singleLine={true}
                  className="text-sm"
                  style={{
                    color: 'var(--theme-text-muted, #6B7280)',
                    fontFamily: 'var(--theme-font-body)'
                  }}
                  placeholder="Author name"
                  showToolbar={false}
                />
              </div>
            )}

            {/* Published Date */}
            {(data.publishedDate || onContentUpdate) && (
              <div className="flex items-center gap-2">
                <Calendar
                  className="h-4 w-4"
                  style={{ color: 'var(--theme-text-muted, #6B7280)' }}
                />
                {onContentUpdate ? (
                  <input
                    type="date"
                    value={String(data.publishedDate || '')}
                    onChange={(e) => {
                      if (onContentUpdate) {
                        onContentUpdate(sectionKey, 'data.publishedDate', e.target.value)
                      }
                    }}
                    className="text-sm border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
                    style={{
                      color: 'var(--theme-text-muted, #6B7280)',
                      fontFamily: 'var(--theme-font-body)'
                    }}
                  />
                ) : (
                  <span
                    className="text-sm"
                    style={{
                      color: 'var(--theme-text-muted, #6B7280)',
                      fontFamily: 'var(--theme-font-body)'
                    }}
                  >
                    {formatDate(String(data.publishedDate || ''))}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <InlineTextEditor
            content={String(data.title || '')}
            onUpdate={(content) => {
              if (onContentUpdate) {
                onContentUpdate(sectionKey, 'data.title', content)
              }
            }}
            isEnabled={Boolean(onContentUpdate)}
            fieldPath="data.title"
            format="plain"
            singleLine={true}
            className={`${responsive.typography.heroHeadline} mb-6`}
            style={{
              color: data.titleColor || 'var(--theme-text)',
              fontFamily: 'var(--theme-font-heading)'
            }}
            placeholder="Enter blog post title..."
            showToolbar={false}
          />

          {/* Subtitle */}
          {(data.subtitle || onContentUpdate) && (
            <InlineTextEditor
              content={textToHtml(String(data.subtitle || ''))}
              onUpdate={(htmlContent) => {
                if (onContentUpdate) {
                  const textContent = htmlToText(htmlContent)
                  onContentUpdate(sectionKey, 'data.subtitle', textContent)
                }
              }}
              isEnabled={Boolean(onContentUpdate)}
              fieldPath="data.subtitle"
              format="simple-toolbar"
              className="text-xl leading-relaxed"
              style={{
                color: data.subtitleColor || 'var(--theme-text)',
                opacity: '0.8',
                fontFamily: 'var(--theme-font-body)'
              }}
              placeholder="Enter subtitle or summary..."
            />
          )}
        </div>
      </div>
    </section>
  )
}
