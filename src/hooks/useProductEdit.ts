'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queries/keys';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/contexts/SiteContext';
import { updateProduct } from '@/lib/queries/domains/products';
import { ProductUpdate, Product } from '@/lib/database/aliases';
import { handleError } from '@/lib/types/error-handling';

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
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, tagIds, ...data }: ProductEditData) => {
      if (!siteId) {
        throw new Error('Site ID is required for product editing');
      }
      return updateProduct(client, siteId, id, data, tagIds);
    },
    
    onMutate: async ({ id, tagIds, ...updates }) => {
      if (!siteId) return;
      
      // Cancel any outgoing refetches for this product
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: queryKeys.products.detail(siteId, id),
        }),
        queryClient.cancelQueries({
          queryKey: queryKeys.products.lists(siteId),
        }),
      ]);
      
      // Snapshot the previous values
      const previousProduct = queryClient.getQueryData<Product>(
        queryKeys.products.detail(siteId, id)
      );
      
      const previousProductsLists = queryClient.getQueriesData<any>({
        queryKey: queryKeys.products.lists(siteId),
      });
      
      // Optimistically update the product detail
      if (previousProduct) {
        const optimisticProduct: Product = {
          ...previousProduct,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        
        queryClient.setQueryData(
          queryKeys.products.detail(siteId, id),
          optimisticProduct
        );
      }
      
      // Optimistically update the product in all list queries
      queryClient.setQueriesData(
        { queryKey: queryKeys.products.lists(siteId) },
        (old: any) => {
          if (!old) return old;
          
          // Handle paginated response structure
          if (old.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: old.data.map((product: Product) =>
                product.id === id
                  ? { ...product, ...updates, updated_at: new Date().toISOString() }
                  : product
              ),
            };
          }
          
          // Handle simple array structure
          if (Array.isArray(old)) {
            return old.map((product: Product) =>
              product.id === id
                ? { ...product, ...updates, updated_at: new Date().toISOString() }
                : product
            );
          }
          
          return old;
        }
      );
      
      return { previousProduct, previousProductsLists };
    },
    
    onError: (error: unknown, { id }, context) => {
      if (!siteId || !context) return;
      
      // Rollback optimistic updates on error
      if (context.previousProduct) {
        queryClient.setQueryData(
          queryKeys.products.detail(siteId, id),
          context.previousProduct
        );
      }
      
      // Rollback list updates
      if (context.previousProductsLists) {
        context.previousProductsLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      const errorDetails = handleError(error);
      toast.error(`Failed to update product: ${errorDetails.message}`);
      console.error('Product edit error:', errorDetails);
    },
    
    onSuccess: (updatedProduct, { id }) => {
      if (!siteId) return;
      
      // Update the cache with the actual data from the server
      queryClient.setQueryData(
        queryKeys.products.detail(siteId, id),
        updatedProduct
      );
      
      // Update the product in all list queries with server data
      queryClient.setQueriesData(
        { queryKey: queryKeys.products.lists(siteId) },
        (old: any) => {
          if (!old) return old;
          
          // Handle paginated response structure
          if (old.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: old.data.map((product: Product) =>
                product.id === id ? updatedProduct : product
              ),
            };
          }
          
          // Handle simple array structure
          if (Array.isArray(old)) {
            return old.map((product: Product) =>
              product.id === id ? updatedProduct : product
            );
          }
          
          return old;
        }
      );
      
      toast.success('Product updated successfully');
    },
    
    onSettled: (data, error, { id }) => {
      if (!siteId) return;
      
      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(siteId, id),
      });
      
      // Invalidate lists to pick up any changes we might have missed
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.lists(siteId),
      });
      
      // If tags were updated, invalidate tag-related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.tags.byProduct(siteId, id),
      });
    },
  });
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
    
    updateProductPricing: (productId: string, price?: number, salePrice?: number, compareAtPrice?: number) =>
      editProduct.mutate({ 
        id: productId, 
        price, 
        sale_price: salePrice, 
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
    isEditing: editProduct.isPending,
  };
}

// Export types for consumers
export type { ProductEditData };