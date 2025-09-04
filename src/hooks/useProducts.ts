'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queries/keys';
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
} from '@/lib/queries/domains/products';
import { checkAndCreateLowStockNotification } from '../../app/actions/low-stock-notification';
import { useSiteId } from '@/src/contexts/SiteContext';
import { Product, ProductInsert, ProductUpdate } from '@/lib/database/aliases';

// Main products query hook
export function useProducts(filters?: ProductFilters) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.products.list(siteId!, filters),
    queryFn: () => getProducts(supabase, siteId!, filters),
    enabled: !!siteId,
    staleTime: 30 * 1000,
  });
}

// Get single product
export function useProduct(productId: string) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.products.detail(siteId!, productId),
    queryFn: () => getProductById(supabase, siteId!, productId),
    enabled: !!siteId && !!productId,
  });
}

// Get products by category
export function useProductsByCategory(category: string) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.products.list(siteId!, { category }),
    queryFn: () => getProductsByCategory(supabase, siteId!, category),
    enabled: !!siteId && !!category,
    staleTime: 30 * 1000,
  });
}

// Search products
export function useSearchProducts(searchQuery: string) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.products.list(siteId!, { search: searchQuery }),
    queryFn: () => searchProducts(supabase, siteId!, searchQuery),
    enabled: !!siteId && searchQuery.length > 2,
    staleTime: 10 * 1000,
  });
}

// Get product categories
export function useProductCategories() {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.products.categories(siteId!),
    queryFn: () => getProductCategories(supabase, siteId!),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create product mutation
export function useCreateProduct() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<ProductInsert, 'site_id'>) => {
      console.log('🏭 useCreateProduct mutation called with:', { data, siteId });
      if (!siteId) {
        console.error('❌ Create product: siteId is missing!');
        throw new Error('Site ID is required for product creation');
      }
      console.log('🔄 Calling createProduct function...');
      return createProduct(supabase, { ...data, site_id: siteId });
    },
    onMutate: async (newProduct) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.products.lists(siteId!) });
      
      // Snapshot the previous value
      const previousProducts = queryClient.getQueriesData({ queryKey: queryKeys.products.lists(siteId!) });
      
      // Optimistically update to the new value
      const tempProduct = {
        ...newProduct,
        id: crypto.randomUUID(),
        site_id: siteId!,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Product;
      
      queryClient.setQueriesData(
        { queryKey: queryKeys.products.lists(siteId!) },
        (old: any) => {
          if (!old) {
            return {
              data: [tempProduct],
              count: 1,
              page: 1,
              pageSize: 12,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false
            };
          }
          
          if (old.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: [tempProduct, ...old.data],
              count: old.count + 1,
              totalPages: Math.ceil((old.count + 1) / old.pageSize)
            };
          }
          
          if (Array.isArray(old)) {
            return [tempProduct, ...old];
          }
          
          return old;
        }
      );
      
      return { previousProducts };
    },
    onError: (err, newProduct, context) => {
      // Rollback the optimistic update on error
      if (context?.previousProducts) {
        context.previousProducts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to create product');
    },
    onSuccess: (newProduct) => {
      // Update the cache with the actual product from the server
      // Handle the paginated response structure properly
      queryClient.setQueriesData(
        { queryKey: queryKeys.products.lists(siteId!) },
        (old: any) => {
          if (!old) {
            // If no existing data, create a new paginated response
            return {
              data: [newProduct],
              count: 1,
              page: 1,
              pageSize: 12,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false
            };
          }
          
          // If it's a paginated response, add the new product to the beginning
          if (old.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: [newProduct, ...old.data],
              count: old.count + 1,
              totalPages: Math.ceil((old.count + 1) / old.pageSize)
            };
          }
          
          // If it's just an array (shouldn't happen but handle it)
          if (Array.isArray(old)) {
            return [newProduct, ...old];
          }
          
          return old;
        }
      );
      
      toast.success('Product created successfully');
    },
    onSettled: () => {
      // Invalidate and refetch immediately
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.all(siteId!),
        refetchType: 'all' 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.list(siteId!),
        refetchType: 'all' 
      });
    },
  });
}

