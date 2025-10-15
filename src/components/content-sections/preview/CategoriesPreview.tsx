/**
 * Categories section preview component
 * Features container query responsive design for accurate mobile/tablet preview behavior
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { htmlToText, textToHtml } from '@/src/lib/utils/html-text'
import { getSectionBackgroundStyle } from '@/src/components/content-sections/shared'
import { createResponsiveClassHelper, isPreviewMode } from '@/src/lib/utils/responsive-classes'

interface CategoriesPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
}

// Default categories that match the schema definition
const DEFAULT_CATEGORIES = [
  {
    id: 'beginner-friendly',
    name: 'Beginner-Friendly',
    image: '/images/golden-pothos.jpg',
    link: '/plants?care-level=beginner',
    plantCount: 12,
    description: 'Perfect for new plant parents - low maintenance, forgiving varieties'
  },
  {
    id: 'houseplants',
    name: 'Houseplants',
    image: '/images/snake-plant.jpg',
    link: '/plants?category=houseplants',
    plantCount: 25,
    description: 'Transform indoor spaces with air-purifying and decorative plants'
  },
  {
    id: 'outdoor',
    name: 'Outdoor Specimens',
    image: '/images/japanese-maple.jpg',
    link: '/plants?category=outdoor',
    plantCount: 18,
    description: 'Hardy outdoor plants for landscaping and garden design'
  },
  {
    id: 'succulents',
    name: 'Succulents & Cacti',
    image: '/images/fiddle-leaf-fig.jpg',
    link: '/plants?category=succulents',
    plantCount: 15,
    description: 'Drought-tolerant beauties perfect for sunny spots and xeriscaping'
  }
]

export function CategoriesPreview({ 
  section, 
  sectionKey, 
  className = '', 
  title, 
  onContentUpdate, 
  onFeatureUpdate 
}: CategoriesPreviewProps) {
  const { data, settings } = section
  const isPreview = isPreviewMode(onContentUpdate, onFeatureUpdate)
  const responsive = createResponsiveClassHelper(isPreview)
  
  // Get categories from data, or fall back to all default categories
  const categories = data.categories || DEFAULT_CATEGORIES
  const displayedCategories = categories.slice(0, 4) // Maximum 4 categories

  return (
    <section className={`${responsive.spacing.sectionPadding} ${className}`} style={getSectionBackgroundStyle(settings)}>
      <div className="brand-container">
        <div className="text-center mb-12">
          <div className="mb-4">
            <InlineTextEditor
              content={String(data.headline || 'Shop By Category')}
              onUpdate={(content) => {
                if (onContentUpdate) {
                  onContentUpdate(sectionKey, 'data.headline', content)
                }
              }}
              isEnabled={Boolean(onContentUpdate)}
              fieldPath="data.headline"
              format="plain"
              singleLine={true}
              className={`${responsive.typography.sectionHeading} [&_.ProseMirror]:text-center [&_.ProseMirror]:!min-h-0`}
              style={{
                color: 'var(--theme-text)', 
                fontFamily: 'var(--theme-font-heading)'
              }}
              placeholder="Enter headline..."
              showToolbar={false}
            />
          </div>
          <InlineTextEditor
            content={textToHtml(String(data.description || 'Find Your Perfect Plant Match'))}
            onUpdate={(htmlContent) => {
              if (onContentUpdate) {
                const textContent = htmlToText(htmlContent)
                onContentUpdate(sectionKey, 'data.description', textContent)
              }
            }}
            isEnabled={Boolean(onContentUpdate)}
            fieldPath="data.description"
            format="simple-toolbar"
            singleLine={false}
            className={`${responsive.typography.bodyText} max-w-2xl mx-auto [&_.ProseMirror]:text-center [&_p:not(:first-child)]:mt-2`}
            style={{
              color: 'var(--theme-text)', 
              opacity: '0.7',
              fontFamily: 'var(--theme-font-body)'
            }}
            placeholder="Enter description..."
          />
        </div>
        
        {/* Categories Grid */}
        <div className={`grid ${getCategoriesGridClasses(displayedCategories.length, isPreview)} gap-8`}>
          {displayedCategories.map((category: any) => (
            <CategoryCard 
              key={category.id} 
              category={category} 
              isPreview={isPreview}
              onContentUpdate={onContentUpdate}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Individual Category Card Component
 */
interface CategoryCardProps {
  category: any
  isPreview: boolean
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
}

function CategoryCard({ category, isPreview, onContentUpdate }: CategoryCardProps) {
  const CardContent = (
    <div className="group cursor-pointer h-full">
      <div className="relative overflow-hidden rounded-lg hover:shadow-xl transition-all duration-300 h-64">
        {/* Full image */}
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Badge at bottom center */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
            <span
              className="text-sm font-semibold whitespace-nowrap"
              style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}
            >
              {category.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  if (category.link && !onContentUpdate) {
    // Only make it a link on customer site (not in preview mode)
    return (
      <a href={category.link} className="block h-full">
        {CardContent}
      </a>
    )
  }

  // In preview mode, prevent navigation and handle clicks
  return (
    <div 
      className="block h-full"
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
      {CardContent}
    </div>
  )
}

/**
 * Get responsive grid classes for categories
 * Adapts to container width using container queries in preview mode
 */
function getCategoriesGridClasses(categoryCount: number, isPreviewMode: boolean = false): string {
  const mediaPrefix = isPreviewMode ? '@' : ''

  if (categoryCount === 1) return 'grid-cols-1'
  if (categoryCount === 2) return `grid-cols-1 ${mediaPrefix}md:grid-cols-2`
  if (categoryCount === 3) return `grid-cols-1 ${mediaPrefix}md:grid-cols-2 ${mediaPrefix}5xl:grid-cols-3`
  // 4 categories: 1 column mobile, 2 columns tablet, 4 columns desktop
  // Use @5xl (1024px) to match lg: media query behavior
  return `grid-cols-1 ${mediaPrefix}md:grid-cols-2 ${mediaPrefix}5xl:grid-cols-4`
}