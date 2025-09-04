'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSiteId } from '@/src/contexts/SiteContext';
import { queryKeys } from '@/lib/queries/keys';
import { useSupabase } from '@/hooks/useSupabase';
import {
  getCategoriesHierarchy,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  assignProductsToCategory,
  getCategoryProducts,
} from '@/lib/queries/domains/categories';
import type {
  CategoryHierarchy,
  CategoryFilters,
  CategoryProductsFilters,
  CreateCategoryInput,
  UpdateCategoryInput,
  ReorderCategoriesInput,
  BulkAssignInput,
} from '@/lib/validations/categories';
import type { TablesInsert, TablesUpdate } from '@/lib/database/types';

/**
 * Hook to fetch categories hierarchy
 */
export function useCategoriesHierarchy(filters?: CategoryFilters) {
  const siteId = useSiteId();
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.categories.hierarchy(siteId!, filters),
    queryFn: () => getCategoriesHierarchy(supabase, siteId!, filters),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single category
 */
export function useCategory(categoryId: string | undefined, includeAncestors = false) {
  const siteId = useSiteId();
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.categories.detail(siteId!, categoryId!),
    queryFn: () => getCategoryById(supabase, siteId!, categoryId!, includeAncestors),
    enabled: !!siteId && !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch category ancestors (breadcrumb)
 */
export function useCategoryAncestors(categoryId: string | undefined) {
  const siteId = useSiteId();
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.categories.ancestors(siteId!, categoryId!),
    queryFn: async () => {
      const result = await getCategoryById(supabase, siteId!, categoryId!, true);
      return result.ancestors || [];
    },
    enabled: !!siteId && !!categoryId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch products in a category
 */
export function useCategoryProducts(categoryId: string | undefined, filters?: CategoryProductsFilters) {
  const siteId = useSiteId();
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.categories.productsList(siteId!, categoryId!, filters),
    queryFn: () => getCategoryProducts(supabase, siteId!, categoryId!, filters),
    enabled: !!siteId && !!categoryId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

/**
 * Hook to create a new category
 */
export function useCreateCategory() {
  const siteId = useSiteId();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<CreateCategoryInput, 'site_id'>) =>
      createCategory(supabase, { ...data, site_id: siteId! }),
    onMutate: async (newCategory) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.categories.all(siteId!) 
      });

      // Get previous data
      const previousHierarchy = queryClient.getQueryData<CategoryHierarchy[]>(
        queryKeys.categories.hierarchy(siteId!)
      );

      // Optimistically update
      if (previousHierarchy) {
        const optimisticCategory: CategoryHierarchy = {
          id: 'temp-' + Date.now(),
          site_id: siteId!,
          name: newCategory.name,
          slug: newCategory.slug,
          description: newCategory.description || null,
          image_url: newCategory.image_url || null,
          icon: newCategory.icon || null,
          color: newCategory.color || null,
          parent_id: newCategory.parent_id || null,
          path: '/' + newCategory.slug,
          level: 0,
          sort_order: newCategory.sort_order || 0,
          is_active: newCategory.is_active ?? true,
          meta_title: newCategory.meta_title || null,
          meta_description: newCategory.meta_description || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          children: [],
          product_count: 0,
        };

        if (newCategory.parent_id) {
          // Add to parent's children
          const updateHierarchy = (categories: CategoryHierarchy[]): CategoryHierarchy[] => {
            return categories.map(cat => {
              if (cat.id === newCategory.parent_id) {
                return {
                  ...cat,
                  children: [...cat.children, optimisticCategory],
                };
              }
              if (cat.children.length > 0) {
                return {
                  ...cat,
                  children: updateHierarchy(cat.children),
                };
              }
              return cat;
            });
          };
          queryClient.setQueryData(
            queryKeys.categories.hierarchy(siteId!),
            updateHierarchy(previousHierarchy)
          );
        } else {
          // Add to root
          queryClient.setQueryData(
            queryKeys.categories.hierarchy(siteId!),
            [...previousHierarchy, optimisticCategory]
          );
        }
      }

      return { previousHierarchy };
    },
    onError: (err, newCategory, context) => {
      // Rollback on error
      if (context?.previousHierarchy) {
        queryClient.setQueryData(
          queryKeys.categories.hierarchy(siteId!),
          context.previousHierarchy
        );
      }
      
      // Log the error for debugging
      console.error('Category creation error:', err);
      
      // Don't show toast here - let the component handle it
      // This prevents double toasts
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categories.all(siteId!) 
      });
    },
  });
}

/**
 * Hook to update a category
 */
