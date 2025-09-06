'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/src/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Checkbox } from '@/src/components/ui/checkbox';
import {
  Search,
  Grid3X3,
  List,
  Plus,
  Filter,
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  Download,
  Upload,
  FolderTree,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useProducts,
  useProductCategories,
  useUpdateProduct,
} from '@/src/hooks/useProducts';
import { useProductStats } from '@/src/hooks/useProductStats';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/src/components/ui/skeleton';
import {
  ProductSelectionProvider,
  useProductSelection,
} from '@/src/contexts/ProductSelectionContext';
import { BulkActionsToolbar } from '@/src/components/products/BulkActionsToolbar';
import { ImportExportDialog } from '@/src/components/products/ImportExportDialog';
import { ProductEditModal } from '@/src/components/products/ProductEditModal';
import { useSitePermissions, useSiteContext } from '@/src/contexts/SiteContext';
import { useProductEdit } from '@/src/hooks/useProductEdit';
import type { Tables } from '@/src/lib/database/types';
import { DashboardStats, type DashboardStat } from '@/src/components/DashboardStats';
import { StreamingLoader, ProgressiveLoader } from '@/src/components/ui/streaming-loader';

// Import ProductCard directly for better performance (avoid lazy loading overhead)
import { ProductCard } from '@/src/components/ProductCard'

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

  // Memoized hook calls to reduce unnecessary re-renders  
  const { data: productsResponse, loading } = useProducts();
  const { data: categoriesData = [] } = useProductCategories();
  const updateProduct = useUpdateProduct();
  
  // Permissions and edit functionality - memoized
  const { canEdit } = useSitePermissions();
  const { currentSite } = useSiteContext();
  const productEdit = useProductEdit();

  // Memoized products extraction
  const products = useMemo(() => {
    return Array.isArray(productsResponse) ? productsResponse : productsResponse?.data || []
  }, [productsResponse]);

  // Memoized helper functions for product transformation
  const getCategoryName = useCallback((product: any) => {
    return product.primary_category?.name ||
           product.product_category_assignments?.[0]?.category?.name ||
           product.category ||
           'Uncategorized'
  }, [])

  const getProductImage = useCallback((product: any) => {
    if (product.product_images?.length > 0) {
      const primaryImage = product.product_images.find((img: any) => img.is_primary) || product.product_images[0]
      return primaryImage.cdn_url || primaryImage.url || ''
    }
    return product.images?.[0] || ''
  }, [])

  const getStockStatus = useCallback((count: number) => {
    return count === 0 ? 'out-of-stock' : count < 10 ? 'low-stock' : 'in-stock'
  }, [])

  // Optimized product transformation with reduced complexity
  const displayProducts: ProductDisplay[] = useMemo(() => {
    if (!products?.length) return []

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
    }))
  }, [products, getCategoryName, getProductImage, getStockStatus])

  const categories = useMemo(() => {
    // categoriesData now contains objects with id, name, slug, count, etc.
    const categoryOptions = (categoriesData || [])
      .map((cat) => ({
        value: cat.name,
        label: cat.name,
        count: cat.count,
        icon: cat.icon,
        color: cat.color
      }));
    
    // Add "All" option at the beginning
    return [
      { value: 'All', label: 'All', count: displayProducts.length, icon: undefined, color: undefined },
      ...categoryOptions
    ];
  }, [categoriesData, displayProducts.length]);

  // Optimized filtering with early returns and reduced string operations
  const filteredProducts = useMemo(() => {
    if (!displayProducts.length) return []

    let filtered = displayProducts

    // Apply tab filter first (most selective)
    if (activeTab === 'my-products') {
      filtered = filtered.filter(product => product.addedToSite)
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Apply search filter (most expensive, do last)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [displayProducts, searchQuery, selectedCategory, activeTab])

  const handleAddToSite = useCallback(
    (productId: string) => {
      updateProduct.mutate({
        id: productId,
        is_active: true,
      });
    },
    [updateProduct]
  );

  const handleRemoveFromSite = useCallback(
    (productId: string) => {
      updateProduct.mutate({
        id: productId,
        is_active: false,
      });
    },
    [updateProduct]
  );

  // Handle product edit
  const handleProductEdit = useCallback(
    (productId: string) => {
      // Check permissions before allowing edit
      if (!canEdit) {
        toast.error('You do not have permission to edit products');
        return;
      }

      // Find the product in our current data
      const productToEdit = products.find(p => p.id === productId);
      
      if (!productToEdit) {
        toast.error('Product not found');
        return;
      }

      // Store reference to currently focused element for focus return
      setEditingProductRef(document.activeElement as HTMLElement);

      // Convert the product to ProductWithSite format for the modal
      const productWithSite = {
        ...productToEdit,
        site_id: currentSite?.id || productToEdit.site_id,
        site_name: currentSite?.name,
        site_subdomain: currentSite?.subdomain
      };

      setEditingProduct(productWithSite);
      setEditModalOpen(true);
    },
    [canEdit, products, currentSite]
  );

  // Handle modal close
  const handleEditModalClose = useCallback(() => {
    setEditModalOpen(false);
    setEditingProduct(null);
    setEditingProductRef(null);
  }, []);

  // Return focus to the element that triggered the edit
  const handleReturnFocus = useCallback(() => {
    if (editingProductRef && typeof editingProductRef.focus === 'function') {
      try {
        editingProductRef.focus();
      } catch (error) {
        // Fallback: focus the first focusable element in the page
        const firstFocusable = document.querySelector('[tabindex="0"], button, input, select, textarea') as HTMLElement;
        firstFocusable?.focus();
      }
    }
  }, [editingProductRef]);

  // Custom save handler that uses useProductEdit hook
  const customSaveHandler = useCallback(
    async (productId: string, updates: Partial<Tables<'products'> & { category_ids?: string[] }>): Promise<Tables<'products'>> => {
      return new Promise((resolve, reject) => {
        productEdit.mutate(
          { id: productId, ...updates } as any,
          {
            onSuccess: (data) => {
              resolve(data);
            },
            onError: (error) => {
              reject(error);
            }
          }
        );
      });
    },
    [productEdit]
  );

  // Handle product save
  const handleProductSave = useCallback(
    (updatedProduct: Tables<'products'>) => {
      // Close the modal - the useProductEdit hook already handles the database update and optimistic updates
      setEditModalOpen(false);
      setEditingProduct(null);
    },
    []
  );

  // Use dedicated hook for product statistics - only load if needed
  const { data: productStats, isLoading: statsLoading } = useProductStats();
  
  // Memoized dashboard stats for the DashboardStats component
  const dashboardStats: DashboardStat[] = useMemo(() => {
    if (!productStats) return []
    
    return [
      {
        id: '1',
        title: 'Total Products',
        count: productStats?.totalProducts || 0,
        trend: 'All products in catalog',
        icon: <Package className="h-6 w-6" />,
        color: 'text-blue-600',
        showTrendIcon: false
      },
      {
        id: '2',
        title: 'Active Products',
        count: productStats?.activeProducts || 0,
        trend: productStats && productStats.totalProducts > 0 
          ? `${Math.round((productStats.activeProducts / productStats.totalProducts) * 100)}% active`
          : 'No products active',
        icon: <ShoppingCart className="h-6 w-6" />,
        color: 'text-green-600',
        showTrendIcon: false
      },
      {
        id: '3',
        title: 'Inventory Value',
        count: Math.round(productStats?.inventoryValue || 0),
        trend: productStats && productStats.totalInventoryUnits > 0
          ? `${productStats.totalInventoryUnits.toLocaleString()} units`
          : 'No inventory tracked',
        icon: <DollarSign className="h-6 w-6" />,
        color: 'text-purple-600',
        showTrendIcon: false
      },
      {
        id: '4',
        title: 'Avg Rating',
        count: Math.round((productStats?.averageRating || 0) * 10) / 10, // Round to 1 decimal
        trend: productStats && productStats.totalReviews > 0
          ? `${productStats.totalReviews} reviews`
          : 'No reviews yet',
        icon: <Star className="h-6 w-6" />,
        color: 'text-orange-600',
        showTrendIcon: false
      }
    ]
  }, [productStats]);
  
  // Local stats for addedToSite count (specific to current filter)
  const localStats = useMemo(() => {
    const siteProducts = displayProducts.filter((p) => p.addedToSite);
    return {
      displayCount: displayProducts.length,
      addedToSite: siteProducts.length,
    };
  }, [displayProducts]);

  const {
    selectedIds,
    selectedCount,
    hasSelection,
    isAllSelected,
    isIndeterminate,
    toggleAll,
    clearSelection,
  } = useProductSelection();

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
    <div className='space-y-6 relative'>
      {/* Header */}
      <div
        className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 fade-in-up'
        style={{ animationDelay: '0s' }}
      >
        <div>
          <h1 className='text-2xl font-bold'>Products</h1>
          <p className='text-gray-500'>
            Manage your product catalog and site products
          </p>
        </div>
        <div className='flex gap-2'>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/products/categories')}
          >
            <FolderTree className='h-4 w-4 mr-2' />
            Manage Categories
          </Button>
          <Button onClick={() => router.push('/dashboard/products/new')}>
            <Plus className='h-4 w-4 mr-2' />
            Add New Product
          </Button>
          <Button variant='outline' onClick={() => setShowImportExport(true)}>
            <Upload className='h-4 w-4 mr-2' />
            Import / Export
          </Button>
          <Button
            variant={showBulkSelection ? 'default' : 'outline'}
            onClick={toggleBulkMode}
          >
            {showBulkSelection ? 'Exit Bulk Mode' : 'Bulk Actions'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardStats 
        stats={dashboardStats}
        isLoading={loading || statsLoading}
        className="fade-in-up"
        animationDelay={0.2}
      />

      {/* Main Content */}
      <Card className='fade-in-up' style={{ animationDelay: '0.7s' }}>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value='catalogue'>Product Catalogue</TabsTrigger>
              <TabsTrigger value='my-products'>
                My Products ({localStats.addedToSite})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className='space-y-4'>
              {/* Bulk Selection Header */}
              {showBulkSelection && (
                <div className='flex items-center gap-4 p-3 bg-blue-50 rounded-lg'>
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) {
                        const input = el.querySelector('input');
                        if (input) input.indeterminate = indeterminate;
                      }
                    }}
                    onCheckedChange={handleSelectAll}
                    className='data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                  />
                  <span className='text-sm font-medium'>
                    {selectedCount > 0
                      ? `${selectedCount} of ${availableProductIds.length} selected`
                      : `Select all ${availableProductIds.length} products`}
                  </span>
                  {selectedCount > 0 && (
                    <Button variant='ghost' size='sm' onClick={clearSelection}>
                      Clear selection
                    </Button>
                  )}
                </div>
              )}

              {/* Filters and Search */}
              <div className='flex flex-col sm:flex-row gap-4'>
                {/* Search */}
                <div className='relative flex-1'>
                  <Search className='absolute left-3 top-3 h-4 w-4 text-gray-500' />
                  <Input
                    placeholder='Search products...'
                    className='pl-10'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Category Filter */}
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className='w-full sm:w-48'>
                    <Filter className='h-4 w-4 mr-2' />
                    <SelectValue placeholder='Category' />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className='flex items-center gap-2'>
                          {category.icon && <span>{category.icon}</span>}
                          <span>{category.label}</span>
                          {category.count !== undefined && (
                            <span className='text-gray-500 text-xs'>({category.count})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <ToggleGroup
                  type='single'
                  value={viewMode}
                  onValueChange={(value) =>
                    value && setViewMode(value as 'grid' | 'list')
                  }
                >
                  <ToggleGroupItem value='grid' aria-label='Grid view'>
                    <Grid3X3 className='h-4 w-4' />
                  </ToggleGroupItem>
                  <ToggleGroupItem value='list' aria-label='List view'>
                    <List className='h-4 w-4' />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Products Grid/List */}
              {loading ? (
                <StreamingLoader 
                  type="products" 
                  count={viewMode === 'grid' ? 8 : 5}
                  className="fade-in-up"
                />
              ) : filteredProducts.length === 0 ? (
                <div className='text-center py-12'>
                  <Package className='h-12 w-12 mx-auto text-gray-500 mb-4' />
                  <h3 className='text-lg font-semibold mb-2'>
                    No products found
                  </h3>
                  <p className='text-gray-500'>
                    {searchQuery || selectedCategory !== 'All'
                      ? 'Try adjusting your search or filters'
                      : 'Start by adding your first product'}
                  </p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                      : 'space-y-4'
                  }
                >
                  {filteredProducts.map((product, index) => (
                    <ProgressiveLoader
                      key={product.id}
                      delay={index * 50} // Stagger loading for smooth effect
                      fallback={<div className='h-64 w-full rounded-lg bg-muted animate-pulse' />}
                    >
                      <ProductCard
                        product={product}
                        viewMode={viewMode}
                        onAddToSite={handleAddToSite}
                        onRemoveFromSite={handleRemoveFromSite}
                        showSelection={showBulkSelection}
                        onEdit={canEdit ? handleProductEdit : undefined}
                        isEditLoading={productEdit.isPending}
                      />
                    </ProgressiveLoader>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar />

      {/* Import/Export Dialog */}
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        selectedProductIds={selectedIds}
      />

      {/* Product Edit Modal */}
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
})

const ProductsPage = memo(() => {
  return (
    <ProductSelectionProvider>
      <ProductsPageContent />
    </ProductSelectionProvider>
  );
})

export default ProductsPage
