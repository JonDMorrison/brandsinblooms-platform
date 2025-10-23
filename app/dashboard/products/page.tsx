'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useProducts, useProductCategories, useUpdateProduct } from '@/src/hooks/useProducts';
import { useProductStats } from '@/src/hooks/useProductStats';
import { useSitePermissions, useSiteContext } from '@/src/contexts/SiteContext';
import { useProductEdit } from '@/src/hooks/useProductEdit';
import { ProductEditModal } from '@/src/components/products/ProductEditModal';
import type { Tables } from '@/src/lib/database/types';

// Import our new components
import { ProductsHeader } from './components/ProductsHeader';
import { ProductsStats } from './components/ProductsStats';
import { ProductsToolbar } from './components/ProductsToolbar';
import { ProductsTable } from './components/ProductsTable';

interface ProductDisplay {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  stock: 'in-stock' | 'low-stock' | 'out-of-stock';
  image: string;
  featured: boolean;
  addedToSite: boolean;
}

const ProductsPageContent = memo(() => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive'>('active');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingProductRef, setEditingProductRef] = useState<HTMLElement | null>(null);

  // Memoize filters to prevent infinite request loop (object reference changes on every render)
  const productFilters = useMemo(
    () => ({
      limit: 100,
      active: activeFilter === 'active' ? true : false,
    }),
    [activeFilter]
  );

  // Data hooks
  const { data: productsResponse, loading, refresh } = useProducts(productFilters);
  const { data: categoriesData = [] } = useProductCategories();
  const updateProduct = useUpdateProduct();
  const productStats = useProductStats();

  // Permissions
  const { canEdit } = useSitePermissions();
  const { currentSite } = useSiteContext();
  const productEdit = useProductEdit();

  // Extract products and total count from paginated response
  const products = useMemo(
    () => (Array.isArray(productsResponse) ? productsResponse : productsResponse?.data || []),
    [productsResponse]
  );

  const totalProductCount = useMemo(
    () => {
      if (Array.isArray(productsResponse)) return productsResponse.length;
      return productsResponse?.count || 0;
    },
    [productsResponse]
  );

  // Helper functions
  const getCategoryName = useCallback((product: any) => {
    return (
      product.primary_category?.name ||
      product.product_category_assignments?.[0]?.category?.name ||
      product.category ||
      'Uncategorized'
    );
  }, []);

  const getProductImage = useCallback((product: any) => {
    if (product.product_images?.length > 0) {
      const primaryImage =
        product.product_images.find((img: any) => img.is_primary) || product.product_images[0];
      return primaryImage.cdn_url || primaryImage.url || '';
    }
    return product.images?.[0] || '';
  }, []);

  const getStockStatus = useCallback((count: number) => {
    return count === 0 ? 'out-of-stock' : count < 10 ? 'low-stock' : 'in-stock';
  }, []);

  // Transform products for display
  const displayProducts: ProductDisplay[] = useMemo(() => {
    if (!products?.length) return [];

    return products.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      originalPrice: product.compare_at_price,
      category: getCategoryName(product),
      stock: getStockStatus(product.inventory_count),
      image: getProductImage(product),
      featured: !!product.is_featured,
      addedToSite: !!product.is_active,
    }));
  }, [products, getCategoryName, getProductImage, getStockStatus]);

  // Categories for filter
  const categories = useMemo(() => {
    const categoryOptions = (categoriesData || []).map((cat) => ({
      value: cat.name,
      label: cat.name,
      count: cat.count,
    }));

    return [{ value: 'All', label: 'All', count: totalProductCount }, ...categoryOptions];
  }, [categoriesData, totalProductCount]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!displayProducts.length) return [];

    let filtered = displayProducts;

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [displayProducts, searchQuery, selectedCategory]);

  // Product actions
  const handleProductEdit = useCallback(
    (productId: string) => {
      if (!canEdit) {
        toast.error('You do not have permission to edit products');
        return;
      }

      const productToEdit = products.find((p) => p.id === productId);

      if (!productToEdit) {
        toast.error('Product not found');
        return;
      }

      setEditingProductRef(document.activeElement as HTMLElement);

      const productWithSite = {
        ...productToEdit,
        site_id: currentSite?.id || productToEdit.site_id,
        site_name: currentSite?.name,
        site_subdomain: currentSite?.subdomain,
      };

      setEditingProduct(productWithSite);
      setEditModalOpen(true);
    },
    [canEdit, products, currentSite]
  );

  const handleEditModalClose = useCallback(() => {
    setEditModalOpen(false);
    setEditingProduct(null);
    setEditingProductRef(null);
  }, []);

  const handleReturnFocus = useCallback(() => {
    if (editingProductRef && typeof editingProductRef.focus === 'function') {
      try {
        editingProductRef.focus();
      } catch (error) {
        const firstFocusable = document.querySelector(
          '[tabindex="0"], button, input, select, textarea'
        ) as HTMLElement;
        firstFocusable?.focus();
      }
    }
  }, [editingProductRef]);

  const customSaveHandler = useCallback(
    async (
      productId: string,
      updates: Partial<Tables<'products'> & { category_ids?: string[] }>
    ): Promise<Tables<'products'>> => {
      return new Promise((resolve, reject) => {
        productEdit.mutate({ id: productId, ...updates } as any, {
          onSuccess: (data) => resolve(data),
          onError: (error) => reject(error),
        });
      });
    },
    [productEdit]
  );

  const handleProductSave = useCallback((updatedProduct: Tables<'products'>) => {
    setEditModalOpen(false);
    setEditingProduct(null);
  }, []);

  const handleProductCreated = useCallback(() => {
    refresh(); // Refresh products list
    productStats.refresh(); // Refresh stats
  }, [refresh, productStats]);

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <ProductsHeader onProductCreated={handleProductCreated} />

      {/* Stats */}
      <ProductsStats />

      {/* Toolbar */}
      <ProductsToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onManageCategories={() => router.push('/dashboard/products/categories')}
      />

      {/* Products Table */}
      <Card>
        <CardContent className="p-6">
          <ProductsTable
            products={filteredProducts}
            loading={loading}
            onProductEdit={canEdit ? handleProductEdit : undefined}
          />
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <ProductEditModal
        product={editingProduct}
        isOpen={editModalOpen}
        onClose={handleEditModalClose}
        onSave={handleProductSave}
        customSaveHandler={customSaveHandler}
        onReturnFocus={handleReturnFocus}
      />
    </div>
  );
});

ProductsPageContent.displayName = 'ProductsPageContent';

export default function ProductsPage() {
  return <ProductsPageContent />;
}
