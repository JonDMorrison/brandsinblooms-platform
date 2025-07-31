'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star, 
  StarOff,
  Package,
  PackageX,
  MoreHorizontal,
  RefreshCw,
  Download,
  Upload,
  AlertCircle,
  CheckSquare,
  Square,
  DollarSign,
  Tag
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Badge } from '@/src/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table'
import { Checkbox } from '@/src/components/ui/checkbox'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog'
import { Separator } from '@/src/components/ui/separator'
import { toast } from 'sonner'
import { 
  getSiteProducts,
  updateProduct,
  bulkUpdateProducts,
  deleteProducts,
  getProductCategories,
  getProductAnalytics,
  exportProductsToCSV,
  type ProductWithSite,
  type ProductSearchFilters,
  type ProductBulkUpdate,
  type ProductAnalytics,
  AdminProductError
} from '@/src/lib/admin/products'

interface SiteProductManagerProps {
  siteId: string
  siteName: string
}

export function SiteProductManager({ siteId, siteName }: SiteProductManagerProps) {
  const [products, setProducts] = useState<ProductWithSite[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ProductSearchFilters>({})
  const [categories, setCategories] = useState<{
    categories: string[]
    subcategories: Record<string, string[]>
  }>({ categories: [], subcategories: {} })
  const [analytics, setAnalytics] = useState<ProductAnalytics | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  
  // Dialog states
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithSite | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  
  // Form states
  const [bulkUpdates, setBulkUpdates] = useState<ProductBulkUpdate>({})
  const [editForm, setEditForm] = useState({
    name: '',
    sku: '',
    category: '',
    subcategory: '',
    price: '',
    sale_price: '',
    is_active: false,
    is_featured: false,
    in_stock: false,
    stock_status: ''
  })
  const [adminNotes, setAdminNotes] = useState('')

  const router = useRouter()

  const limit = 25

  // Load product data
  const loadProducts = useCallback(async (page: number = 1, resetData: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      const response = await getSiteProducts(siteId, page, limit, {
        search: searchQuery || undefined,
        ...filters
      })

      if (resetData || page === 1) {
        setProducts(response.products)
        setSelectedProducts([])
      } else {
        setProducts(prev => [...prev, ...response.products])
      }

      setTotalCount(response.total_count)
      setHasMore(response.has_more)
      setCurrentPage(page)
    } catch (err) {
      const errorMessage = err instanceof AdminProductError 
        ? err.message 
        : 'Failed to load products'
      setError(errorMessage)
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [siteId, searchQuery, filters, toast])

  // Load categories and analytics
  const loadMetadata = useCallback(async () => {
    try {
      const [categoriesResponse, analyticsResponse] = await Promise.all([
        getProductCategories(siteId),
        getProductAnalytics(siteId)
      ])
      
      setCategories(categoriesResponse)
      setAnalytics(analyticsResponse)
    } catch (err) {
      console.error('Failed to load metadata:', err)
    }
  }, [siteId])

  // Initial load
  useEffect(() => {
    loadProducts(1, true)
    loadMetadata()
  }, [loadProducts, loadMetadata])

  // Handle search
  const handleSearch = useCallback(() => {
    setCurrentPage(1)
    loadProducts(1, true)
  }, [loadProducts])

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<ProductSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }, [])

  // Apply filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProducts(1, true)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [filters, loadProducts])

  // Handle product selection
  const handleSelectProduct = (productId: string, selected: boolean) => {
    if (selected) {
      setSelectedProducts(prev => [...prev, productId])
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId))
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedProducts(products.map(item => item.id))
    } else {
      setSelectedProducts([])
    }
  }

  // Handle individual product actions
  const handleToggleActive = async (product: ProductWithSite) => {
    try {
      await updateProduct(
        product.id,
        { is_active: !product.is_active },
        `${product.is_active ? 'Deactivated' : 'Activated'} product: ${product.name}`
      )
      
      loadProducts(currentPage, false)
      toast.success(`Success: Product ${product.is_active ? 'deactivated' : 'activated'} successfully`)
    } catch (err) {
      const errorMessage = err instanceof AdminProductError 
        ? err.message 
        : 'Failed to update product'
      toast.error(`Error: ${errorMessage}`)
    }
  }

  const handleToggleFeatured = async (product: ProductWithSite) => {
    try {
      await updateProduct(
        product.id,
        { is_featured: !product.is_featured },
        `${product.is_featured ? 'Removed from featured' : 'Added to featured'} product: ${product.name}`
      )
      
      loadProducts(currentPage, false)
      toast.success(`Success: Product ${product.is_featured ? 'removed from featured' : 'featured'} successfully`)
    } catch (err) {
      const errorMessage = err instanceof AdminProductError 
        ? err.message 
        : 'Failed to update product'
      toast.error(`Error: ${errorMessage}`)
    }
  }

  const handleToggleStock = async (product: ProductWithSite) => {
    try {
      await updateProduct(
        product.id,
        { 
          in_stock: !product.in_stock,
          stock_status: !product.in_stock ? 'in_stock' : 'out_of_stock'
        },
        `${product.in_stock ? 'Marked out of stock' : 'Marked in stock'}: ${product.name}`
      )
      
      loadProducts(currentPage, false)
      toast.success(`Success: Product marked as ${product.in_stock ? 'out of stock' : 'in stock'}`)
    } catch (err) {
      const errorMessage = err instanceof AdminProductError 
        ? err.message 
        : 'Failed to update product'
      toast.error(`Error: ${errorMessage}`)
    }
  }

  // Handle edit product
  const handleEditProduct = (product: ProductWithSite) => {
    setEditingProduct(product)
    setEditForm({
      name: product.name,
      sku: product.sku || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      price: product.price?.toString() || '',
      sale_price: product.sale_price?.toString() || '',
      is_active: product.is_active || false,
      is_featured: product.is_featured || false,
      in_stock: product.in_stock || false,
      stock_status: product.stock_status || ''
    })
    setAdminNotes('')
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!editingProduct) return

    try {
      const updates: any = {
        name: editForm.name,
        sku: editForm.sku || null,
        category: editForm.category || null,
        subcategory: editForm.subcategory || null,
        is_active: editForm.is_active,
        is_featured: editForm.is_featured,
        in_stock: editForm.in_stock,
        stock_status: editForm.stock_status || null
      }

      if (editForm.price) {
        updates.price = parseFloat(editForm.price)
      }

      if (editForm.sale_price) {
        updates.sale_price = parseFloat(editForm.sale_price)
      }

      await updateProduct(
        editingProduct.id,
        updates,
        adminNotes || `Updated product: ${editForm.name}`
      )
      
      setShowEditDialog(false)
      setEditingProduct(null)
      loadProducts(currentPage, false)
      toast.success('Success: Product updated successfully')
    } catch (err) {
      const errorMessage = err instanceof AdminProductError 
        ? err.message 
        : 'Failed to update product'
      toast.error(`Error: ${errorMessage}`)
    }
  }

  // Handle bulk operations
  const handleBulkUpdate = async () => {
    if (selectedProducts.length === 0) return

    try {
      const result = await bulkUpdateProducts(
        selectedProducts,
        bulkUpdates,
        adminNotes || `Bulk update of ${selectedProducts.length} products`
      )
      
      setShowBulkUpdateDialog(false)
      setBulkUpdates({})
      setAdminNotes('')
      loadProducts(currentPage, false)
      toast.success(`Success: Updated ${result.updated_count} of ${result.total_requested} products`)
    } catch (err) {
      const errorMessage = err instanceof AdminProductError 
        ? err.message 
        : 'Failed to bulk update products'
      toast.error(`Error: ${errorMessage}`)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return

    try {
      const result = await deleteProducts(
        selectedProducts,
        adminNotes || `Bulk deletion of ${selectedProducts.length} products`
      )
      
      setShowDeleteDialog(false)
      setAdminNotes('')
      setSelectedProducts([])
      loadProducts(currentPage, false)
      toast.success(`Success: Deleted ${result.updated_count} of ${result.total_requested} products`)
    } catch (err) {
      const errorMessage = err instanceof AdminProductError 
        ? err.message 
        : 'Failed to delete products'
      toast.error(`Error: ${errorMessage}`)
    }
  }

  // Handle export
  const handleExport = async () => {
    try {
      const csvContent = await exportProductsToCSV(siteId, filters)
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${siteName.replace(/\s+/g, '_')}_products_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      setShowExportDialog(false)
      toast.success('Success: Products exported successfully')
    } catch (err) {
      const errorMessage = err instanceof AdminProductError 
        ? err.message 
        : 'Failed to export products'
      toast.error(`Error: ${errorMessage}`)
    }
  }

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadProducts(currentPage + 1, false)
    }
  }

  const getStatusBadge = (product: ProductWithSite) => {
    if (!product.is_active) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (product.is_featured) {
      return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Featured</Badge>
    }
    if (!product.in_stock) {
      return <Badge variant="destructive">Out of Stock</Badge>
    }
    return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>
  }

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Product Management</h2>
          <p className="text-muted-foreground">
            Manage products for {siteName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowExportDialog(true)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => loadProducts(1, true)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push(`/admin/sites/${siteId}/products/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_products}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.active_products}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.featured_products}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <PackageX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.out_of_stock_products}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Products</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search by name, SKU, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Category</Label>
              <Select
                value={filters.category || ''}
                onValueChange={(value) => handleFilterChange({ 
                  category: value || undefined,
                  subcategory: undefined // Reset subcategory when category changes
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subcategory</Label>
              <Select
                value={filters.subcategory || ''}
                onValueChange={(value) => handleFilterChange({ 
                  subcategory: value || undefined 
                })}
                disabled={!filters.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subcategories</SelectItem>
                  {filters.category && categories.subcategories[filters.category]?.map((subcategory) => (
                    <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => handleFilterChange({ 
                  status: (value || undefined) as 'active' | 'inactive' | 'featured' | 'out_of_stock' | undefined
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({})
                  setSearchQuery('')
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="price-min">Min Price</Label>
              <Input
                id="price-min"
                type="number"
                placeholder="0.00"
                value={filters.price_min?.toString() || ''}
                onChange={(e) => handleFilterChange({ 
                  price_min: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
              />
            </div>
            <div>
              <Label htmlFor="price-max">Max Price</Label>
              <Input
                id="price-max"
                type="number"
                placeholder="1000.00"
                value={filters.price_max?.toString() || ''}
                onChange={(e) => handleFilterChange({ 
                  price_max: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedProducts.length} product{selectedProducts.length === 1 ? '' : 's'} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkUpdateDialog(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bulk Update
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => loadProducts(1, true)}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked) => 
                            handleSelectProduct(product.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.sku && `SKU: ${product.sku}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{product.category || '—'}</div>
                        {product.subcategory && (
                          <div className="text-sm text-muted-foreground">
                            {product.subcategory}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatPrice(product.price)}</div>
                        {product.sale_price && (
                          <div className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.sale_price)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(product)}</TableCell>
                      <TableCell>
                        {product.in_stock ? (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            In Stock
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(product.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(product)}>
                              {product.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleFeatured(product)}>
                              {product.is_featured ? (
                                <>
                                  <StarOff className="h-4 w-4 mr-2" />
                                  Remove Featured
                                </>
                              ) : (
                                <>
                                  <Star className="h-4 w-4 mr-2" />
                                  Add Featured
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStock(product)}>
                              {product.in_stock ? (
                                <>
                                  <PackageX className="h-4 w-4 mr-2" />
                                  Mark Out of Stock
                                </>
                              ) : (
                                <>
                                  <Package className="h-4 w-4 mr-2" />
                                  Mark In Stock
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedProducts([product.id])
                                setShowDeleteDialog(true)
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {hasMore && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-sku">SKU</Label>
                <Input
                  id="edit-sku"
                  value={editForm.sku}
                  onChange={(e) => setEditForm(prev => ({ ...prev, sku: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm(prev => ({ 
                    ...prev, 
                    category: value,
                    subcategory: '' // Reset subcategory when category changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No category</SelectItem>
                    {categories.categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-subcategory">Subcategory</Label>
                <Select
                  value={editForm.subcategory}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, subcategory: value }))}
                  disabled={!editForm.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No subcategory</SelectItem>
                    {editForm.category && categories.subcategories[editForm.category]?.map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-sale-price">Sale Price</Label>
                <Input
                  id="edit-sale-price"
                  type="number"
                  step="0.01"
                  value={editForm.sale_price}
                  onChange={(e) => setEditForm(prev => ({ ...prev, sale_price: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-active"
                  checked={editForm.is_active}
                  onCheckedChange={(checked) => 
                    setEditForm(prev => ({ ...prev, is_active: checked as boolean }))
                  }
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-featured"
                  checked={editForm.is_featured}
                  onCheckedChange={(checked) => 
                    setEditForm(prev => ({ ...prev, is_featured: checked as boolean }))
                  }
                />
                <Label htmlFor="edit-featured">Featured</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-in-stock"
                  checked={editForm.in_stock}
                  onCheckedChange={(checked) => 
                    setEditForm(prev => ({ ...prev, in_stock: checked as boolean }))
                  }
                />
                <Label htmlFor="edit-in-stock">In Stock</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-notes">Admin Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Optional notes about this change..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={showBulkUpdateDialog} onOpenChange={setShowBulkUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Products</DialogTitle>
            <DialogDescription>
              Update {selectedProducts.length} selected products
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulk-category">Category</Label>
                <Select
                  value={bulkUpdates.category || ''}
                  onValueChange={(value) => setBulkUpdates(prev => ({ 
                    ...prev, 
                    category: value || undefined 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No change" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No change</SelectItem>
                    {categories.categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bulk-subcategory">Subcategory</Label>
                <Select
                  value={bulkUpdates.subcategory || ''}
                  onValueChange={(value) => setBulkUpdates(prev => ({ 
                    ...prev, 
                    subcategory: value || undefined 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No change" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No change</SelectItem>
                    {bulkUpdates.category && categories.subcategories[bulkUpdates.category]?.map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulk-active"
                  checked={bulkUpdates.is_active || false}
                  onCheckedChange={(checked) => 
                    setBulkUpdates(prev => ({ ...prev, is_active: checked as boolean }))
                  }
                />
                <Label htmlFor="bulk-active">Set as Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulk-featured"
                  checked={bulkUpdates.is_featured || false}
                  onCheckedChange={(checked) => 
                    setBulkUpdates(prev => ({ ...prev, is_featured: checked as boolean }))
                  }
                />
                <Label htmlFor="bulk-featured">Set as Featured</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulk-in-stock"
                  checked={bulkUpdates.in_stock || false}
                  onCheckedChange={(checked) => 
                    setBulkUpdates(prev => ({ ...prev, in_stock: checked as boolean }))
                  }
                />
                <Label htmlFor="bulk-in-stock">Set as In Stock</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="bulk-notes">Admin Notes</Label>
              <Textarea
                id="bulk-notes"
                placeholder="Reason for bulk update..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkUpdateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdate}>
              Update {selectedProducts.length} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Products</DialogTitle>
            <DialogDescription>
              Export products matching your current filters to CSV
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will export all products that match your current search and filter criteria.
              The exported file will include product details, pricing, categories, and stock information.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Products</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProducts.length} product{selectedProducts.length === 1 ? '' : 's'}?
              This will deactivate the products and mark them as deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <Label htmlFor="delete-notes">Reason for deletion</Label>
            <Textarea
              id="delete-notes"
              placeholder="Optional reason for deletion..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdminNotes('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
              Delete {selectedProducts.length} Product{selectedProducts.length === 1 ? '' : 's'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}