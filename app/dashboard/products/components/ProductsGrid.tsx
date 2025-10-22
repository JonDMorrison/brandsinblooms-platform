'use client';

import { memo } from 'react';
import { ProductCard } from '@/src/components/ProductCard';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Package } from 'lucide-react';

interface ProductDisplay {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  category: string;
  stock: 'in-stock' | 'low-stock' | 'out-of-stock';
  image: string;
  featured: boolean;
  addedToSite: boolean;
}

interface ProductsGridProps {
  products: ProductDisplay[];
  loading?: boolean;
  onProductEdit?: (productId: string) => void;
  onAddToSite?: (productId: string) => void;
  onRemoveFromSite?: (productId: string) => void;
}

const ProductGridSkeleton = memo(() => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="space-y-4">
        <Skeleton className="aspect-square rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    ))}
  </div>
));
ProductGridSkeleton.displayName = 'ProductGridSkeleton';

const EmptyState = memo(() => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <Package className="h-16 w-16 text-gray-300" />
    <div className="text-center">
      <h3 className="text-lg font-semibold">No products found</h3>
      <p className="text-sm text-gray-500 mt-2">
        Try adjusting your filters or search query
      </p>
    </div>
  </div>
));
EmptyState.displayName = 'EmptyState';

export const ProductsGrid = memo(({
  products,
  loading = false,
  onProductEdit,
  onAddToSite,
  onRemoveFromSite,
}: ProductsGridProps) => {
  if (loading) {
    return <ProductGridSkeleton />;
  }

  if (products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onProductEdit ? () => onProductEdit(product.id) : undefined}
          onAddToSite={onAddToSite ? () => onAddToSite(product.id) : undefined}
          onRemoveFromSite={onRemoveFromSite ? () => onRemoveFromSite(product.id) : undefined}
        />
      ))}
    </div>
  );
});

ProductsGrid.displayName = 'ProductsGrid';
