/**
 * Product-related query functions
 * Handles all database operations for product catalog
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database/types';
import { 
  handleQueryResponse, 
  handleSingleResponse,
  handleCountResponse,
  buildPaginatedResponse,
  calculateOffset,
  filterUndefined,
  buildOrderBy,
  safeJsonParse,
  PaginatedResponse,
  QueryParams,
  RowType,
  InsertType,
  UpdateType
} from '../base';
import { SupabaseError } from '../errors';

type Product = RowType<'products'>;
type InsertProduct = InsertType<'products'>;
type UpdateProduct = UpdateType<'products'>;

export interface ProductFilters extends QueryParams<Product> {
  category?: string;
  subcategory?: string;
  featured?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  active?: boolean;
}

export interface ProductWithTags extends Product {
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface ProductAttributes {
  [key: string]: any;
}

/**
 * Get paginated product list
 */
export async function getProducts(
  supabase: SupabaseClient<Database>,
  siteId: string,
  filters: ProductFilters = {}
): Promise<PaginatedResponse<ProductWithTags>> {
  const { 
    page = 1, 
    limit = 12, 
    search, 
    category,
    subcategory,
    featured,
    inStock,
    minPrice,
    maxPrice,
    active = true,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = filters;

  // Build base query
  let countQuery = supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId);

  let dataQuery = supabase
    .from('products')
    .select(`
      *,
      tags:taggings(
        tag:tags(
          id,
          name,
          slug
        )
      )
    `)
    .eq('site_id', siteId);

  // Apply filters
  if (active !== undefined) {
    countQuery = countQuery.eq('is_active', active);
    dataQuery = dataQuery.eq('is_active', active);
  }

  if (category) {
    countQuery = countQuery.eq('category', category);
    dataQuery = dataQuery.eq('category', category);
  }

  if (subcategory) {
    countQuery = countQuery.eq('subcategory', subcategory);
    dataQuery = dataQuery.eq('subcategory', subcategory);
  }

  if (featured !== undefined) {
    countQuery = countQuery.eq('is_featured', featured);
    dataQuery = dataQuery.eq('is_featured', featured);
  }

  if (inStock !== undefined) {
    countQuery = countQuery.eq('in_stock', inStock);
    dataQuery = dataQuery.eq('in_stock', inStock);
  }

  if (minPrice !== undefined) {
    countQuery = countQuery.gte('price', minPrice);
    dataQuery = dataQuery.gte('price', minPrice);
  }

  if (maxPrice !== undefined) {
    countQuery = countQuery.lte('price', maxPrice);
    dataQuery = dataQuery.lte('price', maxPrice);
  }

  // Apply search across multiple fields
  if (search) {
    const searchCondition = `name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`;
    countQuery = countQuery.or(searchCondition);
    dataQuery = dataQuery.or(searchCondition);
  }

  // Get count
  const count = await handleCountResponse(await countQuery);

  // Apply pagination and sorting
  const offset = calculateOffset(page, limit);
  const orderBy = buildOrderBy<Product>(sortBy, sortOrder);
  
  if (orderBy) {
    dataQuery = dataQuery.order(orderBy.column, { ascending: orderBy.ascending });
  }
  
  dataQuery = dataQuery.range(offset, offset + limit - 1);

  // Execute query
  const data = await handleQueryResponse(await dataQuery);

  // Transform data to flatten tags
  const transformedData = data.map((item: any) => ({
    ...item,
    tags: item.tags?.map((t: any) => t.tag).filter(Boolean) || [],
  }));

  return buildPaginatedResponse(transformedData, count, page, limit);
}

/**
 * Get a single product by ID
 */
export async function getProductById(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productId: string
): Promise<ProductWithTags> {
  const response = await supabase
    .from('products')
    .select(`
      *,
      tags:taggings(
        tag:tags(
          id,
          name,
          slug
        )
      )
    `)
    .eq('site_id', siteId)
    .eq('id', productId)
    .single();

  const data = await handleSingleResponse(response);
  
  // Transform tags
  return {
    ...data,
    tags: data.tags?.map((t: any) => t.tag).filter(Boolean) || [],
  };
}

