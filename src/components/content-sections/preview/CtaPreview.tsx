/**
 * CTA section preview component
 */

import React from 'react'
import { ContentSection, ContentItem } from '@/src/lib/content/schema'
import { ContentRenderer } from '@/src/components/preview/ContentRenderer'
import { Button } from '@/src/components/ui/button'
import { getIcon } from '@/src/components/content-sections/shared'

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
  const { data } = section

  return (
    <div className={`text-center bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {data.content && (
        <ContentRenderer content={data.content} className="text-2xl font-bold mb-4 text-gray-900" />
      )}
      {data.items && Array.isArray(data.items) && data.items.length > 0 && (
        <div className="space-y-4">
          {data.items.slice(0, 1).map(item => item as unknown as ContentItem).filter(item => 
            item && typeof item === 'object' && item.id
          ).map((item: ContentItem, index: number) => (
            <div key={item.id || index}>
              {item.subtitle && (
                <p className="text-gray-600 mb-4">{item.subtitle}</p>
              )}
              <Button>
                {item.title || 'Get Started'}
                {(() => {
                  const IconComponent = getIcon('ArrowRight')
                  return IconComponent ? <IconComponent className="h-4 w-4 ml-2" /> : null
                })()}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}