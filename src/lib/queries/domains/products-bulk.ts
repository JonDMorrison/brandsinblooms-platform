/**
 * Product bulk operations query functions
 * Handles database operations for bulk product management
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Tables, TablesUpdate } from '@/lib/database/types';
import { 
  handleQueryResponse, 
  handleSingleResponse,
  filterUndefined
} from '../base';
import { SupabaseError } from '../errors';

type Product = Tables<'products'>;
type UpdateProduct = TablesUpdate<'products'>;

export interface BulkUpdateData {
  is_active?: boolean;
  is_featured?: boolean;
  category?: string;
  subcategory?: string;
  price?: number;
  compare_at_price?: number;
  inventory_count?: number;
  in_stock?: boolean;
  stock_status?: string;
}

export interface BulkPriceUpdate {
  type: 'percentage' | 'fixed';
  value: number;
  operation: 'increase' | 'decrease';
}

export interface ProductExportData {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  subcategory: string;
  price: number;
  compare_at_price: number;
  inventory_count: number;
  in_stock: boolean;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Bulk update products
 */
export async function bulkUpdateProducts(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productIds: string[],
  updates: BulkUpdateData
): Promise<Product[]> {
  if (productIds.length === 0) {
    throw new Error('No products selected for update');
  }

  const filteredUpdates = filterUndefined({
    ...updates,
    updated_at: new Date().toISOString(),
  });

  const response = await supabase
    .from('products')
    .update(filteredUpdates)
    .eq('site_id', siteId)
    .in('id', productIds)
    .select();

  return handleQueryResponse(response);
}

/**
 * Bulk delete products
 */
export async function bulkDeleteProducts(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productIds: string[]
): Promise<void> {
  if (productIds.length === 0) {
    throw new Error('No products selected for deletion');
  }

  // Delete associated taggings first
  await supabase
    .from('taggings')
    .delete()
    .in('taggable_id', productIds)
    .eq('taggable_type', 'product');

  // Delete products
  const response = await supabase
    .from('products')
    .delete()
    .eq('site_id', siteId)
    .in('id', productIds);

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }
}

/**
 * Bulk duplicate products
 */
