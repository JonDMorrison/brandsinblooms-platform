/**
 * Product bulk operations query functions
 * Handles database operations for bulk product management
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Tables, TablesUpdate } from '@/lib/database/types';
import { 
  handleQueryResponse, 
  handleSingleResponse,
  filterUndefined,
  withRetry
} from '../base';
import { SupabaseError } from '../errors';
import { handleError } from '@/lib/types/error-handling';

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
 * Bulk update products using atomic RPC function
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

  const filteredUpdates = filterUndefined(updates);

  try {
    const { data, error } = await withRetry(
      () => supabase.rpc('bulk_update_products_atomic', {
        p_site_id: siteId,
        p_product_ids: productIds,
        p_updates: filteredUpdates
      }),
      3,
      1000
    );

    if (error) {
      throw SupabaseError.fromPostgrestError(error);
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Bulk update failed');
    }

    return data.products as Product[];
  } catch (error) {
    const { message } = handleError(error);
    console.error('Bulk update failed:', error);
    throw new Error(`Failed to update products: ${message}`);
  }
}

/**
 * Bulk delete products using atomic RPC function
 */
export async function bulkDeleteProducts(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productIds: string[]
): Promise<void> {
  if (productIds.length === 0) {
    throw new Error('No products selected for deletion');
  }

  try {
    const { data, error } = await withRetry(
      () => supabase.rpc('bulk_delete_products_atomic', {
        p_site_id: siteId,
        p_product_ids: productIds
      }),
      3,
      1000
    );

    if (error) {
      throw SupabaseError.fromPostgrestError(error);
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Bulk delete failed');
    }

    // Clean up storage if image URLs returned (non-blocking)
    if (data.image_urls && Array.isArray(data.image_urls) && data.image_urls.length > 0) {
      cleanupProductImages(supabase, data.image_urls).catch(console.error);
    }
  } catch (error) {
    const { message } = handleError(error);
    console.error('Bulk delete failed:', error);
    throw new Error(`Failed to delete products: ${message}`);
  }
}

/**
 * Helper function to clean up product images from storage
 */
async function cleanupProductImages(
  supabase: SupabaseClient<Database>,
  imageUrls: string[]
): Promise<void> {
  const bucket = 'product-images';
  
  for (const url of imageUrls) {
    if (!url) continue;
    
    try {
      // Extract path from URL
      const urlObj = new URL(url);
      const path = urlObj.pathname.split('/').pop();
      
      if (path) {
        await supabase.storage.from(bucket).remove([path]);
      }
    } catch (error) {
      console.error('Failed to delete image:', url, error);
    }
  }
}

/**
 * Bulk duplicate products using atomic RPC function
 */
export async function bulkDuplicateProducts(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productIds: string[]
): Promise<Product[]> {
  if (productIds.length === 0) {
    throw new Error('No products selected for duplication');
  }

  try {
    const { data, error } = await withRetry(
      () => supabase.rpc('bulk_duplicate_products_atomic', {
        p_site_id: siteId,
        p_product_ids: productIds
      }),
      3,
      1000
    );

    if (error) {
      throw SupabaseError.fromPostgrestError(error);
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Bulk duplicate failed');
    }

    return data.products as Product[];
  } catch (error) {
    const { message } = handleError(error);
    console.error('Bulk duplicate failed:', error);
    throw new Error(`Failed to duplicate products: ${message}`);
  }
}

/**
 * Bulk update prices using atomic RPC function
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

  try {
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
        product_id: product.id,
        price: newPrice
      };
    });

    // Use RPC function for atomic price updates
    const { data, error } = await withRetry(
      () => supabase.rpc('bulk_update_prices_atomic', {
        p_site_id: siteId,
        p_updates: updates
      }),
      3,
      1000
    );

    if (error) {
      throw SupabaseError.fromPostgrestError(error);
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Bulk price update failed');
    }

    return data.products as Product[];
  } catch (error) {
    const { message } = handleError(error);
    console.error('Bulk price update failed:', error);
    throw new Error(`Failed to update prices: ${message}`);
  }
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
 * Bulk activate products using atomic RPC function
 */
