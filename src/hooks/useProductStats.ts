'use client';

import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { supabase } from '@/lib/supabase/client';
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
  uniqueCategories: number;
}

/**
 * Hook to fetch and cache product statistics for the current site
 */
export function useProductStats() {
  const siteId = useSiteId();
  
  return useSupabaseQuery<ProductStats>(
    async (signal) => {
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
        uniqueCategories: stats.uniqueCategories,
      } as ProductStats;
    },
    {
      enabled: !!siteId,
      staleTime: 30 * 1000, // 30 seconds, consistent with other product queries
    }
  );
}

/**
 * Hook to invalidate product statistics cache
 * Useful after bulk operations or product updates
 */
export function useInvalidateProductStats() {
  const productStats = useProductStats();
  
  return () => {
    // Refresh the product stats instead of invalidating
    productStats.refresh();
  };
}