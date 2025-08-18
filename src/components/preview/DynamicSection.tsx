import React from 'react'
import { ContentSection, ContentItem } from '@/src/lib/content/schema'
import { ContentRenderer } from './ContentRenderer'
import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import * as LucideIcons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface DynamicSectionProps {
  section: ContentSection
  sectionKey: string
  className?: string
}

function DynamicSectionComponent({ section, sectionKey, className = '' }: DynamicSectionProps) {
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
        <div className={`text-center space-y-4 ${className}`}>
          {data.content && (
            <div className="space-y-4">
              <ContentRenderer 
                content={data.content} 
                className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              />
            </div>
          )}
          {data.items && Array.isArray(data.items) && data.items.length > 0 && (
            <div className="flex justify-center gap-4 flex-wrap">
              {data.items.slice(0, 2).map(item => item as unknown as ContentItem).filter(item => 
                item && typeof item === 'object' && item.id && item.title // Only show buttons with text
              ).map((item: ContentItem, index: number) => {
                // Determine variant based on position in filtered array
                const filteredButtons = data.items?.slice(0, 2).filter((i: any) => i?.title)
                const isFirst = filteredButtons?.[0]?.id === item.id
                return (
                  <Button key={item.id || index} variant={isFirst ? 'default' : 'outline'}>
                    {item.title}
                  </Button>
                )
              })}
            </div>
          )}
        </div>
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
    prevProps.section.visible === nextProps.section.visible &&
    prevProps.section.type === nextProps.section.type &&
    JSON.stringify(prevProps.section.data) === JSON.stringify(nextProps.section.data) &&
    JSON.stringify(prevProps.section.settings) === JSON.stringify(nextProps.section.settings)
  )
})

DynamicSection.displayName = 'DynamicSection'