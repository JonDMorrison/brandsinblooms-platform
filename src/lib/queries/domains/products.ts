/**
 * Product-related query functions
 * Handles all database operations for product catalog
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Tables, TablesInsert, TablesUpdate, Json } from '@/lib/database/types';
import { ProductAttributes } from '@/lib/database/json-types';
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

type Product = Tables<'products'>;
type InsertProduct = TablesInsert<'products'>;
type UpdateProduct = TablesUpdate<'products'>;

export interface ProductFilters extends QueryParams<Product> {
  category?: string;
  subcategory?: string;
  featured?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  active?: boolean;
}

type Tag = {
  id: string;
  name: string;
  slug: string;
};

export interface ProductWithTags extends Product {
  tags?: Tag[];
}

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

// ProductAttributes now imported from json-types.ts

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

  // Build base query with category associations
  let countQuery = supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId);

  let dataQuery = supabase
    .from('products')
    .select(`
      *,
      primary_category:product_categories!products_primary_category_id_fkey (
        id,
        name,
        slug,
        icon,
        color
      ),
      product_category_assignments (
        category:product_categories (
          id,
          name,
          slug,
          icon,
          color
        )
      ),
      product_images (
        id,
        url,
        position,
        is_primary,
        alt_text,
        caption,
        storage_type,
        cdn_url
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

  // Transform data (tags will be empty for now)
  const transformedData = data.map((item) => ({
    ...item,
    tags: [],
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
      primary_category:product_categories!products_primary_category_id_fkey (
        id,
        name,
        slug,
        icon,
        color
      ),
      product_category_assignments (
        category:product_categories (
          id,
          name,
          slug,
          icon,
          color
        )
      ),
      product_images (
        id,
        url,
        position,
        is_primary,
        alt_text,
        caption,
        storage_type,
        cdn_url
      )
    `)
    .eq('site_id', siteId)
    .eq('id', productId)
    .single();

  const data = await handleSingleResponse(response);
  
  // Transform tags - handle potential relation errors
  const tags: Tag[] = [];
  
  return {
    ...data,
    tags,
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
    .select('*')
    .eq('site_id', siteId)
    .eq('slug', slug)
    .single();

  const data = await handleSingleResponse(response);
  
  // Transform tags - handle potential relation errors
  const tags: Tag[] = [];
  
  return {
    ...data,
    tags,
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
    .select('*')
    .eq('site_id', siteId)
    .eq('sku', sku)
    .single();

  const data = await handleSingleResponse(response);
  
  // Transform tags - handle potential relation errors
  const tags: Tag[] = [];
  
  return {
    ...data,
    tags,
  };
}

/**
 * Create new product with category assignments
 */
export async function createProduct(
  supabase: SupabaseClient<Database>,
  data: InsertProduct & { 
    primary_category_id?: string;
    category_ids?: string[];
  },
  tagIds?: string[]
): Promise<Product> {
  console.log('🏭 createProduct function called with data:', data);
  console.log('🏷️ Tags to add:', tagIds);
  
  // Extract category data from the product data
  const { primary_category_id, category_ids, ...productData } = data;
  
  // Create product with primary_category_id if provided
  console.log('🔄 Inserting product into database...');
  const response = await supabase
    .from('products')
    .insert({
      ...productData,
      primary_category_id: primary_category_id || null
    })
    .select()
    .single();

  console.log('✅ Database insert response:', response);
  
  const product = await handleSingleResponse(response);
  console.log('✅ Product created successfully:', product);

  // Add category assignments if provided
  if (primary_category_id || (category_ids && category_ids.length > 0)) {
    console.log('📁 Adding category assignments...');
    
    const assignments = [];
    
    // Add primary category assignment
    if (primary_category_id) {
      assignments.push({
        product_id: product.id,
        category_id: primary_category_id,
        is_primary: true,
        sort_order: 0
      });
    }
    
    // Add additional category assignments
    if (category_ids && category_ids.length > 0) {
      const additionalAssignments = category_ids
        .filter(id => id !== primary_category_id) // Exclude primary if it's in the list
        .map((categoryId, index) => ({
          product_id: product.id,
          category_id: categoryId,
          is_primary: false,
          sort_order: index + 1
        }));
      assignments.push(...additionalAssignments);
    }
    
    if (assignments.length > 0) {
      const { error } = await supabase
        .from('product_category_assignments')
        .insert(assignments);
      
      if (error) {
        console.error('Failed to add category assignments:', error);
        // Don't throw - product was created successfully
      } else {
        console.log('✅ Category assignments added successfully');
      }
    }
  }

  // Add tags if provided
  if (tagIds && tagIds.length > 0) {
    console.log('🏷️ Adding tags to product:', tagIds);
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
    } else {
      console.log('✅ Tags added successfully');
    }
  }

  console.log('🎉 createProduct function completed, returning:', product);
  return product;
}

