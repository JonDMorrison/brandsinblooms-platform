/**
 * Admin Products Service
 * 
 * Provides comprehensive product management capabilities for platform administrators.
 * All functions require admin privileges and include proper error handling and audit logging.
 */

import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/database/types'

// Type definitions for product management
export type ProductRow = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export interface ProductWithSite extends ProductRow {
  site_name?: string
  site_subdomain?: string
}

export interface ProductSearchFilters {
  search?: string
  category?: string
  subcategory?: string
  status?: 'active' | 'inactive' | 'featured' | 'out_of_stock'
  price_min?: number
  price_max?: number
  in_stock?: boolean
  import_source?: string
  created_after?: string
  created_before?: string
}

export interface ProductListResponse {
  products: ProductWithSite[]
  total_count: number
  page: number
  limit: number
  has_more: boolean
}

export interface ProductBulkUpdate {
  is_active?: boolean
  is_featured?: boolean
  in_stock?: boolean
  stock_status?: string
  category?: string
  subcategory?: string
  price?: number
  sale_price?: number
}

export interface ProductAnalytics {
  total_products: number
  active_products: number
  featured_products: number
  out_of_stock_products: number
  products_by_category: Record<string, number>
  price_distribution: {
    min_price: number
    max_price: number
    avg_price: number
    median_price: number
  }
  recent_product_activity: Array<{
    date: string
    count: number
  }>
}

export interface ProductImportResult {
  successful_rows: number
  failed_rows: number
  total_rows: number
  batch_id: string
  error_log?: any[]
}

/**
 * Error class for admin product operations
 */
export class AdminProductError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AdminProductError'
  }
}

/**
 * Get products for a specific site with search and filtering
 */
