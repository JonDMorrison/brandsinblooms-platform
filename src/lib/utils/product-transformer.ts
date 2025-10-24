/**
 * Product transformation utilities
 * Transforms database Product types to ProductDisplay format for UI components
 */

import type { Product } from '@/src/lib/database/aliases'

/**
 * Product image from product_images table relation
 */
interface ProductImageRelation {
  id: string
  url: string
  position: number
  is_primary: boolean
  alt_text?: string | null
  caption?: string | null
  storage_type?: string | null
  cdn_url?: string | null
}

/**
 * Extended Product type with relations
 */
type ProductWithRelations = Product & {
  product_images?: ProductImageRelation[]
}

/**
 * ProductDisplay interface matching ProductCard component expectations
 */
export interface ProductDisplay {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  category: string
  stock: 'in-stock' | 'low-stock' | 'out-of-stock'
  image: string
  featured: boolean
  addedToSite: boolean
}

/**
 * Transforms a database Product to ProductDisplay format
 * Handles field mapping, data extraction, and type conversions
 */
export function transformProductForDisplay(product: Product | ProductWithRelations): ProductDisplay {
  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    price: product.price ?? 0,
    originalPrice: product.compare_at_price ?? undefined,
    category: getCategoryName(product),
    stock: getStockStatus(product.inventory_count ?? 0),
    image: getProductImage(product as ProductWithRelations),
    featured: !!product.is_featured,
    addedToSite: !!product.is_active,
  }
}

/**
 * Extracts category name from product
 * Prioritizes category field, falls back to 'Uncategorized'
 */
function getCategoryName(product: Product): string {
  return product.category || 'Uncategorized'
}

/**
 * Determines stock status from inventory count
 * - 0: out-of-stock
 * - < 10: low-stock
 * - >= 10: in-stock
 */
function getStockStatus(count: number): 'in-stock' | 'low-stock' | 'out-of-stock' {
  if (count === 0) return 'out-of-stock'
  if (count < 10) return 'low-stock'
  return 'in-stock'
}

/**
 * Extracts first product image URL from product_images relation or legacy images array
 * Priority: 1) Modern product_images relation, 2) Legacy JSONB images field
 * Returns empty string if no images available
 *
 * @param product - Product object that may contain product_images relation or legacy images JSONB
 * @returns Primary image URL or empty string if no images found
 */
export function getProductImageUrl(product: unknown): string {
  // Type guard: check if product is an object
  if (!product || typeof product !== 'object') {
    return ''
  }

  const productObj = product as ProductWithRelations

  // FIRST: Try modern product_images relation (current system)
  if (productObj.product_images && Array.isArray(productObj.product_images) && productObj.product_images.length > 0) {
    // Find primary image first
    const primaryImage = productObj.product_images.find(img => img.is_primary)
    if (primaryImage?.url) {
      return primaryImage.url
    }

    // Fall back to first image sorted by position
    const firstImage = productObj.product_images
      .sort((a, b) => a.position - b.position)[0]
    if (firstImage?.url) {
      return firstImage.url
    }
  }

  // SECOND: Try legacy images JSONB array (backward compatibility)
  if (productObj.images) {
    try {
      const images = Array.isArray(productObj.images)
        ? productObj.images
        : JSON.parse(productObj.images as unknown as string)

      if (Array.isArray(images) && images.length > 0) {
        return images[0]
      }
    } catch {
      // If parsing fails, continue to return empty string
    }
  }

  // No images found in either location
  return ''
}

/**
 * Internal helper for transformProductForDisplay
 * @deprecated Use getProductImageUrl instead for new code
 */
function getProductImage(product: ProductWithRelations): string {
  return getProductImageUrl(product)
}
