'use client';

import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { toast } from 'sonner';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
import { updateProduct } from '@/src/lib/queries/domains/products';
import { ProductUpdate, Product } from '@/src/lib/database/aliases';
import { handleError } from '@/src/lib/types/error-handling';

interface ProductEditData extends ProductUpdate {
  id: string;
  tagIds?: string[];
}

/**
 * Hook for editing products with optimistic updates
 * Provides immediate UI feedback while maintaining data consistency
 */
export function useProductEdit() {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async ({ id, tagIds, ...data }: ProductEditData, signal: AbortSignal) => {
      if (!siteId) {
        throw new Error('Site ID is required for product editing');
      }
      return updateProduct(client, siteId, id, data, tagIds);
    },
    {
      showSuccessToast: 'Product updated successfully'
    }
  );
}

/**
 * Convenience hook that provides additional utility methods
 * and manages loading states across multiple operations
 */
export function useProductEditManager() {
  const editProduct = useProductEdit();
  
  return {
    ...editProduct,
    
    // Convenience methods
    updateProductField: (productId: string, field: keyof ProductUpdate, value: any) =>
      editProduct.mutate({ id: productId, [field]: value }),
    
    updateProductTags: (productId: string, tagIds: string[]) =>
      editProduct.mutate({ id: productId, tagIds }),
    
    toggleProductFeature: (productId: string, featured: boolean) =>
      editProduct.mutate({ id: productId, is_featured: featured }),
    
    toggleProductActive: (productId: string, active: boolean) =>
      editProduct.mutate({ id: productId, is_active: active }),

    updateProductPricing: (productId: string, price?: number, compareAtPrice?: number) =>
      editProduct.mutate({
        id: productId,
        price,
        compare_at_price: compareAtPrice
      }),
    
    updateProductInventory: (productId: string, inventoryCount: number, lowStockThreshold?: number) =>
      editProduct.mutate({ 
        id: productId, 
        inventory_count: inventoryCount,
        low_stock_threshold: lowStockThreshold,
        in_stock: inventoryCount > 0 
      }),
    
    // Loading state for any product edit operation
    isEditing: editProduct.loading,
  };
}

// Export types for consumers
export type { ProductEditData };