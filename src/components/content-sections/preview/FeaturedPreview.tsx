/**
 * Featured section preview component
 * Features editable cards with images, tags, and titles
 * Supports both manual featured items and dynamic products from database
 */

import React, { useState } from 'react'
import { ContentSection, DEFAULT_FEATURED_ITEMS } from '@/src/lib/content/schema'
import { InlineTextEditor } from '@/src/components/content-editor/InlineTextEditor'
import { htmlToText, textToHtml } from '@/src/lib/utils/html-text'
import { getSectionBackgroundStyle } from '@/src/components/content-sections/shared'
import { createResponsiveClassHelper, isPreviewMode } from '@/src/lib/utils/responsive-classes'
import { ImageIcon, ExternalLink } from 'lucide-react'
import { SmartLink } from '@/src/components/ui/smart-link'
import { FeaturedEditModal } from '@/src/components/site-editor/modals/FeaturedEditModal'
import { useFullSiteEditorOptional } from '@/src/contexts/FullSiteEditorContext'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { useCartContext } from '@/src/contexts/CartContext'
import { useFeaturedProducts } from '@/src/hooks/useProducts'
import { ProductCard } from '@/src/components/ProductCard'
import Link from 'next/link'
import { Product } from '@/lib/database/aliases'
import { transformProductForDisplay } from '@/src/lib/utils/product-transformer'
import { toast } from 'sonner'

interface FeaturedPreviewProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
  onFeaturedUpdate?: (sectionKey: string, itemIndex: number, updatedItem: Record<string, unknown>) => void
  onFeaturedDelete?: (sectionKey: string, itemIndex: number) => void
}