export async function bulkActivateProducts(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productIds: string[]
): Promise<Product[]> {
  if (productIds.length === 0) {
    throw new Error('No products selected for activation');
  }

  try {
    const { data, error } = await withRetry(
      () => supabase.rpc('bulk_update_status_atomic', {
        p_site_id: siteId,
        p_product_ids: productIds,
        p_status_type: 'active',
        p_status_value: true
      }),
      3,
      1000
    );

    if (error) {
      throw SupabaseError.fromPostgrestError(error);
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Bulk activate failed');
    }

    return data.products as Product[];
  } catch (error) {
    const { message } = handleError(error);
    console.error('Bulk activate failed:', error);
    throw new Error(`Failed to activate products: ${message}`);
  }
}

/**
 * Bulk deactivate products using atomic RPC function
 */
export async function bulkDeactivateProducts(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productIds: string[]
): Promise<Product[]> {
  if (productIds.length === 0) {
    throw new Error('No products selected for deactivation');
  }

  try {
    const { data, error } = await withRetry(
      () => supabase.rpc('bulk_update_status_atomic', {
        p_site_id: siteId,
        p_product_ids: productIds,
        p_status_type: 'active',
        p_status_value: false
      }),
      3,
      1000
    );

    if (error) {
      throw SupabaseError.fromPostgrestError(error);
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Bulk deactivate failed');
    }

    return data.products as Product[];
  } catch (error) {
    const { message } = handleError(error);
    console.error('Bulk deactivate failed:', error);
    throw new Error(`Failed to deactivate products: ${message}`);
  }
}

/**
 * Bulk set featured status using atomic RPC function
 */
export async function bulkSetFeatured(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productIds: string[],
  featured: boolean
): Promise<Product[]> {
  if (productIds.length === 0) {
    throw new Error('No products selected for featured status update');
  }

  try {
    const { data, error } = await withRetry(
      () => supabase.rpc('bulk_update_status_atomic', {
        p_site_id: siteId,
        p_product_ids: productIds,
        p_status_type: 'featured',
        p_status_value: featured
      }),
      3,
      1000
    );

    if (error) {
      throw SupabaseError.fromPostgrestError(error);
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Bulk featured status update failed');
    }

    return data.products as Product[];
  } catch (error) {
    const { message } = handleError(error);
    console.error('Bulk featured status update failed:', error);
    throw new Error(`Failed to update featured status: ${message}`);
  }
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

/**
 * Batch processor for handling large bulk operations
 */
export class BulkOperationProcessor {
  private readonly BATCH_SIZE = 50;
  private readonly DELAY_MS = 100;
  
  async processBatches<T>(
    items: string[],
    operation: (batch: string[]) => Promise<T[]>,
    onProgress?: (current: number, total: number) => void
  ): Promise<T[]> {
    const results: T[] = [];
    const batches = this.chunkArray(items, this.BATCH_SIZE);
    let processedCount = 0;
    
    for (let i = 0; i < batches.length; i++) {
      try {
        const batchResults = await withRetry(
          () => operation(batches[i]),
          3,
          1000
        );
        results.push(...batchResults);
        
        processedCount += batches[i].length;
        if (onProgress) {
          onProgress(processedCount, items.length);
        }
        
        // Add delay between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await this.delay(this.DELAY_MS);
        }
      } catch (error) {
        // Log partial failure but continue
        console.error(`Batch ${i + 1} failed:`, error);
        throw new Error(`Partial failure at batch ${i + 1} of ${batches.length}: ${handleError(error).message}`);
      }
    }
    
    return results;
  }
  
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export processor instance
export const bulkProcessor = new BulkOperationProcessor();