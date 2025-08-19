'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queries/keys';
import { useSiteId } from '@/contexts/SiteContext';
import { handleError } from '@/lib/types/error-handling';
import {
  bulkUpdateProducts,
  bulkDeleteProducts,
  bulkDuplicateProducts,
  bulkUpdatePrices,
  exportProducts,
  generateProductCSV,
  bulkActivateProducts,
  bulkDeactivateProducts,
  bulkSetFeatured,
  bulkUpdateCategory,
  bulkProcessor,
  BulkUpdateData,
  BulkPriceUpdate,
  ProductExportData
} from '@/lib/queries/domains/products-bulk';
import { Product } from '@/lib/database/aliases';
import { filterUndefined } from '@/lib/queries/base';

/**
 * Operation progress tracking interface
 */
export interface OperationProgress {
  current: number;
  total: number;
  operation: string;
  percentage: number;
}

/**
 * Hook for bulk updating products with progress tracking
 */
export function useBulkUpdateProducts() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  const [operationProgress, setOperationProgress] = useState<OperationProgress | null>(null);

  return useMutation({
    mutationFn: async ({ productIds, updates }: { productIds: string[]; updates: BulkUpdateData }) => {
      if (!siteId) throw new Error('Site ID is required');
      
      // Use batch processor for large operations
      if (productIds.length > 100) {
        setOperationProgress({ 
          current: 0, 
          total: productIds.length, 
          operation: 'Updating products',
          percentage: 0
        });
        
        return await bulkProcessor.processBatches(
          productIds,
          async (batch) => {
            const result = await bulkUpdateProducts(supabase, siteId, batch, updates);
            return result;
          },
          (current, total) => {
            setOperationProgress({
              current,
              total,
              operation: 'Updating products',
              percentage: Math.round((current / total) * 100)
            });
          }
        );
      }
      
      return await bulkUpdateProducts(supabase, siteId, productIds, updates);
    },
    onMutate: async ({ productIds, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.all(siteId!) });
      
      const previousProducts = queryClient.getQueryData(queryKeys.products.all(siteId!));
      
      // Validate we have the data to update
      if (!previousProducts) {
        console.warn('No cached products found for optimistic update');
        return { previousProducts: [] };
      }
      
      // Optimistically update products in cache
      queryClient.setQueryData(queryKeys.products.all(siteId!), (old: Product[] = []) =>
        old.map(product => 
          productIds.includes(product.id)
            ? { ...product, ...filterUndefined(updates), updated_at: new Date().toISOString() }
            : product
        )
      );
      
      return { previousProducts, productIds, updates };
    },
    onError: (error, variables, context) => {
      // Enhanced error handling with detailed logging
      console.error('Bulk update error:', {
        error,
        variables,
        context
      });
      
      // Rollback optimistic updates
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products.all(siteId!), context.previousProducts);
      }
      
      // Provide detailed error message
      const { message } = handleError(error);
      toast.error(`Failed to update products`, {
        description: `${message}. ${variables.productIds.length} product(s) were not updated.`
      });
    },
    onSuccess: (data, variables) => {
      // Verify the operation succeeded
      if (Array.isArray(data) && data.length !== variables.productIds.length) {
        console.warn('Partial update detected:', {
          expected: variables.productIds.length,
          actual: data.length
        });
        toast.warning(`Partially updated ${data.length} of ${variables.productIds.length} products`);
      } else {
        const count = Array.isArray(data) ? data.length : variables.productIds.length;
        toast.success(`Successfully updated ${count} product${count === 1 ? '' : 's'}`);
      }
    },
    onSettled: () => {
      // Clean up progress state
      setOperationProgress(null);
      
      // Always invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(siteId!) });
    },
  });
}

/**
 * Hook for bulk deleting products with enhanced error handling
 */
export function useBulkDeleteProducts() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  const [operationProgress, setOperationProgress] = useState<OperationProgress | null>(null);

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      if (!siteId) throw new Error('Site ID is required');
      
      // Use batch processor for large operations
      if (productIds.length > 100) {
        setOperationProgress({ 
          current: 0, 
          total: productIds.length, 
          operation: 'Deleting products',
          percentage: 0
        });
        
        await bulkProcessor.processBatches(
          productIds,
          async (batch) => {
            await bulkDeleteProducts(supabase, siteId, batch);
            return batch; // Return the batch for counting
          },
          (current, total) => {
            setOperationProgress({
              current,
              total,
              operation: 'Deleting products',
              percentage: Math.round((current / total) * 100)
            });
          }
        );
        return;
      }
      
      return await bulkDeleteProducts(supabase, siteId, productIds);
    },
    onMutate: async (productIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.all(siteId!) });
      
      const previousProducts = queryClient.getQueryData(queryKeys.products.all(siteId!));
      
      // Optimistically remove products from cache
      queryClient.setQueryData(queryKeys.products.all(siteId!), (old: Product[] = []) =>
        old.filter(product => !productIds.includes(product.id))
      );
      
      return { previousProducts, productIds };
    },
    onError: (error, productIds, context) => {
      console.error('Bulk delete error:', error);
      
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products.all(siteId!), context.previousProducts);
      }
      
      const { message } = handleError(error);
      toast.error('Failed to delete products', {
        description: `${message}. ${productIds.length} product(s) were not deleted.`
      });
    },
    onSuccess: (data, productIds) => {
      toast.success(`Successfully deleted ${productIds.length} product${productIds.length === 1 ? '' : 's'}`);
    },
    onSettled: () => {
      setOperationProgress(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(siteId!) });
    },
  });
}

