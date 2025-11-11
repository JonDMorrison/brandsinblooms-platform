/**
 * Categories section preview component
 * Features container query responsive design for accurate mobile/tablet preview behavior
 */

import React, { useState } from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { getSectionBackgroundStyle } from '@/src/components/content-sections/shared'
import { getCategoriesGridClasses } from '@/src/components/content-sections/shared/grid-utils'
import { createResponsiveClassHelper, isPreviewMode } from '@/src/lib/utils/responsive-classes'
import { ImageIcon } from 'lucide-react'
import { SmartLink } from '@/src/components/ui/smart-link'
import { CategoryEditModal } from '@/src/components/site-editor/modals/CategoryEditModal'
import { useFullSiteEditorOptional } from '@/src/contexts/FullSiteEditorContext'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { DEFAULT_CATEGORIES } from '@/src/lib/content/default-categories'

interface CategoriesPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
  onCategoryUpdate?: (sectionKey: string, categoryIndex: number, updatedCategory: Record<string, unknown>) => void
  onCategoryDelete?: (sectionKey: string, categoryIndex: number) => void
}

export function CategoriesPreview({
  section,
  sectionKey,
  className = '',
  title,
  onContentUpdate,
  onFeatureUpdate,
  onCategoryUpdate,
  onCategoryDelete
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
              showToolbar={true}
              debounceDelay={0}
            />
          </div>
          <InlineTextEditor
            content={data.description || 'Find Your Perfect Plant Match'}
            onUpdate={(htmlContent) => {
              if (onContentUpdate) {
                onContentUpdate(sectionKey, 'data.description', htmlContent)
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
            showToolbar={true}
            debounceDelay={0}
          />
        </div>
        
        {/* Categories Grid */}
        <div className={`grid ${getCategoriesGridClasses(displayedCategories.length, isPreview)} gap-8`}>
          {displayedCategories.map((category: any, index: number) => (
            <CategoryCard
              key={category.id}
              category={category}
              categoryIndex={index}
              sectionKey={sectionKey}
              isPreview={isPreview}
              onContentUpdate={onContentUpdate}
              onCategoryUpdate={onCategoryUpdate}
              onCategoryDelete={onCategoryDelete}
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
  categoryIndex: number
  sectionKey: string
  isPreview: boolean
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onCategoryUpdate?: (sectionKey: string, categoryIndex: number, updatedCategory: Record<string, unknown>) => void
  onCategoryDelete?: (sectionKey: string, categoryIndex: number) => void
}

function CategoryCard({ category, categoryIndex, sectionKey, isPreview, onContentUpdate, onCategoryUpdate, onCategoryDelete }: CategoryCardProps) {
  const hasImage = category.image && category.image.trim() !== ''
  const [editModalOpen, setEditModalOpen] = useState(false)
  // Use optional hook - may be undefined in Content Editor context
  const editorContext = useFullSiteEditorOptional()
  const { currentSite } = useSiteContext()

  // Determine if we're in Edit mode (checking editorMode directly for Full Site Editor)
  const isEditMode = isPreview || (editorContext?.editorMode === 'edit')

  const handleCategorySave = (updatedCategory: Record<string, unknown>) => {
    // Try Content Editor handler first (from VisualEditor)
    if (onCategoryUpdate) {
      onCategoryUpdate(sectionKey, categoryIndex, updatedCategory)
    }
    // Fallback to Full Site Editor context method
    else if (editorContext) {
      editorContext.updateCategoryContent(sectionKey, categoryIndex, updatedCategory)
    }
  }

  const handleCategoryDelete = () => {
    // Try Content Editor handler first (from VisualEditor)
    if (onCategoryDelete) {
      onCategoryDelete(sectionKey, categoryIndex)
    }
    // Fallback to Full Site Editor context method
    else if (editorContext) {
      editorContext.deleteCategoryContent(sectionKey, categoryIndex)
    }
  }

  const handleImageClick = (e: React.MouseEvent) => {
    // Only prevent navigation and open modal in Edit mode
    if (isEditMode) {
      e.preventDefault()
      e.stopPropagation()
      setEditModalOpen(true)
    }
    // In Navigate mode, let the SmartLink handle the click
  }

  const CardContent = (
    <div className="group cursor-pointer h-full" onClick={handleImageClick}>
      <div className="relative overflow-hidden rounded-lg hover:shadow-xl transition-all duration-300 h-64">
        {hasImage ? (
          <>
            {/* Full image */}
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : (
          <>
            {/* Placeholder when no image */}
            <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to Add Image</p>
            </div>
          </>
        )}

        {/* Badge at bottom center with inline editing */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2"
          onClick={(e) => {
            // Stop propagation so badge click doesn't trigger image modal
            e.stopPropagation()
          }}
        >
          <div className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
            {isEditMode ? (
              <InlineTextEditor
                content={category.name}
                onUpdate={(content) => {
                  // Try Content Editor handler first
                  if (onCategoryUpdate) {
                    onCategoryUpdate(sectionKey, categoryIndex, { name: content })
                  }
                  // Fallback to Full Site Editor context method
                  else if (editorContext) {
                    editorContext.updateCategoryContent(sectionKey, categoryIndex, { name: content })
                  }
                }}
                isEnabled={true}
                fieldPath={`data.categories.${categoryIndex}.name`}
                format="plain"
                singleLine={true}
                className="text-sm font-semibold whitespace-nowrap [&_.ProseMirror]:text-center [&_.ProseMirror]:!min-h-0"
                style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}
                placeholder="Category name..."
                showToolbar={false}
                debounceDelay={0}
              />
            ) : (
              <span
                className="text-sm font-semibold whitespace-nowrap"
                style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}
              >
                {category.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // In Edit mode (Content Editor OR Full Site Editor Edit mode), show editable card with modal
  if (isEditMode) {
    return (
      <>
        <div className="block h-full">
          {CardContent}
        </div>
        <CategoryEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          category={category}
          onSave={handleCategorySave}
          onDelete={handleCategoryDelete}
          siteId={currentSite?.id || ''}
        />
      </>
    )
  }

  // Navigate mode or customer site - clickable link
  if (category.link) {
    return (
      <SmartLink href={category.link} className="block h-full">
        {CardContent}
      </SmartLink>
    )
  }

  // No link, just display
  return (
    <div className="block h-full">
      {CardContent}
    </div>
  )
}

