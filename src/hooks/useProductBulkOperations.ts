'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { useSiteId } from '@/src/contexts/SiteContext';
import { handleError } from '@/lib/types/error-handling';
import {
  bulkUpdateProducts,
  bulkDeleteProducts,
  bulkDuplicateProducts,
  bulkUpdatePrices,
  exportProducts,
  generateProductCSV,
  importProducts,
  bulkActivateProducts,
  bulkDeactivateProducts,
  bulkSetFeatured,
  bulkUpdateCategory,
  bulkProcessor,
  BulkUpdateData,
  BulkPriceUpdate,
  ProductExportData,
  ImportResult
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
  const [operationProgress, setOperationProgress] = useState<OperationProgress | null>(null);

  return useSupabaseMutation(
    async (variables: { productIds: string[]; updates: BulkUpdateData }, signal) => {
      const { productIds, updates } = variables;
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
    {
      optimisticUpdate: (variables) => {
        // Clear related localStorage caches
        const patterns = [`products_${siteId}_`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onSuccess: (data, variables) => {
        // Clean up progress state
        setOperationProgress(null);
        
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
        
        // Clear related localStorage caches on success
        const patterns = [`products_${siteId}_`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error, variables) => {
        // Clean up progress state
        setOperationProgress(null);
        
        // Enhanced error handling with detailed logging
        console.error('Bulk update error:', {
          error,
          variables
        });
        
        // Provide detailed error message
        const { message } = handleError(error);
        toast.error(`Failed to update products`, {
          description: `${message}. ${variables.productIds.length} product(s) were not updated.`
        });
      },
      showSuccessToast: false, // We handle our own success messages
    }
  );
}

/**
 * Hook for bulk deleting products with enhanced error handling
 */
export function useBulkDeleteProducts() {
  const siteId = useSiteId();
  const [operationProgress, setOperationProgress] = useState<OperationProgress | null>(null);

  return useSupabaseMutation(
    async (productIds: string[], signal) => {
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
    {
      optimisticUpdate: (productIds) => {
        // Clear related localStorage caches
        const patterns = [`products_${siteId}_`, `product_categories_${siteId}`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
        
        // Also clear individual product caches
        productIds.forEach(productId => {
          const productKey = `product_${siteId}_${productId}`;
          localStorage.removeItem(productKey);
        });
      },
      onSuccess: (data, productIds) => {
        setOperationProgress(null);
        toast.success(`Successfully deleted ${productIds.length} product${productIds.length === 1 ? '' : 's'}`);
        
        // Clear related localStorage caches on success
        const patterns = [`products_${siteId}_`, `product_categories_${siteId}`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
        
        // Also clear individual product caches
        productIds.forEach(productId => {
          const productKey = `product_${siteId}_${productId}`;
          localStorage.removeItem(productKey);
        });
      },
      onError: (error, productIds) => {
        setOperationProgress(null);
        console.error('Bulk delete error:', error);
        
        const { message } = handleError(error);
        toast.error('Failed to delete products', {
          description: `${message}. ${productIds.length} product(s) were not deleted.`
        });
      },
      showSuccessToast: false, // We handle our own success messages
    }
  );
}

/**
 * Hook for bulk duplicating products with progress tracking
 */
export function useBulkDuplicateProducts() {
  const siteId = useSiteId();
  const [operationProgress, setOperationProgress] = useState<OperationProgress | null>(null);

  return useSupabaseMutation(
    async (productIds: string[], signal) => {
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
    {
      onSuccess: (data, productIds) => {
        setOperationProgress(null);
        const count = Array.isArray(data) ? data.length : productIds.length;
        toast.success(`Successfully duplicated ${count} product${count === 1 ? '' : 's'}`);
        
        // Clear related localStorage caches on success
        const patterns = [`products_${siteId}_`, `product_categories_${siteId}`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error) => {
        setOperationProgress(null);
        const { message } = handleError(error);
        toast.error('Failed to duplicate products', {
          description: message
        });
      },
      showSuccessToast: false, // We handle our own success messages
    }
  );
}

/**
 * Hook for bulk updating prices with validation
 */
export function useBulkUpdatePrices() {
  const siteId = useSiteId();
  const [operationProgress, setOperationProgress] = useState<OperationProgress | null>(null);

  return useSupabaseMutation(
    async (variables: { productIds: string[]; priceUpdate: BulkPriceUpdate }, signal) => {
      const { productIds, priceUpdate } = variables;
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
    {
      onSuccess: (data, variables) => {
        setOperationProgress(null);
        const { productIds, priceUpdate } = variables;
        const count = Array.isArray(data) ? data.length : productIds.length;
        const action = priceUpdate.operation === 'increase' ? 'increased' : 'decreased';
        const amount = priceUpdate.type === 'percentage' ? `${priceUpdate.value}%` : `$${priceUpdate.value}`;
        
        toast.success(`Successfully ${action} prices by ${amount} for ${count} product${count === 1 ? '' : 's'}`);
        
        // Clear related localStorage caches on success
        const patterns = [`products_${siteId}_`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error) => {
        setOperationProgress(null);
        const { message } = handleError(error);
        toast.error('Failed to update prices', {
          description: message
        });
      },
      showSuccessToast: false, // We handle our own success messages
    }
  );
}

/**
 * Hook for exporting products with progress tracking
 */
export function useExportProducts() {
  const siteId = useSiteId();

  return useSupabaseMutation(
    async (variables: { productIds?: string[]; filename?: string }, signal) => {
      const { productIds, filename = 'products' } = variables;
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
    {
      onSuccess: (data, variables) => {
        const { products } = data;
        const { productIds } = variables;
        const count = productIds ? productIds.length : products.length;
        toast.success(`Successfully exported ${count} product${count === 1 ? '' : 's'} to CSV`);
      },
      onError: (error) => {
        const { message } = handleError(error);
        toast.error('Failed to export products', {
          description: message
        });
      },
      showSuccessToast: false, // We handle our own success messages
    }
  );
}

/**
 * Hook for importing products from CSV
 */
export function useImportProducts() {
  const siteId = useSiteId();

  return useSupabaseMutation(
    async (csvText: string, signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return await importProducts(supabase, siteId, csvText);
    },
    {
      onSuccess: (result: ImportResult) => {
        if (result.successful > 0) {
          toast.success(
            `Successfully imported ${result.successful} product${result.successful === 1 ? '' : 's'}`,
            {
              description: result.failed > 0
                ? `${result.failed} product${result.failed === 1 ? '' : 's'} failed to import`
                : undefined
            }
          );
        }

        if (result.failed > 0 && result.successful === 0) {
          toast.error(`Failed to import ${result.failed} product${result.failed === 1 ? '' : 's'}`, {
            description: 'Check the error details for more information'
          });
        }

        // Clear related localStorage caches on success
        const patterns = [`products_${siteId}_`, `product_categories_${siteId}`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error) => {
        const { message } = handleError(error);
        toast.error('Failed to import products', {
          description: message
        });
      },
      showSuccessToast: false, // We handle our own success messages
    }
  );
}

/**
 * Hook for bulk activating products
 */
export function useBulkActivateProducts() {
  const siteId = useSiteId();

  return useSupabaseMutation(
    async (productIds: string[], signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return await bulkActivateProducts(supabase, siteId, productIds);
    },
    {
      onSuccess: (data, productIds) => {
        const count = Array.isArray(data) ? data.length : productIds.length;
        toast.success(`Successfully activated ${count} product${count === 1 ? '' : 's'}`);
        
        // Clear related localStorage caches on success
        const patterns = [`products_${siteId}_`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error) => {
        const { message } = handleError(error);
        toast.error('Failed to activate products', {
          description: message
        });
      },
      showSuccessToast: false, // We handle our own success messages
    }
  );
}

/**
 * Hook for bulk deactivating products
 */
export function useBulkDeactivateProducts() {
  const siteId = useSiteId();

  return useSupabaseMutation(
    async (productIds: string[], signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return await bulkDeactivateProducts(supabase, siteId, productIds);
    },
    {
      onSuccess: (data, productIds) => {
        const count = Array.isArray(data) ? data.length : productIds.length;
        toast.success(`Successfully deactivated ${count} product${count === 1 ? '' : 's'}`);
        
        // Clear related localStorage caches on success
        const patterns = [`products_${siteId}_`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error) => {
        const { message } = handleError(error);
        toast.error('Failed to deactivate products', {
          description: message
        });
      },
      showSuccessToast: false, // We handle our own success messages
    }
  );
}

/**
 * Hook for bulk setting featured status
 */
export function useBulkSetFeatured() {
  const siteId = useSiteId();

  return useSupabaseMutation(
    async (variables: { productIds: string[]; featured: boolean }, signal) => {
      const { productIds, featured } = variables;
      if (!siteId) throw new Error('Site ID is required');
      return await bulkSetFeatured(supabase, siteId, productIds, featured);
    },
    {
      onSuccess: (data, variables) => {
        const { productIds, featured } = variables;
        const count = Array.isArray(data) ? data.length : productIds.length;
        const action = featured ? 'featured' : 'unfeatured';
        toast.success(`Successfully ${action} ${count} product${count === 1 ? '' : 's'}`);
        
        // Clear related localStorage caches on success
        const patterns = [`products_${siteId}_`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error) => {
        const { message } = handleError(error);
        toast.error('Failed to update featured status', {
          description: message
        });
      },
      showSuccessToast: false, // We handle our own success messages
    }
  );
}

/**
 * Hook for bulk updating category
 */
export function useBulkUpdateCategory() {
  const siteId = useSiteId();

  return useSupabaseMutation(
    async (variables: { productIds: string[]; category: string; subcategory?: string }, signal) => {
      const { productIds, category, subcategory } = variables;
      if (!siteId) throw new Error('Site ID is required');
      return await bulkUpdateCategory(supabase, siteId, productIds, category, subcategory);
    },
    {
      onSuccess: (data, variables) => {
        const { productIds, category } = variables;
        const count = Array.isArray(data) ? data.length : productIds.length;
        toast.success(`Successfully updated category to "${category}" for ${count} product${count === 1 ? '' : 's'}`);
        
        // Clear related localStorage caches on success
        const patterns = [`products_${siteId}_`, `product_categories_${siteId}`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error) => {
        const { message } = handleError(error);
        toast.error('Failed to update category', {
          description: message
        });
      },
      showSuccessToast: false, // We handle our own success messages
    }
  );
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
  const importProductsHook = useImportProducts();
  const bulkActivate = useBulkActivateProducts();
  const bulkDeactivate = useBulkDeactivateProducts();
  const bulkSetFeaturedHook = useBulkSetFeatured();
  const bulkUpdateCategoryHook = useBulkUpdateCategory();

  // Aggregate operation progress
  const operationProgress =
    bulkUpdate.loading ? (bulkUpdate as any).operationProgress :
    bulkDelete.loading ? (bulkDelete as any).operationProgress :
    bulkDuplicate.loading ? (bulkDuplicate as any).operationProgress :
    bulkUpdatePricesHook.loading ? (bulkUpdatePricesHook as any).operationProgress :
    null;

  const isLoading = bulkUpdate.loading ||
                    bulkDelete.loading ||
                    bulkDuplicate.loading ||
                    bulkUpdatePricesHook.loading ||
                    exportProductsHook.loading ||
                    importProductsHook.loading ||
                    bulkActivate.loading ||
                    bulkDeactivate.loading ||
                    bulkSetFeaturedHook.loading ||
                    bulkUpdateCategoryHook.loading;

  return {
    // Individual operations
    bulkUpdate,
    bulkDelete,
    bulkDuplicate,
    bulkUpdatePrices: bulkUpdatePricesHook,
    exportProducts: exportProductsHook,
    importProducts: importProductsHook,
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
    import: importProductsHook.mutate,
    activateProducts: bulkActivate.mutate,
    deactivateProducts: bulkDeactivate.mutate,
    setFeatured: bulkSetFeaturedHook.mutate,
    updateCategory: bulkUpdateCategoryHook.mutate,
  };
}