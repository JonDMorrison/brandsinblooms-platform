'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/src/lib/supabase/client';
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  getProductCategories,
  updateProductInventory,
  checkSkuAvailability,
  generateUniqueSlug,
  ProductFilters
} from '@/src/lib/queries/domains/products';
import { checkAndCreateLowStockNotification } from '../../app/actions/low-stock-notification';
import { useSiteId } from '@/src/contexts/SiteContext';
import { Product, ProductInsert, ProductUpdate } from '@/src/lib/database/aliases';
import { stableSerialize } from '@/src/lib/utils/cache-key';

// Main products query hook
export function useProducts(filters?: ProductFilters) {
  const siteId = useSiteId();

  const cacheKey = `products_${siteId}_${stableSerialize(filters || {})}`;

  return useSupabaseQuery(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return getProducts(supabase, siteId, filters);
    },
    {
      enabled: !!siteId,
      persistKey: cacheKey,
      staleTime: 5 * 60 * 1000, // 5 minutes for better performance
      onError: (error) => {
      },
    },
    [siteId, filters] // Re-fetch when siteId or filters change
  );
}

// Featured products query hook - fetches products marked as featured
export function useFeaturedProducts(limit: number = 4) {
  const siteId = useSiteId();

  const filters: ProductFilters = {
    featured: true,
    active: true, // Only show active products
    limit,
    sortBy: 'created_at',
    sortOrder: 'desc', // Newest featured products first
  };

  const cacheKey = `featured_products_${siteId}_${limit}`;

  return useSupabaseQuery(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return getProducts(supabase, siteId, filters);
    },
    {
      enabled: !!siteId,
      persistKey: cacheKey,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
      },
    },
    [siteId, limit] // Re-fetch when siteId or limit changes
  );
}

// Get single product
export function useProduct(productId: string) {
  const siteId = useSiteId();
  
  const cacheKey = `product_${siteId}_${productId}`;
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId || !productId) throw new Error('Site ID and Product ID are required');
      return getProductById(supabase, siteId, productId);
    },
    {
      enabled: !!siteId && !!productId,
      persistKey: cacheKey,
      onError: (error) => {
      },
    },
    [siteId, productId] // Re-fetch when siteId or productId changes
  );
}

// Get products by category
export function useProductsByCategory(category: string) {
  const siteId = useSiteId();
  
  const cacheKey = `products_category_${siteId}_${category}`;
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId || !category) throw new Error('Site ID and Category are required');
      return getProductsByCategory(supabase, siteId, category);
    },
    {
      enabled: !!siteId && !!category,
      persistKey: cacheKey,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
      },
    },
    [siteId, category] // Re-fetch when siteId or category changes
  );
}

// Search products
export function useSearchProducts(searchQuery: string) {
  const siteId = useSiteId();
  
  const cacheKey = `products_search_${siteId}_${searchQuery}`;
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId || searchQuery.length <= 2) throw new Error('Site ID is required and search query must be longer than 2 characters');
      return searchProducts(supabase, siteId, searchQuery);
    },
    {
      enabled: !!siteId && searchQuery.length > 2,
      persistKey: cacheKey,
      staleTime: 10 * 1000,
      onError: (error) => {
      },
    },
    [siteId, searchQuery] // Re-fetch when siteId or searchQuery changes
  );
}

// Get product categories
export function useProductCategories() {
  const siteId = useSiteId();
  
  const cacheKey = `product_categories_${siteId}`;
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return getProductCategories(supabase, siteId);
    },
    {
      enabled: !!siteId,
      persistKey: cacheKey,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
      },
    },
    [siteId] // Re-fetch when siteId changes
  );
}

// Create product mutation
export function useCreateProduct() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async (data: Omit<ProductInsert, 'site_id'>, signal) => {
      if (!siteId) {
        throw new Error('Site ID is required for product creation');
      }
      return createProduct(supabase, { ...data, site_id: siteId });
    },
    {
      showSuccessToast: false, // Toast shown in CreateProductModal after image association
      optimisticUpdate: (newProduct) => {
        // Clear related localStorage caches
        const patterns = [`products_${siteId}_`, `product_categories_${siteId}`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onSuccess: async (newProduct) => {
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
      },
    }
  );
}

