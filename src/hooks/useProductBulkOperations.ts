'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queries/keys';
import { useSiteId } from '@/contexts/SiteContext';
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
  BulkUpdateData,
  BulkPriceUpdate,
  ProductExportData
} from '@/lib/queries/domains/products-bulk';
import { Product } from '@/lib/database/aliases';

/**
 * Hook for bulk updating products
 */
export function useBulkUpdateProducts() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productIds, updates }: { productIds: string[]; updates: BulkUpdateData }) =>
      bulkUpdateProducts(supabase, siteId!, productIds, updates),
    onMutate: async ({ productIds, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.all(siteId!) });
      
      const previousProducts = queryClient.getQueryData(queryKeys.products.all(siteId!));
      
      // Optimistically update products in cache
      queryClient.setQueryData(queryKeys.products.all(siteId!), (old: Product[] = []) =>
        old.map(product => 
          productIds.includes(product.id)
            ? { ...product, ...updates, updated_at: new Date().toISOString() }
            : product
        )
      );
      
      return { previousProducts };
    },
    onError: (err, variables, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products.all(siteId!), context.previousProducts);
      }
      toast.error('Failed to update products');
    },
    onSuccess: (data, { productIds }) => {
      toast.success(`Successfully updated ${productIds.length} product${productIds.length === 1 ? '' : 's'}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(siteId!) });
    },
  });
}

/**
 * Hook for bulk deleting products
 */
export function useBulkDeleteProducts() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productIds: string[]) =>
      bulkDeleteProducts(supabase, siteId!, productIds),
    onMutate: async (productIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.all(siteId!) });
      
      const previousProducts = queryClient.getQueryData(queryKeys.products.all(siteId!));
      
      // Optimistically remove products from cache
      queryClient.setQueryData(queryKeys.products.all(siteId!), (old: Product[] = []) =>
        old.filter(product => !productIds.includes(product.id))
      );
      
      return { previousProducts };
    },
    onError: (err, productIds, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products.all(siteId!), context.previousProducts);
      }
      toast.error('Failed to delete products');
    },
    onSuccess: (data, productIds) => {
      toast.success(`Successfully deleted ${productIds.length} product${productIds.length === 1 ? '' : 's'}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(siteId!) });
    },
  });
}

/**
 * Hook for bulk duplicating products
 */
export function useBulkDuplicateProducts() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productIds: string[]) =>
      bulkDuplicateProducts(supabase, siteId!, productIds),
    onSuccess: (data, productIds) => {
      toast.success(`Successfully duplicated ${productIds.length} product${productIds.length === 1 ? '' : 's'}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(siteId!) });
    },
    onError: () => {
      toast.error('Failed to duplicate products');
    },
  });
}

/**
 * Hook for bulk updating prices
 */
export function useBulkUpdatePrices() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productIds, priceUpdate }: { productIds: string[]; priceUpdate: BulkPriceUpdate }) =>
      bulkUpdatePrices(supabase, siteId!, productIds, priceUpdate),
    onSuccess: (data, { productIds }) => {
      toast.success(`Successfully updated prices for ${productIds.length} product${productIds.length === 1 ? '' : 's'}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(siteId!) });
    },
    onError: () => {
      toast.error('Failed to update prices');
    },
  });
}

/**
 * Hook for exporting products
 */
export function useExportProducts() {
  const siteId = useSiteId();

  return useMutation({
    mutationFn: async ({ productIds, filename = 'products' }: { productIds?: string[]; filename?: string }) => {
      const products = await exportProducts(supabase, siteId!, productIds);
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
    onError: () => {
      toast.error('Failed to export products');
    },
  });
}

/**
 * Hook for bulk activating products
 */
export function useBulkActivateProducts() {
  const bulkUpdate = useBulkUpdateProducts();

  return useMutation({
    mutationFn: (productIds: string[]) =>
      bulkUpdate.mutateAsync({ productIds, updates: { is_active: true } }),
    onSuccess: (data, productIds) => {
      toast.success(`Successfully activated ${productIds.length} product${productIds.length === 1 ? '' : 's'}`);
    },
  });
}

/**
 * Hook for bulk deactivating products
 */
export function useBulkDeactivateProducts() {
  const bulkUpdate = useBulkUpdateProducts();

  return useMutation({
    mutationFn: (productIds: string[]) =>
      bulkUpdate.mutateAsync({ productIds, updates: { is_active: false } }),
    onSuccess: (data, productIds) => {
      toast.success(`Successfully deactivated ${productIds.length} product${productIds.length === 1 ? '' : 's'}`);
    },
  });
}

/**
 * Hook for bulk setting featured status
 */
export function useBulkSetFeatured() {
  const bulkUpdate = useBulkUpdateProducts();

  return useMutation({
    mutationFn: ({ productIds, featured }: { productIds: string[]; featured: boolean }) =>
      bulkUpdate.mutateAsync({ productIds, updates: { is_featured: featured } }),
    onSuccess: (data, { productIds, featured }) => {
      const action = featured ? 'featured' : 'unfeatured';
      toast.success(`Successfully ${action} ${productIds.length} product${productIds.length === 1 ? '' : 's'}`);
    },
  });
}

/**
 * Hook for bulk updating category
 */
export function useBulkUpdateCategory() {
  const bulkUpdate = useBulkUpdateProducts();

  return useMutation({
    mutationFn: ({ productIds, category, subcategory }: { productIds: string[]; category: string; subcategory?: string }) => {
      const updates: BulkUpdateData = { category };
      if (subcategory) {
        updates.subcategory = subcategory;
      }
      return bulkUpdate.mutateAsync({ productIds, updates });
    },
    onSuccess: (data, { productIds, category }) => {
      toast.success(`Successfully updated category to "${category}" for ${productIds.length} product${productIds.length === 1 ? '' : 's'}`);
    },
  });
}

/**
 * Combined hook that provides all bulk operations
 */
export function useProductBulkOperations() {
  const bulkUpdate = useBulkUpdateProducts();
  const bulkDelete = useBulkDeleteProducts();
  const bulkDuplicate = useBulkDuplicateProducts();
  const bulkUpdatePrices = useBulkUpdatePrices();
  const exportProducts = useExportProducts();
  const bulkActivate = useBulkActivateProducts();
  const bulkDeactivate = useBulkDeactivateProducts();
  const bulkSetFeatured = useBulkSetFeatured();
  const bulkUpdateCategory = useBulkUpdateCategory();

  const isLoading = bulkUpdate.isPending || 
                    bulkDelete.isPending || 
                    bulkDuplicate.isPending || 
                    bulkUpdatePrices.isPending || 
                    exportProducts.isPending ||
                    bulkActivate.isPending ||
                    bulkDeactivate.isPending ||
                    bulkSetFeatured.isPending ||
                    bulkUpdateCategory.isPending;

  return {
    // Individual operations
    bulkUpdate,
    bulkDelete,
    bulkDuplicate,
    bulkUpdatePrices,
    exportProducts,
    bulkActivate,
    bulkDeactivate,
    bulkSetFeatured,
    bulkUpdateCategory,

    // Combined loading state
    isLoading,

    // Convenience methods
    updateProducts: bulkUpdate.mutate,
    deleteProducts: bulkDelete.mutate,
    duplicateProducts: bulkDuplicate.mutate,
    updatePrices: bulkUpdatePrices.mutate,
    export: exportProducts.mutate,
    activateProducts: bulkActivate.mutate,
    deactivateProducts: bulkDeactivate.mutate,
    setFeatured: bulkSetFeatured.mutate,
    updateCategory: bulkUpdateCategory.mutate,
  };
}