// Update product mutation
export function useUpdateProduct() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: ProductUpdate & { id: string }) => 
      updateProduct(supabase, siteId!, id, data),
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.detail(siteId!, id) });
      
      const previousProduct = queryClient.getQueryData(queryKeys.products.detail(siteId!, id));
      
      queryClient.setQueryData(queryKeys.products.detail(siteId!, id), (old: Product) => ({
        ...old,
        ...updates,
        updated_at: new Date().toISOString(),
      }));
      
      // Also update in list
      queryClient.setQueryData(queryKeys.products.all(siteId!), (old: Product[] = []) => 
        old.map(product => 
          product.id === id 
            ? { ...product, ...updates, updated_at: new Date().toISOString() }
            : product
        )
      );
      
      return { previousProduct };
    },
    onError: (err, variables, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(
          queryKeys.products.detail(siteId!, variables.id), 
          context.previousProduct
        );
      }
      toast.error('Failed to update product');
    },
    onSuccess: async (updatedProduct, variables, context) => {
      // Check for low stock notification after successful update
      if (updatedProduct && context?.previousProduct) {
        const previousProduct = context.previousProduct as Product;
        const currentStock = updatedProduct.inventory_count || 0;
        const previousStock = previousProduct.inventory_count || 0;
        
        // Only send notification if inventory was updated and crossed threshold
        if (variables.inventory_count !== undefined) {
          try {
            await checkAndCreateLowStockNotification(siteId!, updatedProduct, currentStock, previousStock);
          } catch (error) {
            console.error('Failed to create low stock notification:', error);
          }
        }
      }
      
      toast.success('Product updated successfully');
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(siteId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(siteId!, variables.id) });
    },
  });
}

// Update inventory mutation
export function useUpdateInventory() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) => 
      updateProductInventory(supabase, productId, quantity),
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.detail(siteId!, productId) });
      
      const previousProduct = queryClient.getQueryData(queryKeys.products.detail(siteId!, productId));
      
      queryClient.setQueryData(queryKeys.products.detail(siteId!, productId), (old: Product) => ({
        ...old,
        inventory_count: quantity,
        updated_at: new Date().toISOString(),
      }));
      
      return { previousProduct, productId };
    },
    onError: (err, variables, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(
          queryKeys.products.detail(siteId!, context.productId), 
          context.previousProduct
        );
      }
      toast.error('Failed to update inventory');
    },
    onSuccess: async (updatedProduct, variables, context) => {
      // Check for low stock notification after successful inventory update
      if (updatedProduct && context?.previousProduct) {
        const previousProduct = context.previousProduct as Product;
        const currentStock = variables.quantity;
        const previousStock = previousProduct.inventory_count || 0;
        
        try {
          await checkAndCreateLowStockNotification(siteId!, updatedProduct, currentStock, previousStock);
        } catch (error) {
          console.error('Failed to create low stock notification:', error);
        }
      }
      
      toast.success('Inventory updated successfully');
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(siteId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(siteId!, variables.productId) });
    },
  });
}

// Delete product mutation
export function useDeleteProduct() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteProduct(supabase, siteId!, id),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.all(siteId!) });
      
      const previousProducts = queryClient.getQueryData(queryKeys.products.all(siteId!));
      
      queryClient.setQueryData(queryKeys.products.all(siteId!), (old: Product[] = []) => 
        old.filter(product => product.id !== productId)
      );
      
      return { previousProducts };
    },
    onError: (err, productId, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products.all(siteId!), context.previousProducts);
      }
      toast.error('Failed to delete product');
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(siteId!) });
    },
  });
}

// Real-time inventory updates
export function useProductInventoryRealtime() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
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
          // Only invalidate if inventory changed
          if (payload.old.inventory_count !== payload.new.inventory_count) {
            queryClient.invalidateQueries({ 
              queryKey: queryKeys.products.detail(siteId, payload.new.id) 
            });
            
            // Update in list as well
            queryClient.setQueryData(queryKeys.products.all(siteId), (old: Product[] = []) => 
              old.map(product => 
                product.id === payload.new.id 
                  ? { ...product, ...payload.new }
                  : product
              )
            );
            
            // Check for low stock notification on real-time updates
            const currentStock = payload.new.inventory_count || 0;
            const previousStock = payload.old.inventory_count || 0;
            const product = payload.new as Product;
            
            try {
              await checkAndCreateLowStockNotification(siteId, product, currentStock, previousStock);
            } catch (error) {
              console.error('Failed to create low stock notification in real-time:', error);
            }
            
            toast.info(`Inventory updated for ${payload.new.name}`);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [siteId, queryClient]);
}

// SKU validation hook
export function useSkuValidation() {
  const siteId = useSiteId();
  
  return useMutation({
    mutationFn: async ({ sku, excludeId }: { sku: string; excludeId?: string }) => {
      console.log('🔍 SKU validation called with:', { sku, excludeId, siteId });
      if (!siteId || !sku) {
        console.log('❌ SKU validation: missing siteId or sku');
        return true;
      }
      console.log('🔄 Checking SKU availability...');
      const result = await checkSkuAvailability(supabase, siteId, sku, excludeId);
      console.log('✅ SKU availability result:', result);
      return result;
    },
  });
}

// Slug generation hook
export function useSlugGeneration() {
  const siteId = useSiteId();
  
  return useMutation({
    mutationFn: async (name: string) => {
      console.log('🏷️ Slug generation called with:', { name, siteId });
      if (!siteId || !name) {
        console.log('❌ Slug generation: missing siteId or name');
        return '';
      }
      console.log('🔄 Generating unique slug...');
      const result = await generateUniqueSlug(supabase, name, siteId);
      console.log('✅ Generated slug:', result);
      return result;
    },
  });
}