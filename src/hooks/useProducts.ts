'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/src/lib/supabase/client';
import { queryKeys } from '@/src/lib/queries/keys';
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
  ProductFilters,
  ProductSortOptions
} from '@/src/lib/queries/domains/products';
import { useSiteId } from '@/contexts/SiteContext';
import { Product, ProductInsert, ProductUpdate } from '@/src/lib/database/aliases';

// Main products query hook
export function useProducts(filters?: ProductFilters, sort?: ProductSortOptions) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.products(siteId!), { filters, sort }],
    queryFn: () => getProducts(supabase, siteId!, filters, sort),
    enabled: !!siteId,
    staleTime: 30 * 1000,
  });
}

// Get single product
export function useProduct(productId: string) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.product(siteId!, productId),
    queryFn: () => getProductById(supabase, productId),
    enabled: !!siteId && !!productId,
  });
}

// Get products by category
export function useProductsByCategory(category: string) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.productsByCategory(siteId!, category),
    queryFn: () => getProductsByCategory(supabase, siteId!, category),
    enabled: !!siteId && !!category,
    staleTime: 30 * 1000,
  });
}

// Search products
export function useSearchProducts(searchQuery: string) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.products(siteId!), 'search', searchQuery],
    queryFn: () => searchProducts(supabase, siteId!, searchQuery),
    enabled: !!siteId && searchQuery.length > 2,
    staleTime: 10 * 1000,
  });
}

// Get product categories
export function useProductCategories() {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.products(siteId!), 'categories'],
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
    mutationFn: (data: Omit<ProductInsert, 'site_id'>) => 
      createProduct(supabase, { ...data, site_id: siteId! }),
    onMutate: async (newProduct) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products(siteId!) });
      
      const previousProducts = queryClient.getQueryData(queryKeys.products(siteId!));
      
      queryClient.setQueryData(queryKeys.products(siteId!), (old: Product[] = []) => [
        {
          ...newProduct,
          id: crypto.randomUUID(),
          site_id: siteId!,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Product,
        ...old,
      ]);
      
      return { previousProducts };
    },
    onError: (err, newProduct, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products(siteId!), context.previousProducts);
      }
      toast.error('Failed to create product');
    },
    onSuccess: () => {
      toast.success('Product created successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products(siteId!) });
    },
  });
}

// Update product mutation
export function useUpdateProduct() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: ProductUpdate & { id: string }) => 
      updateProduct(supabase, id, data),
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.product(siteId!, id) });
      
      const previousProduct = queryClient.getQueryData(queryKeys.product(siteId!, id));
      
      queryClient.setQueryData(queryKeys.product(siteId!, id), (old: Product) => ({
        ...old,
        ...updates,
        updated_at: new Date().toISOString(),
      }));
      
      // Also update in list
      queryClient.setQueryData(queryKeys.products(siteId!), (old: Product[] = []) => 
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
          queryKeys.product(siteId!, variables.id), 
          context.previousProduct
        );
      }
      toast.error('Failed to update product');
    },
    onSuccess: () => {
      toast.success('Product updated successfully');
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products(siteId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.product(siteId!, variables.id) });
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
      await queryClient.cancelQueries({ queryKey: queryKeys.product(siteId!, productId) });
      
      const previousProduct = queryClient.getQueryData(queryKeys.product(siteId!, productId));
      
      queryClient.setQueryData(queryKeys.product(siteId!, productId), (old: Product) => ({
        ...old,
        inventory_count: quantity,
        updated_at: new Date().toISOString(),
      }));
      
      return { previousProduct, productId };
    },
    onError: (err, variables, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(
          queryKeys.product(siteId!, context.productId), 
          context.previousProduct
        );
      }
      toast.error('Failed to update inventory');
    },
    onSuccess: () => {
      toast.success('Inventory updated successfully');
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products(siteId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.product(siteId!, variables.productId) });
    },
  });
}

// Delete product mutation
export function useDeleteProduct() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteProduct(supabase, id),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products(siteId!) });
      
      const previousProducts = queryClient.getQueryData(queryKeys.products(siteId!));
      
      queryClient.setQueryData(queryKeys.products(siteId!), (old: Product[] = []) => 
        old.filter(product => product.id !== productId)
      );
      
      return { previousProducts };
    },
    onError: (err, productId, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products(siteId!), context.previousProducts);
      }
      toast.error('Failed to delete product');
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products(siteId!) });
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
        (payload) => {
          // Only invalidate if inventory changed
          if (payload.old.inventory_count !== payload.new.inventory_count) {
            queryClient.invalidateQueries({ 
              queryKey: queryKeys.product(siteId, payload.new.id) 
            });
            
            // Update in list as well
            queryClient.setQueryData(queryKeys.products(siteId), (old: Product[] = []) => 
              old.map(product => 
                product.id === payload.new.id 
                  ? { ...product, ...payload.new }
                  : product
              )
            );
            
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