/**
 * Update product with category assignments
 */
export async function updateProduct(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productId: string,
  data: UpdateProduct & {
    primary_category_id?: string | null;
    category_ids?: string[];
  },
  tagIds?: string[]
): Promise<Product> {
  // Extract category data from the update data
  const { primary_category_id, category_ids, ...productData } = data;
  const filteredData = filterUndefined(productData);
  
  // Update product with primary_category_id if provided
  const updateData = {
    ...filteredData,
    updated_at: new Date().toISOString(),
  };
  
  // Handle primary_category_id explicitly (can be null to clear it)
  if (primary_category_id !== undefined) {
    updateData.primary_category_id = primary_category_id;
  }
  
  const response = await supabase
    .from('products')
    .update(updateData)
    .eq('site_id', siteId)
    .eq('id', productId)
    .select()
    .single();

  const product = await handleSingleResponse(response);
  
  // Update category assignments if provided
  if (primary_category_id !== undefined || category_ids !== undefined) {
    // Remove existing assignments
    await supabase
      .from('product_category_assignments')
      .delete()
      .eq('product_id', productId);
    
    const assignments = [];
    
    // Add primary category assignment
    if (primary_category_id) {
      assignments.push({
        product_id: productId,
        category_id: primary_category_id,
        is_primary: true,
        sort_order: 0
      });
    }
    
    // Add additional category assignments
    if (category_ids && category_ids.length > 0) {
      const additionalAssignments = category_ids
        .filter(id => id !== primary_category_id) // Exclude primary if it's in the list
        .map((categoryId, index) => ({
          product_id: productId,
          category_id: categoryId,
          is_primary: false,
          sort_order: index + 1
        }));
      assignments.push(...additionalAssignments);
    }
    
    if (assignments.length > 0) {
      const { error } = await supabase
        .from('product_category_assignments')
        .insert(assignments);
      
      if (error) {
        console.error('Failed to update category assignments:', error);
      }
    }
  }

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
    .select('*')
    .eq('site_id', siteId)
    .eq('category', category)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const data = await handleQueryResponse(await query);
  return data.map((item) => ({
    ...item,
    tags: [],
  }));
  
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
    .select('*')
    .eq('site_id', siteId)
    .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
    .order('created_at', { ascending: false });

  const data = await handleQueryResponse(await query);
  return data.map((item) => ({
    ...item,
    tags: [],
  }));
  
}

/**
 * Update product inventory
 */
export async function updateProductInventory(
  supabase: SupabaseClient<Database>,
  productId: string,
  change: number
): Promise<Product> {
  // Use the database function for safe inventory updates
  const response = await supabase.rpc('update_product_inventory', {
    p_product_id: productId,
    p_change: change
  }).single();

  return handleSingleResponse(response);
}

/**
 * Get product categories
 */
export async function getProductCategories(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<Array<{ id: string; name: string; slug: string; count: number; icon?: string; color?: string }>> {
  // Fetch all active categories for the site
  const categoriesResponse = await supabase
    .from('product_categories')
    .select(`
      id,
      name,
      slug,
      icon,
      color,
      product_category_assignments!product_category_assignments_category_id_fkey(
        product_id
      )
    `)
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  const categories = await handleQueryResponse(categoriesResponse);

  // Transform to include count of products in each category
  return categories.map((category) => {
    const category_assignments = category.product_category_assignments as any[] || [];
    const productCount = category_assignments.length;
    
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      count: productCount,
      icon: category.icon || undefined,
      color: category.color || undefined
    };
  }).filter(cat => cat.count > 0 || true); // Show all categories, even empty ones
}

