'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useProducts, useProductCategories, useUpdateProduct } from '@/src/hooks/useProducts';
import { useSitePermissions, useSiteContext } from '@/src/contexts/SiteContext';
import { useProductEdit } from '@/src/hooks/useProductEdit';
import { ProductSelectionProvider, useProductSelection } from '@/src/contexts/ProductSelectionContext';
import { BulkActionsToolbar } from '@/src/components/products/BulkActionsToolbar';
import { ImportExportDialog } from '@/src/components/products/ImportExportDialog';
import { ProductEditModal } from '@/src/components/products/ProductEditModal';
import type { Tables } from '@/src/lib/database/types';

// Import our new components
import { ProductsHeader } from './components/ProductsHeader';
import { ProductsStats } from './components/ProductsStats';
import { ProductsToolbar } from './components/ProductsToolbar';
import { ProductsGrid } from './components/ProductsGrid';

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

const ProductsPageContent = memo(() => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('catalogue');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingProductRef, setEditingProductRef] = useState<HTMLElement | null>(null);

  // Data hooks
  const { data: productsResponse, loading } = useProducts();
  const { data: categoriesData = [] } = useProductCategories();
  const updateProduct = useUpdateProduct();

  // Permissions
  const { canEdit } = useSitePermissions();
  const { currentSite } = useSiteContext();
  const productEdit = useProductEdit();

  // Extract products
  const products = useMemo(
    () => (Array.isArray(productsResponse) ? productsResponse : productsResponse?.data || []),
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
      rating: product.rating || 0,
      reviews: product.review_count || 0,
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

    return [{ value: 'All', label: 'All', count: displayProducts.length }, ...categoryOptions];
  }, [categoriesData, displayProducts.length]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!displayProducts.length) return [];

    let filtered = displayProducts;

    // Tab filter
    if (activeTab === 'my-products') {
      filtered = filtered.filter((product) => product.addedToSite);
    }

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
  }, [displayProducts, searchQuery, selectedCategory, activeTab]);

  // Product actions
  const handleAddToSite = useCallback(
    (productId: string) => {
      updateProduct.mutate({ id: productId, is_active: true });
    },
    [updateProduct]
  );

  const handleRemoveFromSite = useCallback(
    (productId: string) => {
      updateProduct.mutate({ id: productId, is_active: false });
    },
    [updateProduct]
  );

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

  // Bulk selection
  const { selectedIds, hasSelection, isAllSelected, isIndeterminate, toggleAll, clearSelection } =
    useProductSelection();

  const [showBulkSelection, setShowBulkSelection] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  const availableProductIds = filteredProducts.map((p) => p.id);
  const allSelected = isAllSelected(availableProductIds);
  const indeterminate = isIndeterminate(availableProductIds);

  const handleSelectAll = () => {
    toggleAll(availableProductIds);
  };

  const toggleBulkMode = () => {
    setShowBulkSelection(!showBulkSelection);
    if (showBulkSelection) {
      clearSelection();
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <ProductsHeader />

      {/* Stats */}
      <ProductsStats />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalogue">All Products</TabsTrigger>
          <TabsTrigger value="my-products">Active on Site</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {/* Toolbar */}
          <ProductsToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showBulkSelection={showBulkSelection}
            onToggleBulkMode={toggleBulkMode}
            allSelected={allSelected}
            indeterminate={indeterminate}
            onSelectAll={handleSelectAll}
            hasSelection={hasSelection}
            onImportExport={() => setShowImportExport(true)}
            onManageCategories={() => router.push('/dashboard/products/categories')}
          />

          {/* Products Grid */}
          <Card>
            <CardContent className="p-6">
              <ProductsGrid
                products={filteredProducts}
                loading={loading}
                viewMode={viewMode}
                showBulkSelection={showBulkSelection}
                onProductEdit={canEdit ? handleProductEdit : undefined}
                onAddToSite={handleAddToSite}
                onRemoveFromSite={handleRemoveFromSite}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Actions Toolbar */}
      {hasSelection && <BulkActionsToolbar />}

      {/* Import/Export Dialog */}
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        selectedProductIds={selectedIds}
      />

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
  return (
    <ProductSelectionProvider>
      <ProductsPageContent />
    </ProductSelectionProvider>
  );
}