/**
 * Hook for bulk duplicating products with progress tracking
 */
export function useBulkDuplicateProducts() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  const [operationProgress, setOperationProgress] = useState<OperationProgress | null>(null);

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      if (!siteId) throw new Error('Site ID is required');
      
      if (productIds.length > 50) {
        setOperationProgress({ 
          current: 0, 
          total: productIds.length, 
          operation: 'Duplicating products',
          percentage: 0
        });
        
        return await bulkProcessor.processBatches(
          productIds,
          async (batch) => {
            const result = await bulkDuplicateProducts(supabase, siteId, batch);
            return result;
          },
          (current, total) => {
            setOperationProgress({
              current,
              total,
              operation: 'Duplicating products',
              percentage: Math.round((current / total) * 100)
            });
          }
        );
      }
      
      return await bulkDuplicateProducts(supabase, siteId, productIds);
    },
    onSuccess: (data, productIds) => {
      const count = Array.isArray(data) ? data.length : productIds.length;
      toast.success(`Successfully duplicated ${count} product${count === 1 ? '' : 's'}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(siteId!) });
    },
    onError: (error) => {
      const { message } = handleError(error);
      toast.error('Failed to duplicate products', {
        description: message
      });
    },
    onSettled: () => {
      setOperationProgress(null);
    },
  });
}

/**
 * Hook for bulk updating prices with validation
 */
export function useBulkUpdatePrices() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  const [operationProgress, setOperationProgress] = useState<OperationProgress | null>(null);

  return useMutation({
    mutationFn: async ({ productIds, priceUpdate }: { productIds: string[]; priceUpdate: BulkPriceUpdate }) => {
      if (!siteId) throw new Error('Site ID is required');
      
      // Validate price update parameters
      if (priceUpdate.value < 0) {
        throw new Error('Price update value cannot be negative');
      }
      
      if (priceUpdate.type === 'percentage' && priceUpdate.value > 1000) {
        throw new Error('Percentage increase cannot exceed 1000%');
      }
      
      if (productIds.length > 100) {
        setOperationProgress({ 
          current: 0, 
          total: productIds.length, 
          operation: 'Updating prices',
          percentage: 0
        });
        
        return await bulkProcessor.processBatches(
          productIds,
          async (batch) => {
            const result = await bulkUpdatePrices(supabase, siteId, batch, priceUpdate);
            return result;
          },
          (current, total) => {
            setOperationProgress({
              current,
              total,
              operation: 'Updating prices',
              percentage: Math.round((current / total) * 100)
            });
          }
        );
      }
      
      return await bulkUpdatePrices(supabase, siteId, productIds, priceUpdate);
    },
    onSuccess: (data, { productIds, priceUpdate }) => {
      const count = Array.isArray(data) ? data.length : productIds.length;
      const action = priceUpdate.operation === 'increase' ? 'increased' : 'decreased';
      const amount = priceUpdate.type === 'percentage' ? `${priceUpdate.value}%` : `$${priceUpdate.value}`;
      
      toast.success(`Successfully ${action} prices by ${amount} for ${count} product${count === 1 ? '' : 's'}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(siteId!) });
    },
    onError: (error) => {
      const { message } = handleError(error);
      toast.error('Failed to update prices', {
        description: message
      });
    },
    onSettled: () => {
      setOperationProgress(null);
    },
  });
}

/**
 * Hook for exporting products with progress tracking
 */
export function useExportProducts() {
  const siteId = useSiteId();

  return useMutation({
    mutationFn: async ({ productIds, filename = 'products' }: { productIds?: string[]; filename?: string }) => {
      if (!siteId) throw new Error('Site ID is required');
      
      const products = await exportProducts(supabase, siteId, productIds);
      const csvContent = generateProductCSV(products);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      return { products, csvContent };
    },
    onSuccess: ({ products }, { productIds }) => {
      const count = productIds ? productIds.length : products.length;
      toast.success(`Successfully exported ${count} product${count === 1 ? '' : 's'} to CSV`);
    },
    onError: (error) => {
      const { message } = handleError(error);
      toast.error('Failed to export products', {
        description: message
      });
    },
  });
}

/**
 * Hook for bulk activating products
 */