export function FeaturedPreview({
  section,
  sectionKey,
  className = '',
  title,
  onContentUpdate,
  onFeatureUpdate,
  onFeaturedUpdate,
  onFeaturedDelete
}: FeaturedPreviewProps) {
  const { data, settings } = section
  const isPreview = isPreviewMode(onContentUpdate, onFeatureUpdate)
  const responsive = createResponsiveClassHelper(isPreview)
  const editorContext = useFullSiteEditorOptional()
  const { addItem } = useCartContext()

  // Track which product is being added to cart
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null)

  // Check if we should use database products
  const useProductDatabase = data.useProductDatabase ?? false
  const productLimit = data.productLimit ?? 4

  // Fetch featured products from database if enabled
  const { data: productsResponse, isLoading: isLoadingProducts } = useFeaturedProducts(
    useProductDatabase ? productLimit : 0
  )

  // Determine which items to display
  let displayedItems: any[] = []
  let displayMode: 'manual' | 'database' = 'manual'

  if (useProductDatabase) {
    displayMode = 'database'
    if (productsResponse?.data) {
      displayedItems = productsResponse.data.slice(0, productLimit)
    }
  } else {
    // Manual featured items mode
    let featuredItems = data.featuredItems

    // Migration: Check for old schema (featuredPlants) or missing/invalid data
    if (!Array.isArray(featuredItems) || featuredItems.length === 0) {
      // If old schema exists (featuredPlants from previous implementation), use defaults
      if (data.featuredPlants) {
        console.info(`[FeaturedPreview] Old schema detected (featuredPlants) in section "${sectionKey}", using default featured items`)
      } else {
        console.info(`[FeaturedPreview] No featuredItems found in section "${sectionKey}", using default featured items`)
      }
      featuredItems = DEFAULT_FEATURED_ITEMS
    }

    displayedItems = featuredItems.slice(0, 4) // Maximum 4 items
  }

  // Determine if we're in Edit mode
  const isEditMode = isPreview || (editorContext?.editorMode === 'edit')

  // Handle add to cart for database products
  const handleAddToCart = async (productId: string) => {
    // Find the original product from the database
    const product = productsResponse?.data?.find((p) => p.id === productId)
    if (!product) return

    setAddingToCartId(productId)
    try {
      await addItem(product, 1)
      toast.success(`${product.name} added to cart`)
    } catch (error) {
      toast.error('Failed to add to cart')
      console.error('Error adding to cart:', error)
    } finally {
      setAddingToCartId(null)
    }
  }

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
            content={textToHtml(String(data.subheadline || 'Handpicked selections from our master horticulturists'))}
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
            className={`${responsive.typography.bodyText} max-w-2xl mx-auto [&_.ProseMirror]:text-center [&_p:not(:first-child)]:mt-2`}
            style={{
              color: 'var(--theme-text)',
              opacity: '0.7',
              fontFamily: 'var(--theme-font-body)'
            }}
            placeholder="Enter description..."
          />
        </div>

        {/* Featured Items Grid */}
        <div className={`grid ${getFeaturedGridClasses(displayedItems.length, isPreview)} gap-6 mb-12`}>
          {displayMode === 'database' ? (
            // Database Products Mode
            <>
              {isLoadingProducts ? (
                // Loading skeleton
                Array.from({ length: productLimit }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-64"></div>
                  </div>
                ))
              ) : displayedItems.length === 0 ? (
                // Empty state
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground mb-2">No featured products found</p>
                  {isEditMode && (
                    <Link
                      href="/dashboard/products"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      Go to Products <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              ) : (
                // Product cards
                displayedItems.map((product: Product) => {
                  // Transform database Product to ProductDisplay format
                  const displayProduct = transformProductForDisplay(product)

                  const productCard = (
                    <ProductCard
                      key={displayProduct.id}
                      product={displayProduct}
                      onEdit={undefined}
                      isLoading={false}
                      showAddToCart={!isEditMode}
                      onAddToCart={handleAddToCart}
                      isAddingToCart={addingToCartId === displayProduct.id}
                    />
                  )

                  // In Edit Mode: No link wrapper (not clickable)
                  if (isEditMode) {
                    return (
                      <div key={displayProduct.id} className="block">
                        {productCard}
                      </div>
                    )
                  }

                  // Customer View: Link wrapper (clickable, navigates to product page)
                  return (
                    <Link
                      key={displayProduct.id}
                      href={`/products/${product.slug || product.id}`}
                      className="block"
                    >
                      {productCard}
                    </Link>
                  )
                })
              )}
              {/* Info message in edit mode */}
              {isEditMode && displayedItems.length > 0 && (
                <div className="col-span-full mt-4 p-3 bg-muted rounded-md text-sm text-muted-foreground text-center">
                  Products are managed via the{' '}
                  <Link href="/dashboard/products" className="text-primary hover:underline">
                    Products dashboard
                  </Link>
                  . Mark products as "Featured" to display them here.
                </div>
              )}
            </>
          ) : (
            // Manual Featured Items Mode
            displayedItems.map((item: any, index: number) => (
              <FeaturedCard
                key={item.id}
                item={item}
                itemIndex={index}
                sectionKey={sectionKey}
                isPreview={isPreview}
                onContentUpdate={onContentUpdate}
                onFeaturedUpdate={onFeaturedUpdate}
                onFeaturedDelete={onFeaturedDelete}
              />
            ))
          )}
        </div>

        {/* View All Link */}
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

/**
 * Individual Featured Card Component
 */
interface FeaturedCardProps {
  item: any
  itemIndex: number
  sectionKey: string
  isPreview: boolean
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeaturedUpdate?: (sectionKey: string, itemIndex: number, updatedItem: Record<string, unknown>) => void
  onFeaturedDelete?: (sectionKey: string, itemIndex: number) => void
}

function FeaturedCard({ item, itemIndex, sectionKey, isPreview, onContentUpdate, onFeaturedUpdate, onFeaturedDelete }: FeaturedCardProps) {
  const hasImage = item.image && item.image.trim() !== ''
  const [editModalOpen, setEditModalOpen] = useState(false)
  // Use optional hook - may be undefined in Content Editor context
  const editorContext = useFullSiteEditorOptional()
  const { currentSite } = useSiteContext()

  // Determine if we're in Edit mode (checking editorMode directly for Full Site Editor)
  const isEditMode = isPreview || (editorContext?.editorMode === 'edit')

  const handleItemSave = (updatedItem: Record<string, unknown>) => {
    // Try Content Editor handler first (from VisualEditor)
    if (onFeaturedUpdate) {
      onFeaturedUpdate(sectionKey, itemIndex, updatedItem)
    }
    // Fallback to Full Site Editor context method
    else if (editorContext) {
      editorContext.updateFeaturedContent(sectionKey, itemIndex, updatedItem)
    }
  }

  const handleItemDelete = () => {
    // Try Content Editor handler first (from VisualEditor)
    if (onFeaturedDelete) {
      onFeaturedDelete(sectionKey, itemIndex)
    }
    // Fallback to Full Site Editor context method
    else if (editorContext) {
      editorContext.deleteFeaturedContent(sectionKey, itemIndex)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Only prevent navigation and open modal in Edit mode
    if (isEditMode) {
      e.preventDefault()
      e.stopPropagation()
      setEditModalOpen(true)
    }
    // In Navigate mode, let the SmartLink handle the click
  }

  const CardContent = (
    <div className="group cursor-pointer h-full" onClick={handleCardClick}>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {/* Image */}
        <div className="relative">
          {hasImage ? (
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-48 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-48 bg-muted flex flex-col items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to Add Image</p>
            </div>
          )}

          {/* Tag badge in top-right corner */}
          {item.tag && (
            <div className="absolute top-3 right-3">
              <span
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'var(--theme-accent)', color: 'rgb(255, 255, 255)' }}
              >
                {item.tag}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="p-4">
          {isEditMode ? (
            <div
              onClick={(e) => {
                // Stop propagation so title click doesn't trigger card modal
                e.stopPropagation()
              }}
            >
              <InlineTextEditor
                content={item.title}
                onUpdate={(content) => {
                  // Try Content Editor handler first
                  if (onFeaturedUpdate) {
                    onFeaturedUpdate(sectionKey, itemIndex, { title: content })
                  }
                  // Fallback to Full Site Editor context method
                  else if (editorContext) {
                    editorContext.updateFeaturedContent(sectionKey, itemIndex, { title: content })
                  }
                }}
                isEnabled={true}
                fieldPath={`data.featuredItems.${itemIndex}.title`}
                format="plain"
                singleLine={true}
                className="text-lg font-semibold [&_.ProseMirror]:!min-h-0"
                style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}
                placeholder="Item title..."
                showToolbar={false}
                debounceDelay={0}
              />
            </div>
          ) : (
            <p className="text-lg font-semibold" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
              {item.title}
            </p>
          )}
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
        <FeaturedEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          item={item}
          onSave={handleItemSave}
          onDelete={handleItemDelete}
          siteId={currentSite?.id || ''}
        />
      </>
    )
  }

  // Navigate mode or customer site - clickable link
  if (item.link) {
    return (
      <SmartLink href={item.link} className="block h-full">
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

/**
 * Get responsive grid classes for featured items
 * Adapts to container width using container queries in preview mode
 *
 * Container query breakpoints differ from media queries:
 * - @md (448px) vs md: (768px)
 * - @lg (512px) vs lg: (1024px)
 * - @5xl (1024px) matches lg: (1024px) for desktop layouts
 */
function getFeaturedGridClasses(itemCount: number, isPreviewMode: boolean = false): string {
  // Container queries use @5xl (1024px) to match lg: media query (1024px)
  // See responsive-classes.ts line 120-121 for container query breakpoint mapping
  const desktopBreakpoint = isPreviewMode ? '@5xl' : 'lg'
  const tabletBreakpoint = isPreviewMode ? '@md' : 'md'

  if (itemCount === 1) return 'grid-cols-1'
  if (itemCount === 2) return `grid-cols-1 ${tabletBreakpoint}:grid-cols-2`
  if (itemCount === 3) return `grid-cols-1 ${tabletBreakpoint}:grid-cols-2 ${desktopBreakpoint}:grid-cols-3`
  // 4 items: 1 column mobile, 2 columns tablet, 4 columns desktop
  return `grid-cols-1 ${tabletBreakpoint}:grid-cols-2 ${desktopBreakpoint}:grid-cols-4`
}