/**
 * Get product by slug
 */
export async function getProductBySlug(
  supabase: SupabaseClient<Database>,
  siteId: string,
  slug: string
): Promise<ProductWithTags> {
  const response = await supabase
    .from('products')
    .select(`
      *,
      tags:taggings(
        tag:tags(
          id,
          name,
          slug
        )
      )
    `)
    .eq('site_id', siteId)
    .eq('slug', slug)
    .single();

  const data = await handleSingleResponse(response);
  
  // Transform tags
  return {
    ...data,
    tags: data.tags?.map((t: any) => t.tag).filter(Boolean) || [],
  };
}

/**
 * Get product by SKU
 */
export async function getProductBySku(
  supabase: SupabaseClient<Database>,
  siteId: string,
  sku: string
): Promise<ProductWithTags> {
  const response = await supabase
    .from('products')
    .select(`
      *,
      tags:taggings(
        tag:tags(
          id,
          name,
          slug
        )
      )
    `)
    .eq('site_id', siteId)
    .eq('sku', sku)
    .single();

  const data = await handleSingleResponse(response);
  
  // Transform tags
  return {
    ...data,
    tags: data.tags?.map((t: any) => t.tag).filter(Boolean) || [],
  };
}

/**
 * Create new product
 */
export async function createProduct(
  supabase: SupabaseClient<Database>,
  data: InsertProduct,
  tagIds?: string[]
): Promise<Product> {
  // Create product
  const response = await supabase
    .from('products')
    .insert(data)
    .select()
    .single();

  const product = await handleSingleResponse(response);

  // Add tags if provided
  if (tagIds && tagIds.length > 0) {
    const taggings = tagIds.map(tagId => ({
      tag_id: tagId,
      taggable_id: product.id,
      taggable_type: 'product' as const,
    }));

    const { error } = await supabase
      .from('taggings')
      .insert(taggings);

    if (error) {
      console.error('Failed to add tags:', error);
      // Don't throw - product was created successfully
    }
  }

  return product;
}

/**
 * Update product
 */
export async function updateProduct(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productId: string,
  data: UpdateProduct,
  tagIds?: string[]
): Promise<Product> {
  const filteredData = filterUndefined(data);
  
  // Update product
  const response = await supabase
    .from('products')
    .update({
      ...filteredData,
      updated_at: new Date().toISOString(),
    })
    .eq('site_id', siteId)
    .eq('id', productId)
    .select()
    .single();

  const product = await handleSingleResponse(response);

  // Update tags if provided
  if (tagIds !== undefined) {
    // Remove existing tags
    await supabase
      .from('taggings')
      .delete()
      .eq('taggable_id', productId)
      .eq('taggable_type', 'product');

    // Add new tags
    if (tagIds.length > 0) {
      const taggings = tagIds.map(tagId => ({
        tag_id: tagId,
        taggable_id: productId,
        taggable_type: 'product' as const,
      }));

      const { error } = await supabase
        .from('taggings')
        .insert(taggings);

      if (error) {
        console.error('Failed to update tags:', error);
      }
    }
  }

  return product;
}

/**
 * Delete product
 */
export async function deleteProduct(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productId: string
): Promise<void> {
  const response = await supabase
    .from('products')
    .delete()
    .eq('site_id', siteId)
    .eq('id', productId);

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }
}

/**
 * Toggle product active status
 */