export function useBulkActivateProducts() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      if (!siteId) throw new Error('Site ID is required');
      return await bulkActivateProducts(supabase, siteId, productIds);
    },
    onSuccess: (data, productIds) => {
      const count = Array.isArray(data) ? data.length : productIds.length;
      toast.success(`Successfully activated ${count} product${count === 1 ? '' : 's'}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(siteId!) });
    },
    onError: (error) => {
      const { message } = handleError(error);
      toast.error('Failed to activate products', {
        description: message
      });
    },
  });
}

/**
 * Hook for bulk deactivating products
 */
export function useBulkDeactivateProducts() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      if (!siteId) throw new Error('Site ID is required');
      return await bulkDeactivateProducts(supabase, siteId, productIds);
    },
    onSuccess: (data, productIds) => {
      const count = Array.isArray(data) ? data.length : productIds.length;
      toast.success(`Successfully deactivated ${count} product${count === 1 ? '' : 's'}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(siteId!) });
    },
    onError: (error) => {
      const { message } = handleError(error);
      toast.error('Failed to deactivate products', {
        description: message
      });
    },
  });
}

/**
 * Hook for bulk setting featured status
 */
export function useBulkSetFeatured() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productIds, featured }: { productIds: string[]; featured: boolean }) => {
      if (!siteId) throw new Error('Site ID is required');
      return await bulkSetFeatured(supabase, siteId, productIds, featured);
    },
    onSuccess: (data, { productIds, featured }) => {
      const count = Array.isArray(data) ? data.length : productIds.length;
      const action = featured ? 'featured' : 'unfeatured';
      toast.success(`Successfully ${action} ${count} product${count === 1 ? '' : 's'}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(siteId!) });
    },
    onError: (error) => {
      const { message } = handleError(error);
      toast.error('Failed to update featured status', {
        description: message
      });
    },
  });
}

/**
 * Hook for bulk updating category
 */
export function useBulkUpdateCategory() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productIds, category, subcategory }: { productIds: string[]; category: string; subcategory?: string }) => {
      if (!siteId) throw new Error('Site ID is required');
      return await bulkUpdateCategory(supabase, siteId, productIds, category, subcategory);
    },
    onSuccess: (data, { productIds, category }) => {
      const count = Array.isArray(data) ? data.length : productIds.length;
      toast.success(`Successfully updated category to "${category}" for ${count} product${count === 1 ? '' : 's'}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(siteId!) });
    },
    onError: (error) => {
      const { message } = handleError(error);
      toast.error('Failed to update category', {
        description: message
      });
    },
  });
}

/**
 * Combined hook that provides all bulk operations with progress tracking
 */
export function useProductBulkOperations(siteId: string | null) {
  const bulkUpdate = useBulkUpdateProducts();
  const bulkDelete = useBulkDeleteProducts();
  const bulkDuplicate = useBulkDuplicateProducts();
  const bulkUpdatePricesHook = useBulkUpdatePrices();
  const exportProductsHook = useExportProducts();
  const bulkActivate = useBulkActivateProducts();
  const bulkDeactivate = useBulkDeactivateProducts();
  const bulkSetFeaturedHook = useBulkSetFeatured();
  const bulkUpdateCategoryHook = useBulkUpdateCategory();

  // Aggregate operation progress
  const operationProgress = 
    bulkUpdate.isPending ? (bulkUpdate as any).operationProgress :
    bulkDelete.isPending ? (bulkDelete as any).operationProgress :
    bulkDuplicate.isPending ? (bulkDuplicate as any).operationProgress :
    bulkUpdatePricesHook.isPending ? (bulkUpdatePricesHook as any).operationProgress :
    null;

  const isLoading = bulkUpdate.isPending || 
                    bulkDelete.isPending || 
                    bulkDuplicate.isPending || 
                    bulkUpdatePricesHook.isPending || 
                    exportProductsHook.isPending ||
                    bulkActivate.isPending ||
                    bulkDeactivate.isPending ||
                    bulkSetFeaturedHook.isPending ||
                    bulkUpdateCategoryHook.isPending;

  return {
    // Individual operations
    bulkUpdate,
    bulkDelete,
    bulkDuplicate,
    bulkUpdatePrices: bulkUpdatePricesHook,
    exportProducts: exportProductsHook,
    bulkActivate,
    bulkDeactivate,
    bulkSetFeatured: bulkSetFeaturedHook,
    bulkUpdateCategory: bulkUpdateCategoryHook,

    // Combined loading state
    isLoading,

    // Operation progress
    operationProgress,

    // Convenience methods
    updateProducts: bulkUpdate.mutate,
    deleteProducts: bulkDelete.mutate,
    duplicateProducts: bulkDuplicate.mutate,
    updatePrices: bulkUpdatePricesHook.mutate,
    export: exportProductsHook.mutate,
    activateProducts: bulkActivate.mutate,
    deactivateProducts: bulkDeactivate.mutate,
    setFeatured: bulkSetFeaturedHook.mutate,
    updateCategory: bulkUpdateCategoryHook.mutate,
  };
}