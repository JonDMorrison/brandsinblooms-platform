'use client'

import React from 'react'
import { ContentSection, ContentItem } from '@/src/lib/content/schema'
import { ContentRenderer } from './ContentRenderer'
import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import * as LucideIcons from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import { useSiteTheme } from '@/hooks/useSiteTheme'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { getFeaturedPlants } from '@/src/data/plant-shop-content'
// Helper functions for newline/HTML conversion
const textToHtml = (text: string): string => {
  if (!text) return ''
  // Split on double newlines for paragraphs, single newlines become <br>
  return text
    .split('\n\n')
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph)
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

const htmlToText = (html: string): string => {
  if (!html) return ''
  // Convert HTML back to plain text with newlines
  return html
    .replace(/<\/p><p>/g, '\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/?p>/g, '')
    .trim()
}

// Helper function to get responsive grid classes for features
const getFeatureGridClasses = (featureCount: number): string => {
  if (featureCount === 1) {
    return 'grid-cols-1'
  } else if (featureCount === 2) {
    return 'grid-cols-2'
  } else if (featureCount === 3) {
    return 'grid-cols-2 md:grid-cols-3'
  } else {
    return 'grid-cols-2 md:grid-cols-4'
  }
}

// Helper function to get responsive grid classes for products (matches HomePage.tsx)
const getProductGridClasses = (productCount: number): string => {
  if (productCount === 1) {
    return 'grid-cols-1'
  } else if (productCount === 2) {
    return 'grid-cols-1 sm:grid-cols-2'
  } else if (productCount === 3) {
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
  } else {
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }
}

interface DynamicSectionProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string // Page title for hero sections
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
}

