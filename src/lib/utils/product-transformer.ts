/**
 * Product transformation utilities
 * Transforms database Product types to ProductDisplay format for UI components
 */

import type { Product } from '@/lib/database/aliases'

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
export function transformProductForDisplay(product: Product): ProductDisplay {
  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    price: product.price ?? 0,
    originalPrice: product.compare_at_price ?? undefined,
    category: getCategoryName(product),
    stock: getStockStatus(product.inventory_count ?? 0),
    image: getProductImage(product),
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
 * Extracts first product image URL from images array
 * Returns empty string if no images available
 */
function getProductImage(product: Product): string {
  // Try to get from images JSONB array
  if (product.images) {
    try {
      const images = Array.isArray(product.images)
        ? product.images
        : JSON.parse(product.images as unknown as string)

      if (Array.isArray(images) && images.length > 0) {
        return images[0]
      }
    } catch {
      // If parsing fails, return empty string
    }
  }

  return ''
}
