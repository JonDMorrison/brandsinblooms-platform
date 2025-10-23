'use client';

import { useMemo } from 'react';
import { Package, ShoppingCart, DollarSign, Layers } from 'lucide-react';
import { DashboardStats, type DashboardStat } from '@/src/components/DashboardStats';
import { useProductStats } from '@/src/hooks/useProductStats';

export function ProductsStats() {
  const { data: productStats, isLoading } = useProductStats();

  const dashboardStats: DashboardStat[] = useMemo(() => {
    if (!productStats) return [];

    return [
      {
        id: '1',
        title: 'Total Products',
        count: productStats?.totalProducts || 0,
        trend: 'All products in catalog',
        icon: <Package className="h-6 w-6" />,
        color: 'text-blue-600',
        showTrendIcon: false,
      },
      {
        id: '2',
        title: 'Active Products',
        count: productStats?.activeProducts || 0,
        trend:
          productStats && productStats.totalProducts > 0
            ? `${Math.round((productStats.activeProducts / productStats.totalProducts) * 100)}% active`
            : 'No products active',
        icon: <ShoppingCart className="h-6 w-6" />,
        color: 'text-green-600',
        showTrendIcon: false,
      },
      {
        id: '3',
        title: 'Inventory Value',
        count: Math.round(productStats?.inventoryValue || 0),
        trend:
          productStats && productStats.totalInventoryUnits > 0
            ? `${productStats.totalInventoryUnits.toLocaleString()} units`
            : 'No inventory tracked',
        icon: <DollarSign className="h-6 w-6" />,
        color: 'text-purple-600',
        showTrendIcon: false,
      },
      {
        id: '4',
        title: 'Product Categories',
        count: productStats?.uniqueCategories || 0,
        trend:
          productStats && productStats.uniqueCategories > 0
            ? `${productStats.totalProducts} products across categories`
            : 'No categories assigned',
        icon: <Layers className="h-6 w-6" />,
        color: 'text-teal-600',
        showTrendIcon: false,
      },
    ];
  }, [productStats]);

  if (isLoading) {
    return null; // Or a skeleton loader
  }

  return <DashboardStats stats={dashboardStats} />;
}
