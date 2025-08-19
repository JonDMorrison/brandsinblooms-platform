'use client';

import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useProducts,
  useProductCategories,
  useUpdateProduct,
} from '@/src/hooks/useProducts';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/src/components/ui/skeleton';
import {
  ProductSelectionProvider,
  useProductSelection,
} from '@/src/contexts/ProductSelectionContext';
import { BulkActionsToolbar } from '@/src/components/products/BulkActionsToolbar';
import { ImportExportDialog } from '@/src/components/products/ImportExportDialog';

// Lazy load the ProductCard component
const ProductCard = lazy(() =>
  import('@/src/components/ProductCard').then((module) => ({
    default: module.ProductCard,
  }))
);

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

function ProductsPageContent() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('catalogue');

  // Fetch real product data
  const { data: productsResponse, isLoading } = useProducts();
  const { data: categoriesData = [] } = useProductCategories();
  const updateProduct = useUpdateProduct();

  // Extract products array from response
  const products = Array.isArray(productsResponse)
    ? productsResponse
    : productsResponse?.data || [];

  // Transform products to display format
  const displayProducts: ProductDisplay[] = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      originalPrice: product.compare_at_price || undefined,
      rating: product.rating || 0,
      reviews: product.review_count || 0,
      category: product.category || 'Uncategorized',
      stock:
        product.inventory_count === 0
          ? 'out-of-stock'
          : product.inventory_count < 10
          ? 'low-stock'
          : 'in-stock',
      image: product.images?.[0] || '/images/placeholders/product-default.svg',
      featured: product.is_featured || false,
      addedToSite: product.is_active || false,
    }));
  }, [products]);

  const categories = useMemo(() => {
    const categoryStrings = categoriesData
      .map((cat) => (typeof cat === 'string' ? cat : cat.category))
      .filter(Boolean);
    const uniqueCategories = Array.from(new Set(categoryStrings));
    return ['All', ...uniqueCategories];
  }, [categoriesData]);

  // Memoize filtered products to prevent unnecessary recalculations
  const filteredProducts = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return displayProducts.filter((product) => {
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower);
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;
      const matchesTab =
        activeTab === 'catalogue' ||
        (activeTab === 'my-products' && product.addedToSite);

      return matchesSearch && matchesCategory && matchesTab;
    });
  }, [displayProducts, searchQuery, selectedCategory, activeTab]);

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

  // Memoize stats calculations
  const stats = useMemo(() => {
    const totalProducts = displayProducts.length;
    const siteProducts = displayProducts.filter((p) => p.addedToSite);
    const addedToSite = siteProducts.length;
    const totalRevenue = siteProducts.reduce((sum, p) => sum + p.price, 0);
    const avgRating =
      totalProducts > 0
        ? displayProducts.reduce((sum, p) => sum + p.rating, 0) / totalProducts
        : 0;

    return { totalProducts, addedToSite, totalRevenue, avgRating };
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
          <p className='text-muted-foreground'>
            Manage your product catalog and site products
          </p>
        </div>
        <div className='flex gap-2'>
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
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <Skeleton className='h-9 w-9 rounded-md' />
                  <div className='space-y-2'>
                    <Skeleton className='h-3 w-20' />
                    <Skeleton className='h-6 w-12' />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className='fade-in-up' style={{ animationDelay: '0.2s' }}>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-blue-100 rounded-md'>
                    <Package className='h-5 w-5 text-blue-600' />
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>
                      Total Products
                    </p>
                    <p className='text-xl font-bold'>{stats.totalProducts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='fade-in-up' style={{ animationDelay: '0.3s' }}>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-green-100 rounded-md'>
                    <ShoppingCart className='h-5 w-5 text-green-600' />
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>On Site</p>
                    <p className='text-xl font-bold'>{stats.addedToSite}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='fade-in-up' style={{ animationDelay: '0.4s' }}>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-purple-100 rounded-md'>
                    <DollarSign className='h-5 w-5 text-purple-600' />
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Total Value</p>
                    <p className='text-xl font-bold'>
                      ${stats.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='fade-in-up' style={{ animationDelay: '0.5s' }}>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-yellow-100 rounded-md'>
                    <Star className='h-5 w-5 text-yellow-600' />
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Avg Rating</p>
                    <p className='text-xl font-bold'>
                      {stats.avgRating.toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

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
                My Products ({stats.addedToSite})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className='space-y-4'>
              {/* Bulk Selection Header */}
              {showBulkSelection && (
                <div className='flex items-center gap-4 p-3 bg-blue-50 rounded-lg'>
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = indeterminate;
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
                  <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
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
                      <SelectItem key={category} value={category}>
                        {category}
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
              {isLoading ? (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                      : 'space-y-4'
                  }
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className='h-64 w-full rounded-lg' />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className='text-center py-12'>
                  <Package className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                  <h3 className='text-lg font-semibold mb-2'>
                    No products found
                  </h3>
                  <p className='text-muted-foreground'>
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
                  {filteredProducts.map((product) => (
                    <Suspense
                      key={product.id}
                      fallback={
                        <div className='h-64 w-full rounded-lg bg-muted animate-pulse' />
                      }
                    >
                      <ProductCard
                        product={product}
                        viewMode={viewMode}
                        onAddToSite={handleAddToSite}
                        onRemoveFromSite={handleRemoveFromSite}
                        showSelection={showBulkSelection}
                      />
                    </Suspense>
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
    </div>
  );
}

export default function ProductsPage() {
  return (
    <ProductSelectionProvider>
      <ProductsPageContent />
    </ProductSelectionProvider>
  );
}
