'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queries/keys';
import { getProductStats } from '@/lib/queries/domains/products';
import { useSiteId } from '@/src/contexts/SiteContext';

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  featuredProducts: number;
  inStockProducts: number;
  outOfStockProducts: number;
  averagePrice: number;
  inventoryValue: number;
  totalInventoryUnits: number;
  averageRating: number;
  totalReviews: number;
  lowStockCount: number;
}

/**
 * Hook to fetch and cache product statistics for the current site
 */
export function useProductStats() {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.products.stats(siteId!),
    queryFn: async () => {
      if (!siteId) throw new Error('No site selected');
      
      const stats = await getProductStats(supabase, siteId);
      
      // Transform to more readable property names
      return {
        totalProducts: stats.total,
        activeProducts: stats.active,
        featuredProducts: stats.featured,
        inStockProducts: stats.inStock,
        outOfStockProducts: stats.outOfStock,
        averagePrice: stats.avgPrice,
        inventoryValue: stats.inventoryValue,
        totalInventoryUnits: stats.totalInventoryUnits,
        averageRating: stats.avgRating,
        totalReviews: stats.totalReviews,
        lowStockCount: stats.lowStockCount,
      } as ProductStats;
    },
    enabled: !!siteId,
    staleTime: 30 * 1000, // 30 seconds, consistent with other product queries
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
  });
}

/**
 * Hook to invalidate product statistics cache
 * Useful after bulk operations or product updates
 */
export function useInvalidateProductStats() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return () => {
    if (siteId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.stats(siteId),
      });
    }
  };
}