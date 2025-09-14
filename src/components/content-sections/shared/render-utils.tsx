/**
 * Generic rendering utility functions for content items
 */

import React from 'react'
import { ContentItem } from '@/src/lib/content/schema'
import { ContentRenderer } from '@/src/components/preview/ContentRenderer'
import { Button } from '@/src/components/ui/button'
import { getIcon } from './icon-utils'

/**
 * Safely cast and render items array with responsive grid
 */
export const renderItems = (items: unknown, columns: number = 3) => {
  if (!Array.isArray(items) || items.length === 0) return null

  const gridCols = Math.min(columns, 4) // Max 4 columns for responsive design
  const gridClass = `grid gap-4 grid-cols-1 ${
    gridCols >= 2 ? 'sm:grid-cols-2' : ''
  } ${
    gridCols >= 3 ? 'lg:grid-cols-3' : ''
  } ${
    gridCols >= 4 ? 'xl:grid-cols-4' : ''
  }`

  // Safely cast items to ContentItem array
  const contentItems: ContentItem[] = items
    .map(item => item as unknown as ContentItem)
    .filter(item => item && typeof item === 'object' && item.id)

  return (
    <div className={gridClass}>
      {contentItems.map((item: ContentItem, index: number) => (
        <div key={item.id || index} className="space-y-2">
          {item.image && (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src={item.image} 
                alt={item.title || ''} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = '<span class="text-gray-400">Image</span>'
                  }
                }}
              />
            </div>
          )}
          {item.icon && (
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              {(() => {
                const IconComponent = getIcon(item.icon)
                return IconComponent ? (
                  <IconComponent className="h-6 w-6 text-blue-600" />
                ) : (
                  <span className="text-xs text-blue-600">{item.icon}</span>
                )
              })()}
            </div>
          )}
          {item.title && (
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
          )}
          {item.subtitle && (
            <p className="text-sm text-gray-600">{item.subtitle}</p>
          )}
          {item.content && (
            <ContentRenderer content={item.content} className="text-sm text-gray-600" />
          )}
          {item.url && (
            <Button variant="outline" size="sm" className="w-full">
              Learn More
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}