export async function bulkDuplicateProducts(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productIds: string[]
): Promise<Product[]> {
  if (productIds.length === 0) {
    throw new Error('No products selected for duplication');
  }

  // Get products to duplicate
  const { data: productsToClone, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .eq('site_id', siteId)
    .in('id', productIds);

  if (fetchError) {
    throw SupabaseError.fromPostgrestError(fetchError);
  }

  if (!productsToClone || productsToClone.length === 0) {
    throw new Error('No products found to duplicate');
  }

  // Create duplicates
  const duplicates = productsToClone.map((product, index) => {
    const { id, created_at, updated_at, ...productData } = product;
    return {
      ...productData,
      name: `${product.name} (Copy${index > 0 ? ` ${index + 1}` : ''})`,
      sku: product.sku ? `${product.sku}-copy-${Date.now()}-${index}` : null,
      is_active: false, // New duplicates start as inactive
    };
  });

  const response = await supabase
    .from('products')
    .insert(duplicates)
    .select();

  return handleQueryResponse(response);
}

/**
 * Bulk update prices
 */
export async function bulkUpdatePrices(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productIds: string[],
  priceUpdate: BulkPriceUpdate
): Promise<Product[]> {
  if (productIds.length === 0) {
    throw new Error('No products selected for price update');
  }

  // Get current products to calculate new prices
  const { data: currentProducts, error: fetchError } = await supabase
    .from('products')
    .select('id, price')
    .eq('site_id', siteId)
    .in('id', productIds);

  if (fetchError) {
    throw SupabaseError.fromPostgrestError(fetchError);
  }

  if (!currentProducts || currentProducts.length === 0) {
    throw new Error('No products found for price update');
  }

  // Calculate new prices
  const updates = currentProducts.map(product => {
    const currentPrice = product.price || 0;
    let newPrice = currentPrice;
    
    if (priceUpdate.type === 'percentage') {
      const multiplier = priceUpdate.operation === 'increase' 
        ? (1 + priceUpdate.value / 100)
        : (1 - priceUpdate.value / 100);
      newPrice = Math.round(currentPrice * multiplier * 100) / 100;
    } else {
      // Fixed amount
      newPrice = priceUpdate.operation === 'increase'
        ? currentPrice + priceUpdate.value
        : currentPrice - priceUpdate.value;
      newPrice = Math.max(0, Math.round(newPrice * 100) / 100); // Ensure non-negative
    }

    return {
      id: product.id,
      price: newPrice
    };
  });

  // Update products one by one to handle individual prices
  const updatedProducts: Product[] = [];
  
  for (const update of updates) {
    const response = await supabase
      .from('products')
      .update({
        price: update.price,
        updated_at: new Date().toISOString(),
      })
      .eq('site_id', siteId)
      .eq('id', update.id)
      .select()
      .single();

    const updatedProduct = await handleSingleResponse(response);
    updatedProducts.push(updatedProduct);
  }

  return updatedProducts;
}

/**
 * Export products to CSV data
 */
export async function exportProducts(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productIds?: string[]
): Promise<ProductExportData[]> {
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      sku,
      category,
      subcategory,
      price,
      compare_at_price,
      inventory_count,
      in_stock,
      is_active,
      is_featured,
      created_at,
      updated_at
    `)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });

  // If specific products requested, filter by them
  if (productIds && productIds.length > 0) {
    query = query.in('id', productIds);
  }

  const response = await query;
  const data = await handleQueryResponse(response);
  
  return data.map((product: any) => ({
    id: product.id,
    name: product.name || '',
    description: product.description || '',
    sku: product.sku || '',
    category: product.category || '',
    subcategory: product.subcategory || '',
    price: product.price || 0,
    compare_at_price: product.compare_at_price || 0,
    inventory_count: product.inventory_count || 0,
    in_stock: product.in_stock || false,
    is_active: product.is_active || false,
    is_featured: product.is_featured || false,
    created_at: product.created_at,
    updated_at: product.updated_at,
  }));
}

/**
 * Generate CSV string from product data
 */
export function generateProductCSV(products: ProductExportData[]): string {
  if (products.length === 0) return '';

  const headers = [
    'ID',
    'Name',
    'Description',
    'SKU',
    'Category',
    'Subcategory',
    'Price',
    'Compare At Price',
    'Inventory Count',
    'In Stock',
    'Active',
    'Featured',
    'Created At',
    'Updated At'
  ];

  const csvRows = [
    headers.join(','),
    ...products.map(product => [
      product.id,
      `"${product.name.replace(/"/g, '""')}"`,
      `"${product.description.replace(/"/g, '""')}"`,
      product.sku,
      product.category,
      product.subcategory,
      product.price,
      product.compare_at_price,
      product.inventory_count,
      product.in_stock,
      product.is_active,
      product.is_featured,
      product.created_at,
      product.updated_at
    ].join(','))
  ];

  return csvRows.join('\n');
}

/**
 * Bulk activate products
 */
export async function bulkActivateProducts(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productIds: string[]
): Promise<Product[]> {
  return bulkUpdateProducts(supabase, siteId, productIds, { is_active: true });
}

/**
 * Bulk deactivate products
 */
export async function bulkDeactivateProducts(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productIds: string[]
): Promise<Product[]> {
  return bulkUpdateProducts(supabase, siteId, productIds, { is_active: false });
}

/**
 * Bulk set featured status
 */
export async function bulkSetFeatured(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productIds: string[],
  featured: boolean
): Promise<Product[]> {
  return bulkUpdateProducts(supabase, siteId, productIds, { is_featured: featured });
}

/**
 * Bulk update category
 */
export async function bulkUpdateCategory(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productIds: string[],
  category: string,
  subcategory?: string
): Promise<Product[]> {
  const updates: BulkUpdateData = { category };
  if (subcategory) {
    updates.subcategory = subcategory;
  }
  return bulkUpdateProducts(supabase, siteId, productIds, updates);
}