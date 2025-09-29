/**
 * Business Information section preview component
 * Displays contact information with inline editing
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { isPreviewMode } from '@/src/lib/utils/responsive-classes'
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react'

interface BusinessInfoPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
}

export function BusinessInfoPreview({
  section,
  sectionKey,
  className = '',
  onContentUpdate
}: BusinessInfoPreviewProps) {
  const { data } = section
  const isPreview = isPreviewMode(onContentUpdate)

  const address = (data.address || {}) as any
  const socials = (data.socials || {}) as any
  const hours = Array.isArray(data.hours) ? data.hours : []

  const hasAddress = address.street || address.city || address.state || address.zip
  const hasSocials = socials.facebook || socials.instagram || socials.twitter || socials.linkedin

  return (
    <section className={`py-16 ${className}`} style={{ backgroundColor: 'var(--theme-background)' }}>
      <div className="brand-container">
        {/* Section Headline */}
        {(data.headline || onContentUpdate) && (
          <div className="mb-8">
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
              className="text-2xl font-bold"
              style={{
                color: 'var(--theme-text)',
                fontFamily: 'var(--theme-font-heading)'
              }}
              placeholder="Section title..."
              showToolbar={false}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Phone */}
          {(data.phone || onContentUpdate) && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: 'var(--theme-primary)' }} />
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }}>
                  Phone
                </h3>
                <InlineTextEditor
                  content={String(data.phone || '')}
                  onUpdate={(content) => {
                    if (onContentUpdate) {
                      onContentUpdate(sectionKey, 'data.phone', content)
                    }
                  }}
                  isEnabled={Boolean(onContentUpdate)}
                  fieldPath="data.phone"
                  format="plain"
                  singleLine={true}
                  className="text-sm"
                  style={{
                    color: 'var(--theme-text)',
                    fontFamily: 'var(--theme-font-body)'
                  }}
                  placeholder="(555) 123-4567"
                  showToolbar={false}
                />
              </div>
            </div>
          )}

          {/* Email */}
          {(data.email || onContentUpdate) && (
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: 'var(--theme-primary)' }} />
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }}>
                  Email
                </h3>
                <InlineTextEditor
                  content={String(data.email || '')}
                  onUpdate={(content) => {
                    if (onContentUpdate) {
                      onContentUpdate(sectionKey, 'data.email', content)
                    }
                  }}
                  isEnabled={Boolean(onContentUpdate)}
                  fieldPath="data.email"
                  format="plain"
                  singleLine={true}
                  className="text-sm"
                  style={{
                    color: 'var(--theme-text)',
                    fontFamily: 'var(--theme-font-body)'
                  }}
                  placeholder="contact@example.com"
                  showToolbar={false}
                />
              </div>
            </div>
          )}

          {/* Address */}
          {(hasAddress || onContentUpdate) && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: 'var(--theme-primary)' }} />
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }}>
                  Address
                </h3>
                <div className="text-sm space-y-1" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)' }}>
                  <div>{address.street || (onContentUpdate && <span className="text-gray-400">Street address</span>)}</div>
                  <div>
                    {address.city && `${address.city}, `}
                    {address.state} {address.zip}
                    {!address.city && !address.state && !address.zip && onContentUpdate && (
                      <span className="text-gray-400">City, State ZIP</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hours */}
          {(hours.length > 0 || onContentUpdate) && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: 'var(--theme-primary)' }} />
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }}>
                  Hours
                </h3>
                <div className="text-sm space-y-1" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)' }}>
                  {hours.length > 0 ? (
                    hours.map((hour: any, index: number) => (
                      <div key={index}>
                        <span className="font-medium">{hour.days}:</span> {hour.time}
                      </div>
                    ))
                  ) : (
                    onContentUpdate && <span className="text-gray-400">Add business hours in the editor</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Social Media */}
        {(hasSocials || onContentUpdate) && (
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }}>
              Connect With Us
            </h3>
            <div className="flex gap-4">
              {socials.facebook && (
                <a
                  href={socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                >
                  <Facebook className="w-5 h-5 text-white" />
                </a>
              )}
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                >
                  <Instagram className="w-5 h-5 text-white" />
                </a>
              )}
              {socials.twitter && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                >
                  <Twitter className="w-5 h-5 text-white" />
                </a>
              )}
              {socials.linkedin && (
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                >
                  <Linkedin className="w-5 h-5 text-white" />
                </a>
              )}
              {!hasSocials && onContentUpdate && (
                <span className="text-sm text-gray-400">Add social media links in the editor</span>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!data.phone && !data.email && !hasAddress && hours.length === 0 && !hasSocials && onContentUpdate && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No contact information added yet. Use the sidebar editor to add details.</p>
          </div>
        )}
      </div>
    </section>
  )
}