// Update product mutation
export function useUpdateProduct() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async (variables: ProductUpdate & { id: string }, signal) => {
      const { id, ...data } = variables;
      return updateProduct(supabase, siteId!, id, data);
    },
    {
      showSuccessToast: 'Product updated successfully',
      optimisticUpdate: (variables) => {
        // Clear related localStorage caches
        const patterns = [`products_${siteId}_`, `product_${siteId}_${variables.id}`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onSuccess: async (updatedProduct, variables) => {
        // Check for low stock notification after successful update
        if (updatedProduct && variables.inventory_count !== undefined) {
          try {
            // Get previous product data if needed for comparison
            const cacheKey = `product_${siteId}_${variables.id}`;
            const storedProduct = localStorage.getItem(cacheKey);
            let previousStock = 0;
            
            if (storedProduct) {
              try {
                const parsed = JSON.parse(storedProduct);
                previousStock = parsed.data?.inventory_count || 0;
              } catch {
                // Ignore parse errors
              }
            }
            
            const currentStock = updatedProduct.inventory_count || 0;
            await checkAndCreateLowStockNotification(siteId!, updatedProduct, currentStock, previousStock);
          } catch (error) {
          }
        }
        
        // Clear related localStorage caches on success
        const patterns = [`products_${siteId}_`, `product_${siteId}_${variables.id}`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error) => {
      },
    }
  );
}

// Update inventory mutation
export function useUpdateInventory() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async (variables: { productId: string; quantity: number }, signal) => {
      return updateProductInventory(supabase, variables.productId, variables.quantity);
    },
    {
      showSuccessToast: 'Inventory updated successfully',
      optimisticUpdate: (variables) => {
        // Clear related localStorage caches
        const patterns = [`products_${siteId}_`, `product_${siteId}_${variables.productId}`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onSuccess: async (updatedProduct, variables) => {
        // Check for low stock notification after successful inventory update
        if (updatedProduct) {
          try {
            // Get previous product data if needed for comparison
            const cacheKey = `product_${siteId}_${variables.productId}`;
            const storedProduct = localStorage.getItem(cacheKey);
            let previousStock = 0;
            
            if (storedProduct) {
              try {
                const parsed = JSON.parse(storedProduct);
                previousStock = parsed.data?.inventory_count || 0;
              } catch {
                // Ignore parse errors
              }
            }
            
            const currentStock = variables.quantity;
            await checkAndCreateLowStockNotification(siteId!, updatedProduct, currentStock, previousStock);
          } catch (error) {
          }
        }
        
        // Clear related localStorage caches on success
        const patterns = [`products_${siteId}_`, `product_${siteId}_${variables.productId}`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error) => {
      },
    }
  );
}

// Delete product mutation
export function useDeleteProduct() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async (id: string, signal) => {
      return deleteProduct(supabase, siteId!, id);
    },
    {
      showSuccessToast: 'Product deleted successfully',
      optimisticUpdate: (productId) => {
        // Clear related localStorage caches
        const patterns = [`products_${siteId}_`, `product_${siteId}_${productId}`, `product_categories_${siteId}`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onSuccess: (data, productId) => {
        // Clear related localStorage caches on success
        const patterns = [`products_${siteId}_`, `product_${siteId}_${productId}`, `product_categories_${siteId}`];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error) => {
      },
    }
  );
}

// Real-time inventory updates
export function useProductInventoryRealtime() {
  const siteId = useSiteId();
  
  useEffect(() => {
    if (!siteId) return;
    
    const channel = supabase
      .channel(`products-${siteId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `site_id=eq.${siteId}`,
        },
        async (payload) => {
          // Only handle inventory changes
          if (payload.old.inventory_count !== payload.new.inventory_count) {
            // Clear relevant localStorage caches
            const patterns = [`products_${siteId}_`, `product_${siteId}_${payload.new.id}`];
            patterns.forEach(pattern => {
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith(pattern)) {
                  localStorage.removeItem(key);
                }
              });
            });
            
            // Check for low stock notification on real-time updates
            const currentStock = payload.new.inventory_count || 0;
            const previousStock = payload.old.inventory_count || 0;
            const product = payload.new as Product;
            
            try {
              await checkAndCreateLowStockNotification(siteId, product, currentStock, previousStock);
            } catch (error) {
            }
            
            toast.info(`Inventory updated for ${payload.new.name}`);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [siteId]);
}

// SKU validation hook
export function useSkuValidation() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async (variables: { sku: string; excludeId?: string }, signal) => {
      const { sku, excludeId } = variables;
      if (!siteId || !sku) {
        return true;
      }
      const result = await checkSkuAvailability(supabase, siteId, sku, excludeId);
      return result;
    },
    {
      showSuccessToast: false,
      showErrorToast: false,
      onError: (error) => {
      },
    }
  );
}

// Slug generation hook
export function useSlugGeneration() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async (name: string, signal) => {
      if (!siteId || !name) {
        return '';
      }
      const result = await generateUniqueSlug(supabase, name, siteId);
      return result;
    },
    {
      showSuccessToast: false,
      showErrorToast: false,
      onError: (error) => {
      },
    }
  );
}