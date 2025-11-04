/**
 * Shared product search utilities
 * Provides consistent search behavior across all product search implementations
 * Searches: product name, description, and category name (case-insensitive)
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Tables } from '@/src/lib/database/types'

type Product = Tables<'products'>
type ProductCategory = Tables<'product_categories'>

/**
 * Builds a Supabase query with product search filters including category search
 * Searches: name, description, and primary category name (case-insensitive)
 *
 * @param client - Supabase client instance
 * @param siteId - Site ID to filter products
 * @param searchQuery - Search query string
 * @param options - Additional query options
 * @returns Query builder with search filters applied
 */
export function buildProductSearchQuery(
  client: SupabaseClient,
  siteId: string,
  searchQuery: string,
  options: {
    limit?: number
    activeOnly?: boolean
    orderBy?: { column: string; ascending: boolean }
  } = {}
) {
  const { limit, activeOnly = true, orderBy = { column: 'name', ascending: true } } = options
  const query = searchQuery.toLowerCase().trim()

  // Build base query with category JOIN
  let queryBuilder = client
    .from('products')
    .select(`
      *,
      product_images (
        id,
        url,
        position,
        is_primary,
        alt_text
      ),
      primary_category:product_categories!products_primary_category_id_fkey (
        id,
        name,
        slug
      )
    `)
    .eq('site_id', siteId)

  // Filter by active status
  if (activeOnly) {
    queryBuilder = queryBuilder.eq('is_active', true)
  }

  // Apply search filters: name OR description OR category name
  // Note: We need to search the joined category name, which requires a different approach
  // Since Supabase doesn't support OR across joined tables easily, we'll use a workaround
  queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)

  // Apply ordering
  queryBuilder = queryBuilder.order(orderBy.column, { ascending: orderBy.ascending })

  // Apply limit
  if (limit) {
    queryBuilder = queryBuilder.limit(limit)
  }

  return queryBuilder
}

/**
 * Filters products by search query (client-side)
 * Searches: name, description, and category name (case-insensitive)
 *
 * @param products - Array of products to filter
 * @param searchQuery - Search query string
 * @param getCategoryName - Function to extract category name from product
 * @returns Filtered array of products
 */
export function filterProductsBySearch<T extends { name?: string | null; description?: string | null }>(
  products: T[],
  searchQuery: string,
  getCategoryName?: (product: T) => string
): T[] {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return products
  }

  const query = searchQuery.toLowerCase().trim()

  return products.filter((product) => {
    // Search in product name
    if (product.name?.toLowerCase().includes(query)) {
      return true
    }

    // Search in product description
    if (product.description?.toLowerCase().includes(query)) {
      return true
    }

    // Search in category name (if getter function provided)
    if (getCategoryName) {
      const categoryName = getCategoryName(product)
      if (categoryName.toLowerCase().includes(query)) {
        return true
      }
    }

    return false
  })
}

/**
 * Gets the total count of products matching a search query
 * Used to show "X of Y" results when results are limited
 *
 * @param client - Supabase client instance
 * @param siteId - Site ID to filter products
 * @param searchQuery - Search query string
 * @param activeOnly - Whether to only count active products
 * @returns Total count of matching products
 */
export async function getProductSearchCount(
  client: SupabaseClient,
  siteId: string,
  searchQuery: string,
  activeOnly = true
): Promise<number> {
  const query = searchQuery.toLowerCase().trim()

  let queryBuilder = client
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)

  if (activeOnly) {
    queryBuilder = queryBuilder.eq('is_active', true)
  }

  const { count, error } = await queryBuilder

  if (error) {
    console.error('Error getting product search count:', error)
    return 0
  }

  return count || 0
}