function DynamicSectionComponent({ section, sectionKey, className = '', title, onContentUpdate, onFeatureUpdate }: DynamicSectionProps) {
  const { theme } = useSiteTheme()
  
  // Don't render if section is not visible or has no data
  if (!section.visible) {
    return null
  }

  const { type, data, settings } = section

  // Helper function to get Lucide icon by name
  const getIcon = (iconName?: string): LucideIcon | null => {
    if (!iconName) return null
    // Convert lowercase icon names to PascalCase for Lucide React
    const pascalCase = iconName.charAt(0).toUpperCase() + iconName.slice(1)
    const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[pascalCase]
    // Try exact match first, then try with Icon suffix
    return IconComponent || (LucideIcons as unknown as Record<string, LucideIcon>)[`${pascalCase}Icon`] || null
  }

  // Helper function to safely cast and render items array
  const renderItems = (items: unknown, columns: number = 3) => {
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

  // Section-specific rendering logic
  switch (type) {
    case 'hero':
      return (
        <section 
          className={`relative py-20 lg:py-32 ${className}`}
          style={{
            background: `linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-secondary-rgb), 0.1))`
          }}
        >
          <div className="brand-container">
            <div className="max-w-4xl mx-auto text-center">
              {/* Main headline - use from data.headline or title */}
              {(data.headline || title) && (
                <InlineTextEditor
                  content={data.headline || title || ''}
                  onUpdate={(content) => {
                    if (onContentUpdate) {
                      onContentUpdate(sectionKey, 'data.headline', content)
                    }
                  }}
                  isEnabled={Boolean(onContentUpdate)}
                  fieldPath="data.headline"
                  format="plain"
                  singleLine={true}
                  className="text-4xl md:text-6xl font-bold mb-6 block"
                  style={{ 
                    color: 'var(--theme-text)',
                    fontFamily: 'var(--theme-font-heading)'
                  }}
                  placeholder="Enter your headline..."
                  showToolbar={false}
                  debounceDelay={0}
                />
              )}

              {/* Subheadline */}
              {(data.subheadline || onContentUpdate) && (
                <InlineTextEditor
                  content={textToHtml(data.subheadline || '')}
                  onUpdate={(htmlContent) => {
                    if (onContentUpdate) {
                      const textContent = htmlToText(htmlContent)
                      onContentUpdate(sectionKey, 'data.subheadline', textContent)
                    }
                  }}
                  isEnabled={Boolean(onContentUpdate)}
                  fieldPath="data.subheadline"
                  format="rich"
                  className="text-xl md:text-2xl mb-8 leading-relaxed block [&_.ProseMirror_p:not(:first-child)]:mt-2"
                  style={{ 
                    color: 'var(--theme-text)',
                    opacity: 0.8,
                    fontFamily: 'var(--theme-font-body)'
                  }}
                  placeholder="Click to add subtitle..."
                  showToolbar={false}
                  debounceDelay={0}
                />
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                {(data.ctaText || onContentUpdate) && (
                  <a 
                    href={data.ctaLink || '#'}
                    className="px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 inline-flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--theme-primary)',
                      color: 'rgb(255, 255, 255)',
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
                        // Let the editor handle the click
                      }
                    }}
                  >
                    <InlineTextEditor
                      content={data.ctaText || ''}
                      onUpdate={(content) => {
                        if (onContentUpdate) {
                          onContentUpdate(sectionKey, 'data.ctaText', content)
                        }
                      }}
                      isEnabled={Boolean(onContentUpdate)}
                      fieldPath="data.ctaText"
                      format="plain"
                      singleLine={true}
                      className="font-semibold leading-none [&_.ProseMirror]:text-center [&_.ProseMirror]:!min-h-0 [&_.ProseMirror]:leading-none [&_.inline-editor-wrapper]:min-h-0 [&_.inline-editor-wrapper]:leading-none"
                      style={{
                        color: 'inherit',
                        fontFamily: 'inherit'
                      }}
                      placeholder="Add button text..."
                      showToolbar={false}
                      debounceDelay={0}
                    />
                  </a>
                )}
                {(data.secondaryCtaText || onContentUpdate) && (
                  <a 
                    href={data.secondaryCtaLink || '#'}
                    className="border px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:opacity-80 inline-flex items-center justify-center"
                    style={{
                      borderColor: 'var(--theme-secondary)',
                      color: 'var(--theme-secondary)',
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
                        // Let the editor handle the click
                      }
                    }}
                  >
                    <InlineTextEditor
                      content={data.secondaryCtaText || ''}
                      onUpdate={(content) => {
                        if (onContentUpdate) {
                          onContentUpdate(sectionKey, 'data.secondaryCtaText', content)
                        }
                      }}
                      isEnabled={Boolean(onContentUpdate)}
                      fieldPath="data.secondaryCtaText"
                      format="plain"
                      singleLine={true}
                      className="font-semibold leading-none [&_.ProseMirror]:text-center [&_.ProseMirror]:!min-h-0 [&_.ProseMirror]:leading-none [&_.inline-editor-wrapper]:min-h-0 [&_.inline-editor-wrapper]:leading-none"
                      style={{
                        color: 'inherit',
                        fontFamily: 'inherit'
                      }}
                      placeholder="Add secondary button text..."
                      showToolbar={false}
                      debounceDelay={0}
                    />
                  </a>
                )}
              </div>

              {/* Features Grid */}
              {data.features && Array.isArray(data.features) && data.features.length > 0 && (
                <div 
                  className={`grid gap-6 text-center ${getFeatureGridClasses(data.features.length)}`}
                >
                  {data.features.slice(0, 4).map((feature: string, index: number) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                        style={{ backgroundColor: 'var(--theme-primary)' }}
                      >
                        <svg 
                          className="w-6 h-6 text-white" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <InlineTextEditor
                        content={feature}
                        onUpdate={(content) => {
                          if (onFeatureUpdate) {
                            onFeatureUpdate(sectionKey, index, content)
                          }
                        }}
                        isEnabled={Boolean(onFeatureUpdate)}
                        fieldPath={`data.features.${index}`}
                        format="plain"
                        singleLine={true}
                        className="text-sm font-medium [&_.ProseMirror]:text-center [&_.ProseMirror]:!min-h-0 [&_.ProseMirror]:leading-none [&_.inline-editor-wrapper]:min-h-0"
                        style={{
                          color: 'var(--theme-text)',
                          fontFamily: 'var(--theme-font-body)'
                        }}
                        placeholder="Add feature text..."
                        showToolbar={false}
                        debounceDelay={0}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )

    case 'features':
      return (
        <div className={`space-y-6 ${className}`}>
          {data.content && (
            <div className="text-center">
              <ContentRenderer content={data.content} className="text-2xl font-bold text-gray-900" />
            </div>
          )}
          {renderItems(data.items, data.columns || 3)}
        </div>
      )

    case 'featured':
      const featuredPlants = getFeaturedPlants()
      const displayedPlants = featuredPlants.slice(0, 4)
      
      return (
        <section className={`py-16 ${className}`} style={{backgroundColor: 'var(--theme-background)'}}>
          <div className="brand-container">
            <div className="text-center mb-12">
              <div className="mb-4">
                <InlineTextEditor
                  content={String(data.headline || 'Featured Plants This Season')}
                  onUpdate={(content) => {
                    if (onContentUpdate) {
                      onContentUpdate(sectionKey, 'data.headline', content)
                    }
                  }}
                  isEnabled={Boolean(onContentUpdate)}
                  fieldPath="data.headline"
                  format="plain"
                  singleLine={true}
                  className="text-3xl md:text-4xl font-bold [&_.ProseMirror]:text-center [&_.ProseMirror]:!min-h-0"
                  style={{
                    color: 'var(--theme-text)', 
                    fontFamily: 'var(--theme-font-heading)'
                  }}
                  placeholder="Enter headline..."
                  showToolbar={false}
                />
              </div>
              <InlineTextEditor
                content={String(data.subheadline || 'Handpicked selections from our master horticulturists, perfect for current growing conditions')}
                onUpdate={(content) => {
                  if (onContentUpdate) {
                    onContentUpdate(sectionKey, 'data.subheadline', content)
                  }
                }}
                isEnabled={Boolean(onContentUpdate)}
                fieldPath="data.subheadline"
                format="rich"
                singleLine={false}
                className="text-lg max-w-2xl mx-auto [&_.ProseMirror]:text-center [&_p:not(:first-child)]:mt-2"
                style={{
                  color: 'var(--theme-text)', 
                  opacity: '0.7',
                  fontFamily: 'var(--theme-font-body)'
                }}
                placeholder="Enter subheadline..."
                showToolbar={false}
              />
            </div>
            <div className={`grid ${getProductGridClasses(displayedPlants.length)} gap-6 mb-12`}>
              {displayedPlants.map((plant) => (
                <div key={plant.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="relative">
                    <img 
                      src={plant.image} 
                      alt={plant.name}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {plant.category || 'Houseplants'}
                      </span>
                    </div>
                    {plant.originalPrice && plant.price < plant.originalPrice && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          SALE
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                      {plant.name}
                    </h3>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-right">
                        <span className="text-lg font-bold" style={{color: 'var(--theme-primary)'}}>${plant.price}</span>
                        {plant.originalPrice && plant.price < plant.originalPrice && (
                          <span className="text-sm text-gray-500 line-through ml-2">${plant.originalPrice}</span>
                        )}
                      </div>
                    </div>
                    <div className="mb-3">
                      <span className={`text-sm font-medium ${
                        plant.inStock ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {plant.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                      </span>
                    </div>
                    <button 
                      className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                        plant.inStock 
                          ? 'text-white hover:opacity-90 cursor-not-allowed' 
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                      style={plant.inStock ? {backgroundColor: 'var(--theme-primary)'} : {}}
                      disabled={true}
                    >
                      {plant.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <a 
                href={data.viewAllLink || '/plants'}
                className="inline-block border px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:opacity-80"
                style={{
                  borderColor: 'var(--theme-primary)',
                  color: 'var(--theme-primary)',
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
                    // Let the editor handle the click
                  }
                }}
              >
                <InlineTextEditor
                  content={String(data.viewAllText || 'View All Plants')}
                  onUpdate={(content) => {
                    if (onContentUpdate) {
                      onContentUpdate(sectionKey, 'data.viewAllText', content)
                    }
                  }}
                  isEnabled={Boolean(onContentUpdate)}
                  fieldPath="data.viewAllText"
                  format="plain"
                  singleLine={true}
                  className="[&_.ProseMirror]:text-center [&_.ProseMirror]:!min-h-0 [&_.ProseMirror]:leading-none"
                  style={{
                    color: 'inherit',
                    fontFamily: 'inherit'
                  }}
                  placeholder="View All Text..."
                  showToolbar={false}
                  debounceDelay={0}
                />
              </a>
            </div>
          </div>
        </section>
      )

    case 'cta':
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

    case 'testimonials':
      return (
        <div className={`space-y-6 ${className}`}>
          {data.content && (
            <div className="text-center">
              <ContentRenderer content={data.content} className="text-2xl font-bold text-gray-900" />
            </div>
          )}
          {data.items && Array.isArray(data.items) && (
            <div className={`grid gap-4 grid-cols-1 ${data.columns && data.columns >= 2 ? 'md:grid-cols-2' : ''}`}>
              {data.items.map(item => item as unknown as ContentItem).filter(item => 
                item && typeof item === 'object' && item.id
              ).map((item: ContentItem, index: number) => (
                <Card key={item.id || index} className="p-6 bg-white border-gray-200">
                  {item.content && (
                    <ContentRenderer content={item.content} className="text-gray-600 mb-4" />
                  )}
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {item.title ? item.title.charAt(0).toUpperCase() : 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {item.title && <p className="font-semibold text-gray-900">{item.title}</p>}
                      {item.subtitle && <p className="text-sm text-gray-600">{item.subtitle}</p>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )

    case 'gallery':
      return (
        <div className={`space-y-6 ${className}`}>
          {data.content && (
            <div className="text-center">
              <ContentRenderer content={data.content} className="text-2xl font-bold text-gray-900" />
            </div>
          )}
          {renderItems(data.items, data.columns || 3)}
        </div>
      )

    case 'team':
      return (
        <div className={`space-y-6 ${className}`}>
          {data.content && (
            <div className="text-center">
              <ContentRenderer content={data.content} className="text-2xl font-bold text-gray-900" />
            </div>
          )}
          {data.items && Array.isArray(data.items) && (
            <div className={`grid gap-6 grid-cols-1 ${data.columns && data.columns >= 2 ? 'sm:grid-cols-2' : ''} ${data.columns && data.columns >= 3 ? 'lg:grid-cols-3' : ''}`}>
              {data.items.map(item => item as unknown as ContentItem).filter(item => 
                item && typeof item === 'object' && item.id
              ).map((item: ContentItem, index: number) => (
                <Card key={item.id || index} className="p-6 text-center bg-white border-gray-200">
                  {item.image && (
                    <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.title || ''} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full bg-gray-200 rounded-full flex items-center justify-center"><span class="text-gray-400 text-xs">Photo</span></div>'
                          }
                        }}
                      />
                    </div>
                  )}
                  {item.title && <h3 className="font-semibold text-gray-900">{item.title}</h3>}
                  {item.subtitle && <p className="text-sm text-blue-600 mb-2">{item.subtitle}</p>}
                  {item.content && (
                    <ContentRenderer content={item.content} className="text-sm text-gray-600" />
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )

    case 'pricing':
      return (
        <div className={`space-y-6 ${className}`}>
          {data.content && (
            <div className="text-center">
              <ContentRenderer content={data.content} className="text-2xl font-bold text-gray-900" />
            </div>
          )}
          {data.items && Array.isArray(data.items) && (
            <div className={`grid gap-6 grid-cols-1 ${data.columns && data.columns >= 2 ? 'md:grid-cols-2' : ''} ${data.columns && data.columns >= 3 ? 'lg:grid-cols-3' : ''}`}>
              {data.items.map(item => item as unknown as ContentItem).filter(item => 
                item && typeof item === 'object' && item.id
              ).map((item: ContentItem, index: number) => (
                <Card key={item.id || index} className={`p-6 text-center bg-white border-gray-200 ${index === 1 ? 'border-blue-500 shadow-lg scale-105' : ''}`}>
                  {index === 1 && (
                    <Badge className="mb-4">Most Popular</Badge>
                  )}
                  {item.title && <h3 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h3>}
                  {item.subtitle && <p className="text-3xl font-bold text-blue-600 mb-4">{item.subtitle}</p>}
                  {item.content && (
                    <ContentRenderer content={item.content} className="text-sm text-gray-600 mb-6" />
                  )}
                  <Button className="w-full" variant={index === 1 ? 'default' : 'outline'}>
                    Get Started
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )

    case 'richText':
    case 'text':
      return (
        <div className={`prose prose-gray max-w-none ${className}`}>
          {data.content && <ContentRenderer content={data.content} />}
        </div>
      )

    case 'image':
      return (
        <div className={`${className}`}>
          {data.url && (
            <div className="space-y-2">
              <img 
                src={data.url} 
                alt={data.alt || ''} 
                className="w-full rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = '<div class="aspect-video bg-gray-100 rounded-lg flex items-center justify-center"><span class="text-gray-400">Image</span></div>'
                  }
                }}
              />
              {data.caption && (
                <p className="text-sm text-gray-600 text-center">{data.caption}</p>
              )}
            </div>
          )}
        </div>
      )

    case 'form':
      return (
        <div className={`space-y-6 ${className}`}>
          {data.content && (
            <div className="text-center">
              <ContentRenderer content={data.content} className="text-2xl font-bold text-gray-900" />
            </div>
          )}
          <Card className="p-6 bg-white border-gray-200 max-w-lg mx-auto">
            <div className="space-y-4">
              {data.fields && Array.isArray(data.fields) && data.fields.map(field => field as any).filter((field: any) => 
                field && typeof field === 'object' && field.id
              ).map((field: any, index: number) => (
                <div key={field.id || index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-500">
                      {field.placeholder || 'Enter your message...'}
                    </div>
                  ) : (
                    <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-500">
                      {field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                    </div>
                  )}
                </div>
              ))}
              <Button className="w-full">Send Message</Button>
            </div>
          </Card>
        </div>
      )

    case 'mission':
    case 'values':
    case 'specifications':
      return (
        <div className={`space-y-6 ${className}`}>
          {data.content && (
            <div className="text-center">
              <ContentRenderer content={data.content} className="text-2xl font-bold text-gray-900" />
            </div>
          )}
          {data.items && Array.isArray(data.items) ? (
            renderItems(data.items, data.columns || 2)
          ) : (
            data.content && (
              <div className="prose prose-gray max-w-none">
                <ContentRenderer content={data.content} />
              </div>
            )
          )}
        </div>
      )

    default:
      // Fallback for unknown section types
      return (
        <div className={`space-y-4 ${className}`}>
          {data.content && <ContentRenderer content={data.content} />}
          {data.items && renderItems(data.items, data.columns || 3)}
        </div>
      )
  }
}

// Memoize DynamicSection to prevent unnecessary re-renders of complex preview components
export const DynamicSection = React.memo(DynamicSectionComponent, (prevProps, nextProps) => {
  // Deep comparison of section content to avoid unnecessary re-renders
  return (
    prevProps.sectionKey === nextProps.sectionKey &&
    prevProps.className === nextProps.className &&
    prevProps.title === nextProps.title &&
    prevProps.section.visible === nextProps.section.visible &&
    prevProps.section.type === nextProps.section.type &&
    JSON.stringify(prevProps.section.data) === JSON.stringify(nextProps.section.data) &&
    JSON.stringify(prevProps.section.settings) === JSON.stringify(nextProps.section.settings)
  )
})

DynamicSection.displayName = 'DynamicSection'