/**
 * Get product statistics with enhanced metrics
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
  inventoryValue: number;
  totalInventoryUnits: number;
  avgRating: number;
  totalReviews: number;
  lowStockCount: number;
}> {
  // The current database function doesn't include inventory value calculations
  // So we'll always use client-side calculation for consistency
  // In the future, the database function could be enhanced to include these fields
  
  // Fallback to client-side calculation
  const { data: products, error } = await supabase
    .from('products')
    .select('price, inventory_count, rating, review_count, is_active, is_featured, in_stock')
    .eq('site_id', siteId);
  
  if (error) throw SupabaseError.fromPostgrestError(error);
  
  const stats = (products || []).reduce((acc, product) => {
    const inventory = product.inventory_count ?? 0;
    const price = product.price ?? 0;
    const rating = product.rating ?? 0;
    const reviews = product.review_count ?? 0;
    
    // Skip invalid data
    if (inventory < 0 || price < 0) {
      return acc;
    }
    
    return {
      total: acc.total + 1,
      active: acc.active + (product.is_active ? 1 : 0),
      featured: acc.featured + (product.is_featured ? 1 : 0),
      inStock: acc.inStock + (product.in_stock ? 1 : 0),
      outOfStock: acc.outOfStock + (!product.in_stock ? 1 : 0),
      inventoryValue: acc.inventoryValue + (inventory * price),
      totalInventoryUnits: acc.totalInventoryUnits + inventory,
      totalRatings: acc.totalRatings + rating,
      totalReviews: acc.totalReviews + reviews,
      lowStockCount: acc.lowStockCount + (inventory > 0 && inventory <= 10 ? 1 : 0),
      priceSum: acc.priceSum + (product.is_active && price > 0 ? price : 0),
      priceCount: acc.priceCount + (product.is_active && price > 0 ? 1 : 0),
    };
  }, {
    total: 0,
    active: 0,
    featured: 0,
    inStock: 0,
    outOfStock: 0,
    inventoryValue: 0,
    totalInventoryUnits: 0,
    totalRatings: 0,
    totalReviews: 0,
    lowStockCount: 0,
    priceSum: 0,
    priceCount: 0,
  });
  
  return {
    total: stats.total,
    active: stats.active,
    featured: stats.featured,
    inStock: stats.inStock,
    outOfStock: stats.outOfStock,
    avgPrice: stats.priceCount > 0 
      ? Math.round((stats.priceSum / stats.priceCount) * 100) / 100 
      : 0,
    inventoryValue: Math.round(stats.inventoryValue * 100) / 100,
    totalInventoryUnits: stats.totalInventoryUnits,
    avgRating: stats.total > 0 
      ? Math.round((stats.totalRatings / stats.total) * 10) / 10 
      : 0,
    totalReviews: stats.totalReviews,
    lowStockCount: stats.lowStockCount,
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
 * Generate unique slug for product
 */
export async function generateUniqueSlug(
  supabase: SupabaseClient<Database>,
  name: string,
  siteId: string
): Promise<string> {
  console.log('[generateUniqueSlug] Input name:', name);
  console.log('[generateUniqueSlug] Site ID:', siteId);
  
  // Generate the full base slug from the entire name
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  console.log('[generateUniqueSlug] Generated base slug:', baseSlug);
  
  // If the slug is empty after cleanup, use a fallback
  if (!baseSlug) {
    return 'product-' + Date.now();
  }
  
  // First check if the exact slug exists
  const { data: exactMatch } = await supabase
    .from('products')
    .select('slug')
    .eq('site_id', siteId)
    .eq('slug', baseSlug)
    .maybeSingle();
  
  // If exact slug doesn't exist, use it
  if (!exactMatch) {
    return baseSlug;
  }
  
  // Otherwise, find all slugs that match the pattern "baseSlug" or "baseSlug-N"
  const { data } = await supabase
    .from('products')
    .select('slug')
    .eq('site_id', siteId)
    .or(`slug.eq.${baseSlug},slug.like.${baseSlug}-*`);
  
  if (!data || data.length === 0) return baseSlug;
  
  const slugs = data.map(p => p.slug);
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (slugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  
  return uniqueSlug;
}

/**
 * Parse product images from JSON
 */
export function parseProductImages(images: Json): ProductImage[] {
  // Handle the Json type properly
  if (!images) return [];
  if (Array.isArray(images)) return images as unknown as ProductImage[];
  if (typeof images === 'string') return safeJsonParse<ProductImage[]>(images, []);
  return [];
}

/**
 * Parse product attributes from JSON
 */
export function parseProductAttributes(attributes: Json): ProductAttributes {
  // Handle the Json type properly
  if (!attributes) return {};
  if (typeof attributes === 'object' && !Array.isArray(attributes)) {
    return attributes as unknown as ProductAttributes;
  }
  if (typeof attributes === 'string') {
    return safeJsonParse<ProductAttributes>(attributes, {});
  }
  return {};
}