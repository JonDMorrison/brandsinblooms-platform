/**
 * Featured section preview component
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { htmlToText, textToHtml } from '@/src/lib/utils/html-text'
import { getSectionBackgroundStyle, getProductGridClasses } from '@/src/components/content-sections/shared'
import { getFeaturedPlants } from '@/src/data/plant-shop-content'
import { createResponsiveClassHelper, isPreviewMode } from '@/src/lib/utils/responsive-classes'

interface FeaturedPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
}

export function FeaturedPreview({
  section,
  sectionKey,
  className = '',
  title,
  onContentUpdate,
  onFeatureUpdate
}: FeaturedPreviewProps) {
  const { data, settings } = section
  const isPreview = isPreviewMode(onContentUpdate, onFeatureUpdate)
  const responsive = createResponsiveClassHelper(isPreview)

  const featuredPlants = getFeaturedPlants()
  const displayedPlants = featuredPlants.slice(0, 4)

  return (
    <section className={`${responsive.spacing.sectionPadding} ${className}`} style={getSectionBackgroundStyle(settings)}>
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
            content={textToHtml(String(data.subheadline || 'Handpicked selections from our master horticulturists, perfect for current growing conditions'))}
            onUpdate={(htmlContent) => {
              if (onContentUpdate) {
                const textContent = htmlToText(htmlContent)
                onContentUpdate(sectionKey, 'data.subheadline', textContent)
              }
            }}
            isEnabled={Boolean(onContentUpdate)}
            fieldPath="data.subheadline"
            format="simple-toolbar"
            singleLine={false}
            className="text-lg max-w-2xl mx-auto [&_.ProseMirror]:text-center [&_p:not(:first-child)]:mt-2"
            style={{
              color: 'var(--theme-text)', 
              opacity: '0.7',
              fontFamily: 'var(--theme-font-body)'
            }}
            placeholder="Enter subheadline..."
          />
        </div>
        <div className={`${responsive.grid.cardsGrid} gap-6 mb-12`}>
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
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: 'var(--theme-accent)', color: '#fff' }}
                  >
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
}