export function useUpdateCategory(categoryId: string) {
  const siteId = useSiteId();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCategoryInput) =>
      updateCategory(supabase, siteId!, categoryId, data),
    onMutate: async (updates) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.categories.detail(siteId!, categoryId) 
      });

      // Get previous data
      const previousCategory = queryClient.getQueryData(
        queryKeys.categories.detail(siteId!, categoryId)
      );

      // Optimistically update
      queryClient.setQueryData(
        queryKeys.categories.detail(siteId!, categoryId),
        (old: any) => ({ ...old, ...updates })
      );

      return { previousCategory };
    },
    onError: (err, updates, context) => {
      // Rollback on error
      if (context?.previousCategory) {
        queryClient.setQueryData(
          queryKeys.categories.detail(siteId!, categoryId),
          context.previousCategory
        );
      }
      toast.error('Failed to update category', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    },
    onSuccess: () => {
      toast.success('Category updated successfully');
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categories.all(siteId!) 
      });
    },
  });
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory() {
  const siteId = useSiteId();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      categoryId, 
      reassignToId 
    }: { 
      categoryId: string; 
      reassignToId?: string;
    }) =>
      deleteCategory(supabase, siteId!, categoryId, reassignToId),
    onMutate: async ({ categoryId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.categories.all(siteId!) 
      });

      // Get previous data
      const previousHierarchy = queryClient.getQueryData<CategoryHierarchy[]>(
        queryKeys.categories.hierarchy(siteId!)
      );

      // Optimistically remove from hierarchy
      if (previousHierarchy) {
        const removeFromHierarchy = (categories: CategoryHierarchy[]): CategoryHierarchy[] => {
          return categories
            .filter(cat => cat.id !== categoryId)
            .map(cat => ({
              ...cat,
              children: removeFromHierarchy(cat.children),
            }));
        };

        queryClient.setQueryData(
          queryKeys.categories.hierarchy(siteId!),
          removeFromHierarchy(previousHierarchy)
        );
      }

      return { previousHierarchy };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousHierarchy) {
        queryClient.setQueryData(
          queryKeys.categories.hierarchy(siteId!),
          context.previousHierarchy
        );
      }
      toast.error('Failed to delete category', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    },
    onSuccess: (data) => {
      toast.success('Category deleted successfully', {
        description: data.affected_products 
          ? `${data.affected_products} products were updated`
          : undefined,
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categories.all(siteId!) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.all(siteId!) 
      });
    },
  });
}

/**
 * Hook to reorder categories
 */
export function useReorderCategories() {
  const siteId = useSiteId();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderCategoriesInput) =>
      reorderCategories(supabase, siteId!, data),
    onMutate: async (reorderData) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.categories.hierarchy(siteId!) 
      });

      // For optimistic updates, we'll just rely on the drag-and-drop UI
      // The actual reordering is handled by the component state
    },
    onError: (err) => {
      toast.error('Failed to reorder categories', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
      // Refetch to restore correct order
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categories.hierarchy(siteId!) 
      });
    },
    onSuccess: () => {
      toast.success('Categories reordered successfully');
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categories.all(siteId!) 
      });
    },
  });
}

/**
 * Hook to bulk assign products to category
 */
export function useAssignProductsToCategory() {
  const siteId = useSiteId();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkAssignInput) =>
      assignProductsToCategory(supabase, siteId!, data),
    onError: (err) => {
      toast.error('Failed to assign products', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    },
    onSuccess: (data) => {
      toast.success('Products assigned successfully', {
        description: `${data.assigned} products updated`,
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categories.all(siteId!) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.all(siteId!) 
      });
    },
  });
}

/**
 * Hook to get flat list of all categories for select dropdowns
 */
export function useCategoriesList(includeInactive = false) {
  const siteId = useSiteId();
  const supabase = useSupabase();

  return useQuery({
    queryKey: [...queryKeys.categories.all(siteId!), 'list', includeInactive],
    queryFn: async () => {
      const hierarchy = await getCategoriesHierarchy(supabase, siteId!, {
        active: !includeInactive,
      });
      
      // Flatten hierarchy into a list
      const flattenCategories = (
        categories: CategoryHierarchy[], 
        level = 0
      ): Array<CategoryHierarchy & { level: number }> => {
        return categories.reduce((acc, cat) => {
          acc.push({ ...cat, level });
          if (cat.children.length > 0) {
            acc.push(...flattenCategories(cat.children, level + 1));
          }
          return acc;
        }, [] as Array<CategoryHierarchy & { level: number }>);
      };

      return flattenCategories(hierarchy);
    },
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000,
  });
}