export async function getSiteProducts(
  siteId: string,
  page: number = 1,
  limit: number = 50,
  filters: ProductSearchFilters = {}
): Promise<ProductListResponse> {
  try {
    if (!siteId) {
      throw new AdminProductError(
        'Site ID is required',
        'INVALID_SITE_ID'
      )
    }

    const offset = (page - 1) * limit

    // Call the database function with search and filter parameters
    const { data, error } = await supabase.rpc('admin_get_site_products', {
      site_uuid: siteId,
      search_query: filters.search || undefined,
      category_filter: filters.category || undefined,
      status_filter: filters.status || undefined,
      limit_count: limit,
      offset_count: offset
    })

    if (error) {
      console.error('Error fetching site products:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Access denied')) {
        throw new AdminProductError(
          'Access denied: Admin privileges required',
          'ACCESS_DENIED',
          error
        )
      }
      
      if (error.message?.includes('Site not found')) {
        throw new AdminProductError(
          'Site not found',
          'SITE_NOT_FOUND',
          error
        )
      }
      
      throw new AdminProductError(
        'Failed to fetch site products',
        'FETCH_PRODUCTS_ERROR',
        error
      )
    }

    if (!data || typeof data !== 'object' || !('products' in data)) {
      return {
        products: [],
        total_count: 0,
        page,
        limit,
        has_more: false
      }
    }

    const dataObj = data as any
    const products = (dataObj.products || []) as ProductWithSite[]
    const total_count = dataObj.total_count || 0
    
    return {
      products,
      total_count,
      page,
      limit,
      has_more: offset + products.length < total_count
    }
  } catch (error) {
    if (error instanceof AdminProductError) {
      throw error
    }
    
    console.error('Unexpected error in getSiteProducts:', error)
    throw new AdminProductError(
      'An unexpected error occurred while fetching site products',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Search products across all sites (admin-only)
 */
export async function searchAllProducts(
  query: string,
  page: number = 1,
  limit: number = 50,
  filters: Omit<ProductSearchFilters, 'search'> = {}
): Promise<ProductListResponse> {
  try {
    if (!query || query.trim().length < 2) {
      throw new AdminProductError(
        'Search query must be at least 2 characters long',
        'INVALID_SEARCH_QUERY'
      )
    }

    const offset = (page - 1) * limit

    // For cross-site search, we'll use a direct query with admin privileges check
    let queryBuilder = supabase
      .from('products')
      .select(`
        *,
        sites!inner(name, subdomain)
      `)

    // Add search conditions
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%, description.ilike.%${query}%, sku.ilike.%${query}%`)

    // Add filters
    if (filters.category) {
      queryBuilder = queryBuilder.eq('category', filters.category)
    }

    if (filters.subcategory) {
      queryBuilder = queryBuilder.eq('subcategory', filters.subcategory)
    }

    if (filters.status === 'active') {
      queryBuilder = queryBuilder.eq('is_active', true)
    } else if (filters.status === 'inactive') {
      queryBuilder = queryBuilder.eq('is_active', false)
    } else if (filters.status === 'featured') {
      queryBuilder = queryBuilder.eq('is_featured', true)
    } else if (filters.status === 'out_of_stock') {
      queryBuilder = queryBuilder.eq('in_stock', false)
    }

    if (filters.in_stock !== undefined) {
      queryBuilder = queryBuilder.eq('in_stock', filters.in_stock)
    }

    if (filters.price_min !== undefined) {
      queryBuilder = queryBuilder.gte('price', filters.price_min)
    }

    if (filters.price_max !== undefined) {
      queryBuilder = queryBuilder.lte('price', filters.price_max)
    }

    if (filters.import_source) {
      queryBuilder = queryBuilder.eq('import_source', filters.import_source)
    }

    if (filters.created_after) {
      queryBuilder = queryBuilder.gte('created_at', filters.created_after)
    }

    if (filters.created_before) {
      queryBuilder = queryBuilder.lte('created_at', filters.created_before)
    }

    // Get total count for pagination
    const countQuery = supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
    
    // Apply the same filters to count query
    let countQueryBuilder = countQuery.or(`name.ilike.%${query}%, description.ilike.%${query}%, sku.ilike.%${query}%`)
    
    if (filters.category) {
      countQueryBuilder = countQueryBuilder.eq('category', filters.category)
    }
    if (filters.subcategory) {
      countQueryBuilder = countQueryBuilder.eq('subcategory', filters.subcategory)
    }
    if (filters.status === 'active') {
      countQueryBuilder = countQueryBuilder.eq('is_active', true)
    } else if (filters.status === 'inactive') {
      countQueryBuilder = countQueryBuilder.eq('is_active', false)
    } else if (filters.status === 'featured') {
      countQueryBuilder = countQueryBuilder.eq('is_featured', true)
    } else if (filters.status === 'out_of_stock') {
      countQueryBuilder = countQueryBuilder.eq('in_stock', false)
    }
    if (filters.in_stock !== undefined) {
      countQueryBuilder = countQueryBuilder.eq('in_stock', filters.in_stock)
    }
    if (filters.price_min !== undefined) {
      countQueryBuilder = countQueryBuilder.gte('price', filters.price_min)
    }
    if (filters.price_max !== undefined) {
      countQueryBuilder = countQueryBuilder.lte('price', filters.price_max)
    }
    if (filters.import_source) {
      countQueryBuilder = countQueryBuilder.eq('import_source', filters.import_source)
    }
    if (filters.created_after) {
      countQueryBuilder = countQueryBuilder.gte('created_at', filters.created_after)
    }
    if (filters.created_before) {
      countQueryBuilder = countQueryBuilder.lte('created_at', filters.created_before)
    }

    const { count: total_count } = await countQueryBuilder

    // Get paginated results
    const { data, error } = await queryBuilder
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error searching all products:', error)
      throw new AdminProductError(
        'Failed to search products',
        'SEARCH_PRODUCTS_ERROR',
        error
      )
    }

    // Transform data to include site information
    const products = (data || []).map((item: any) => ({
      ...item,
      site_name: item.sites?.name || 'Unknown Site',
      site_subdomain: item.sites?.subdomain || null
    })) as ProductWithSite[]

    return {
      products,
      total_count: total_count || 0,
      page,
      limit,
      has_more: offset + products.length < (total_count || 0)
    }
  } catch (error) {
    if (error instanceof AdminProductError) {
      throw error
    }
    
    console.error('Unexpected error in searchAllProducts:', error)
    throw new AdminProductError(
      'An unexpected error occurred while searching products',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Update a single product with audit logging
 */
export async function updateProduct(
  productId: string,
  updates: Partial<ProductUpdate>,
  adminNotes?: string
): Promise<ProductRow> {
  try {
    if (!productId) {
      throw new AdminProductError(
        'Product ID is required',
        'INVALID_PRODUCT_ID'
      )
    }

    if (Object.keys(updates).length === 0) {
      throw new AdminProductError(
        'At least one update field is required',
        'NO_UPDATES_PROVIDED'
      )
    }

    // Filter out undefined values and prepare updates
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )

    const { data, error } = await supabase.rpc('admin_update_product', {
      product_uuid: productId,
      product_updates: filteredUpdates,
      admin_notes: adminNotes || undefined
    })

    if (error) {
      console.error('Error updating product:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Access denied')) {
        throw new AdminProductError(
          'Access denied: Admin privileges required',
          'ACCESS_DENIED',
          error
        )
      }
      
      if (error.message?.includes('Product not found')) {
        throw new AdminProductError(
          'Product not found',
          'PRODUCT_NOT_FOUND',
          error
        )
      }
      
      throw new AdminProductError(
        'Failed to update product',
        'UPDATE_PRODUCT_ERROR',
        error
      )
    }

    if (!data) {
      throw new AdminProductError(
        'No data returned from product update',
        'NO_UPDATE_DATA'
      )
    }

    return data as ProductRow
  } catch (error) {
    if (error instanceof AdminProductError) {
      throw error
    }
    
    console.error('Unexpected error in updateProduct:', error)
    throw new AdminProductError(
      'An unexpected error occurred while updating product',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Bulk update multiple products
 */
export async function bulkUpdateProducts(
  productIds: string[],
  updates: ProductBulkUpdate,
  adminNotes?: string
): Promise<{ updated_count: number; total_requested: number }> {
  try {
    if (!productIds || productIds.length === 0) {
      throw new AdminProductError(
        'At least one product ID is required',
        'NO_PRODUCT_IDS'
      )
    }

    if (Object.keys(updates).length === 0) {
      throw new AdminProductError(
        'At least one update field is required',
        'NO_UPDATES_PROVIDED'
      )
    }

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )

    const { data, error } = await supabase.rpc('admin_bulk_update_products', {
      product_ids: productIds,
      bulk_updates: filteredUpdates,
      admin_notes: adminNotes || undefined
    })

    if (error) {
      console.error('Error bulk updating products:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Access denied')) {
        throw new AdminProductError(
          'Access denied: Admin privileges required',
          'ACCESS_DENIED',
          error
        )
      }
      
      throw new AdminProductError(
        'Failed to bulk update products',
        'BULK_UPDATE_ERROR',
        error
      )
    }

    if (!data) {
      throw new AdminProductError(
        'No data returned from bulk update',
        'NO_BULK_UPDATE_DATA'
      )
    }

    return data as { updated_count: number; total_requested: number }
  } catch (error) {
    if (error instanceof AdminProductError) {
      throw error
    }
    
    console.error('Unexpected error in bulkUpdateProducts:', error)
    throw new AdminProductError(
      'An unexpected error occurred while bulk updating products',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Delete products (soft delete by deactivating)
 */
export async function deleteProducts(
  productIds: string[],
  adminNotes?: string
): Promise<{ updated_count: number; total_requested: number }> {
  try {
    if (!productIds || productIds.length === 0) {
      throw new AdminProductError(
        'At least one product ID is required',
        'NO_PRODUCT_IDS'
      )
    }

    // Soft delete by setting is_active to false and is_featured to false
    return await bulkUpdateProducts(
      productIds,
      {
        is_active: false,
        is_featured: false
      },
      adminNotes ? `DELETION: ${adminNotes}` : 'DELETION: Products deleted by admin'
    )
  } catch (error) {
    if (error instanceof AdminProductError) {
      throw error
    }
    
    console.error('Unexpected error in deleteProducts:', error)
    throw new AdminProductError(
      'An unexpected error occurred while deleting products',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get product analytics for a site
 */
export async function getProductAnalytics(
  siteId: string,
  startDate?: string,
  endDate?: string
): Promise<ProductAnalytics> {
  try {
    if (!siteId) {
      throw new AdminProductError(
        'Site ID is required',
        'INVALID_SITE_ID'
      )
    }

    const { data, error } = await supabase.rpc('admin_get_product_analytics', {
      site_uuid: siteId,
      start_date: startDate || undefined,
      end_date: endDate || undefined
    })

    if (error) {
      console.error('Error fetching product analytics:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Access denied')) {
        throw new AdminProductError(
          'Access denied: Admin privileges required',
          'ACCESS_DENIED',
          error
        )
      }
      
      throw new AdminProductError(
        'Failed to fetch product analytics',
        'FETCH_ANALYTICS_ERROR',
        error
      )
    }

    if (!data) {
      throw new AdminProductError(
        'No analytics data returned',
        'NO_ANALYTICS_DATA'
      )
    }

    return data as unknown as ProductAnalytics
  } catch (error) {
    if (error instanceof AdminProductError) {
      throw error
    }
    
    console.error('Unexpected error in getProductAnalytics:', error)
    throw new AdminProductError(
      'An unexpected error occurred while fetching product analytics',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get product by ID with site information
 */
export async function getProductById(productId: string): Promise<ProductWithSite | null> {
  try {
    if (!productId) {
      throw new AdminProductError(
        'Product ID is required',
        'INVALID_PRODUCT_ID'
      )
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        sites!inner(name, subdomain)
      `)
      .eq('id', productId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      
      console.error('Error fetching product by ID:', error)
      throw new AdminProductError(
        'Failed to fetch product details',
        'FETCH_PRODUCT_ERROR',
        error
      )
    }

    // Transform data to include site information
    return {
      ...data,
      site_name: (data as any).sites?.name || 'Unknown Site',
      site_subdomain: (data as any).sites?.subdomain || null
    } as ProductWithSite
  } catch (error) {
    if (error instanceof AdminProductError) {
      throw error
    }
    
    console.error('Unexpected error in getProductById:', error)
    throw new AdminProductError(
      'An unexpected error occurred while fetching product details',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get available categories and subcategories for filtering
 */
export async function getProductCategories(siteId?: string): Promise<{
  categories: string[]
  subcategories: Record<string, string[]>
}> {
  try {
    let query = supabase
      .from('products')
      .select('category, subcategory')

    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    const { data, error } = await query
      .not('category', 'is', null)

    if (error) {
      console.error('Error fetching product categories:', error)
      throw new AdminProductError(
        'Failed to fetch product categories',
        'FETCH_CATEGORIES_ERROR',
        error
      )
    }

    // Process categories and subcategories
    const categoriesSet = new Set<string>()
    const subcategoriesMap: Record<string, Set<string>> = {}

    ;(data || []).forEach(item => {
      if (item.category) {
        categoriesSet.add(item.category)
        
        if (item.subcategory) {
          if (!subcategoriesMap[item.category]) {
            subcategoriesMap[item.category] = new Set()
          }
          subcategoriesMap[item.category].add(item.subcategory)
        }
      }
    })

    // Convert to arrays and sort
    const categories = Array.from(categoriesSet).sort()
    const subcategories: Record<string, string[]> = {}
    
    Object.keys(subcategoriesMap).forEach(category => {
      subcategories[category] = Array.from(subcategoriesMap[category]).sort()
    })

    return { categories, subcategories }
  } catch (error) {
    if (error instanceof AdminProductError) {
      throw error
    }
    
    console.error('Unexpected error in getProductCategories:', error)
    throw new AdminProductError(
      'An unexpected error occurred while fetching product categories',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get import sources for filtering
 */
export async function getImportSources(siteId?: string): Promise<string[]> {
  try {
    let query = supabase
      .from('products')
      .select('import_source')

    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    const { data, error } = await query
      .not('import_source', 'is', null)

    if (error) {
      console.error('Error fetching import sources:', error)
      throw new AdminProductError(
        'Failed to fetch import sources',
        'FETCH_IMPORT_SOURCES_ERROR',
        error
      )
    }

    // Extract unique import sources
    const importSources = Array.from(
      new Set((data || []).map(item => item.import_source).filter(Boolean) as string[])
    ).sort()

    return importSources
  } catch (error) {
    if (error instanceof AdminProductError) {
      throw error
    }
    
    console.error('Unexpected error in getImportSources:', error)
    throw new AdminProductError(
      'An unexpected error occurred while fetching import sources',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Export products to CSV format
 */
export async function exportProductsToCSV(
  siteId: string,
  filters: ProductSearchFilters = {}
): Promise<string> {
  try {
    // Get all products matching the filters (no pagination)
    const response = await getSiteProducts(siteId, 1, 10000, filters)
    const products = response.products

    if (products.length === 0) {
      return 'No products found matching the specified criteria.'
    }

    // Define CSV headers
    const headers = [
      'ID', 'SKU', 'Name', 'Description', 'Category', 'Subcategory',
      'Price', 'Sale Price', 'Unit of Measure', 'Is Active', 'Is Featured',
      'In Stock', 'Stock Status', 'Care Instructions', 'Meta Description',
      'Import Source', 'Created At', 'Updated At'
    ]

    // Convert products to CSV rows
    const csvRows = products.map(product => [
      product.id,
      product.sku || '',
      product.name,
      product.description || '',
      product.category || '',
      product.subcategory || '',
      product.price || '',
      product.sale_price || '',
      product.unit_of_measure || '',
      product.is_active ? 'Yes' : 'No',
      product.is_featured ? 'Yes' : 'No',
      product.in_stock ? 'Yes' : 'No',
      product.stock_status || '',
      product.care_instructions || '',
      product.meta_description || '',
      product.import_source || '',
      product.created_at,
      product.updated_at
    ])

    // Combine headers and rows into CSV format
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return csvContent
  } catch (error) {
    if (error instanceof AdminProductError) {
      throw error
    }
    
    console.error('Unexpected error in exportProductsToCSV:', error)
    throw new AdminProductError(
      'An unexpected error occurred while exporting products',
      'EXPORT_ERROR',
      error
    )
  }
}

/**
 * Check if the current user has admin privileges
 */
export async function checkAdminAccess(): Promise<boolean> {
  try {
    const { data: user, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user.user) {
      return false
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.user.id)
      .single()

    if (error || !data) {
      return false
    }

    return data.role === 'admin'
  } catch (error) {
    console.error('Error checking admin access:', error)
    return false
  }
}

/**
 * Utility function to validate admin access and throw error if not authorized
 */
export async function requireAdminAccess(): Promise<void> {
  const hasAccess = await checkAdminAccess()
  if (!hasAccess) {
    throw new AdminProductError(
      'Access denied: Admin privileges required',
      'ACCESS_DENIED'
    )
  }
}