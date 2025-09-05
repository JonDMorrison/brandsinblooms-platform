'use client';

import React from 'react';
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { toast } from 'sonner';
import { useSiteId } from '@/src/contexts/SiteContext';
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

  return useSupabaseQuery(
    (signal) => getCategoriesHierarchy(supabase, siteId!, filters),
    {
      enabled: !!siteId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Hook to fetch a single category
 */
export function useCategory(categoryId: string | undefined, includeAncestors = false) {
  const siteId = useSiteId();
  const supabase = useSupabase();

  return useSupabaseQuery(
    (signal) => getCategoryById(supabase, siteId!, categoryId!, includeAncestors),
    {
      enabled: !!siteId && !!categoryId,
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook to fetch category ancestors (breadcrumb)
 */
export function useCategoryAncestors(categoryId: string | undefined) {
  const siteId = useSiteId();
  const supabase = useSupabase();

  return useSupabaseQuery(
    async (signal) => {
      const result = await getCategoryById(supabase, siteId!, categoryId!, true);
      return result.ancestors || [];
    },
    {
      enabled: !!siteId && !!categoryId,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

/**
 * Hook to fetch products in a category
 */
export function useCategoryProducts(categoryId: string | undefined, filters?: CategoryProductsFilters) {
  const siteId = useSiteId();
  const supabase = useSupabase();

  return useSupabaseQuery(
    (signal) => getCategoryProducts(supabase, siteId!, categoryId!, filters),
    {
      enabled: !!siteId && !!categoryId,
      staleTime: 3 * 60 * 1000, // 3 minutes
    }
  );
}

/**
 * Hook to create a new category
 */
export function useCreateCategory() {
  const siteId = useSiteId();
  const supabase = useSupabase();

  return useSupabaseMutation(
    (data: Omit<CreateCategoryInput, 'site_id'>, signal) =>
      createCategory(supabase, { ...data, site_id: siteId! }),
    {
      showSuccessToast: 'Category created successfully',
    }
  );
}

/**
 * Hook to update a category
 */
export function useUpdateCategory(categoryId: string) {
  const siteId = useSiteId();
  const supabase = useSupabase();

  return useSupabaseMutation(
    (data: UpdateCategoryInput, signal) =>
      updateCategory(supabase, siteId!, categoryId, data),
    {
      showSuccessToast: 'Category updated successfully',
    }
  );
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory() {
  const siteId = useSiteId();
  const supabase = useSupabase();

  return useSupabaseMutation(
    ({ 
      categoryId, 
      reassignToId 
    }: { 
      categoryId: string; 
      reassignToId?: string;
    }, signal) =>
      deleteCategory(supabase, siteId!, categoryId, reassignToId),
    {
      onSuccess: (data) => {
        toast.success('Category deleted successfully', {
          description: data.affected_products 
            ? `${data.affected_products} products were updated`
            : undefined,
        });
      },
    }
  );
}

/**
 * Hook to reorder categories
 */
export function useReorderCategories() {
  const siteId = useSiteId();
  const supabase = useSupabase();

  return useSupabaseMutation(
    (data: ReorderCategoriesInput, signal) =>
      reorderCategories(supabase, siteId!, data),
    {
      showSuccessToast: 'Categories reordered successfully',
    }
  );
}

/**
 * Hook to bulk assign products to category
 */
export function useAssignProductsToCategory() {
  const siteId = useSiteId();
  const supabase = useSupabase();

  return useSupabaseMutation(
    (data: BulkAssignInput, signal) =>
      assignProductsToCategory(supabase, siteId!, data),
    {
      onSuccess: (data) => {
        toast.success('Products assigned successfully', {
          description: `${data.assigned} products updated`,
        });
      },
    }
  );
}

/**
 * Hook to get flat list of all categories for select dropdowns
 * Updated to not use React Query
 */
export function useCategoriesList(includeInactive = false) {
  const siteId = useSiteId();
  const supabase = useSupabase();
  const [data, setData] = React.useState<Array<CategoryHierarchy & { level: number }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchCategories = async () => {
      if (!siteId) {
        setData([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
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

        setData(flattenCategories(hierarchy));
        setError(null);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [siteId, includeInactive, supabase]);

  return { data, isLoading, error };
}