export async function toggleProductActive(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productId: string,
  active: boolean
): Promise<Product> {
  const response = await supabase
    .from('products')
    .update({
      is_active: active,
      updated_at: new Date().toISOString(),
    })
    .eq('site_id', siteId)
    .eq('id', productId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Toggle featured status
 */
export async function toggleProductFeatured(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productId: string,
  featured: boolean
): Promise<Product> {
  const response = await supabase
    .from('products')
    .update({
      is_featured: featured,
      updated_at: new Date().toISOString(),
    })
    .eq('site_id', siteId)
    .eq('id', productId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Update product stock status
 */
export async function updateProductStock(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productId: string,
  inStock: boolean,
  stockStatus?: string
): Promise<Product> {
  const response = await supabase
    .from('products')
    .update({
      in_stock: inStock,
      stock_status: stockStatus || (inStock ? 'in_stock' : 'out_of_stock'),
      updated_at: new Date().toISOString(),
    })
    .eq('site_id', siteId)
    .eq('id', productId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
  supabase: SupabaseClient<Database>,
  siteId: string,
  category: string
): Promise<ProductWithTags[]> {
  const query = supabase
    .from('products')
    .select(`
      *,
      tags:taggings(
        tag:tags(id, name, slug)
      )
    `)
    .eq('site_id', siteId)
    .eq('category', category)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const response = await query;
  const data = handleResponse(response);
  return data.map(transformProductWithTags);
}

/**
 * Search products
 */
export async function searchProducts(
  supabase: SupabaseClient<Database>,
  siteId: string,
  searchQuery: string
): Promise<ProductWithTags[]> {
  const query = supabase
    .from('products')
    .select(`
      *,
      tags:taggings(
        tag:tags(id, name, slug)
      )
    `)
    .eq('site_id', siteId)
    .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
    .order('created_at', { ascending: false });

  const response = await query;
  const data = handleResponse(response);
  return data.map(transformProductWithTags);
}

/**
 * Update product inventory
 */
export async function updateProductInventory(
  supabase: SupabaseClient<Database>,
  productId: string,
  quantity: number
): Promise<Product> {
  const response = await supabase
    .from('products')
    .update({ inventory_count: quantity })
    .eq('id', productId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Get product categories
 */
export async function getProductCategories(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<Array<{ category: string; count: number }>> {
  const response = await supabase
    .from('products')
    .select('category')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .not('category', 'is', null);

  const products = await handleQueryResponse(response);

  // Count products per category
  const categoryMap = products.reduce((acc, product) => {
    const category = product.category as string;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get product statistics
 */
export async function getProductStats(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<{
  total: number;
  active: number;
  featured: number;
  inStock: number;
  outOfStock: number;
  avgPrice: number;
}> {
  const [
    total,
    active,
    featured,
    inStock,
    avgPriceResult
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('is_active', true),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('is_featured', true),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('in_stock', true),
    supabase
      .from('products')
      .select('price')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .not('price', 'is', null),
  ]);

  const totalCount = total.count || 0;
  const activeCount = active.count || 0;
  const inStockCount = inStock.count || 0;
  
  // Calculate average price
  const prices = (avgPriceResult.data || []).map(p => p.price).filter(p => p !== null) as number[];
  const avgPrice = prices.length > 0 
    ? prices.reduce((sum, price) => sum + price, 0) / prices.length 
    : 0;

  return {
    total: totalCount,
    active: activeCount,
    featured: featured.count || 0,
    inStock: inStockCount,
    outOfStock: activeCount - inStockCount,
    avgPrice: Math.round(avgPrice * 100) / 100,
  };
}

/**
 * Check SKU availability
 */
export async function checkSkuAvailability(
  supabase: SupabaseClient<Database>,
  siteId: string,
  sku: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('products')
    .select('id')
    .eq('site_id', siteId)
    .eq('sku', sku);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const response = await query.maybeSingle();

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }

  return response.data === null;
}

/**
 * Parse product images from JSON
 */
export function parseProductImages(images: any): ProductImage[] {
  return safeJsonParse<ProductImage[]>(images, []);
}

/**
 * Parse product attributes from JSON
 */
export function parseProductAttributes(attributes: any): ProductAttributes {
  return safeJsonParse<ProductAttributes>(attributes, {});
}