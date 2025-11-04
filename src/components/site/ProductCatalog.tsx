'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { useCartContext } from '@/src/contexts/CartContext'
import { useSupabase } from '@/hooks/useSupabase'
import { Tables } from '@/src/lib/database/types'
import { Product } from '@/src/lib/database/aliases'
import { filterProductsBySearch } from '@/src/lib/products/search-utils'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Skeleton } from '@/src/components/ui/skeleton'
import {
  Grid3X3,
  List,
  Search,
  SlidersHorizontal,
  ShoppingCart,
  Star,
  Heart,
  Eye
} from 'lucide-react'
import { ProductCard } from '@/src/components/ProductCard'
import { transformProductForDisplay } from '@/src/lib/utils/product-transformer'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/src/lib/utils'
import { formatPrice } from '@/src/lib/utils/format'
import { toast } from 'sonner'

type ProductImage = Tables<'product_images'>
type ProductCategory = Tables<'product_categories'>

interface ProductWithImages extends Product {
  product_images?: ProductImage[]
  primary_category?: ProductCategory | null
}

interface ProductCatalogProps {
  categoryId?: string
  featured?: boolean
  limit?: number
  className?: string
}

export function ProductCatalog({
  categoryId,
  featured,
  limit,
  className
}: ProductCatalogProps) {
  const { currentSite: site } = useSiteContext()
  const { addItem } = useCartContext()
  const supabase = useSupabase()
  const searchParams = useSearchParams()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState(() => {
    // Initialize search query from URL parameter 'q'
    return searchParams.get('q') || ''
  })
  const [sortBy, setSortBy] = useState('name')
  const [filterCategory, setFilterCategory] = useState(categoryId || 'all')
  
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [categories, setCategories] = useState<Tables<'product_categories'>[]>([])
  const [categoryProductCounts, setCategoryProductCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Fetch products and categories when dependencies change
  useEffect(() => {
    const fetchData = async () => {
      if (!site?.id) {
        setProducts([])
        setCategories([])
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      try {
        // Fetch products with images and category
        let query = supabase
          .from('products')
          .select(`
            *,
            product_images (
              id,
              url,
              position,
              is_primary,
              alt_text
            ),
            primary_category:product_categories!products_primary_category_id_fkey (
              id,
              name,
              slug
            )
          `)
          .eq('site_id', site.id)
          .eq('is_active', true)
        
        if (filterCategory && filterCategory !== 'all') {
          query = query.eq('primary_category_id', filterCategory)
        }
        
        if (featured) {
          query = query.eq('is_featured', true)
        }
        
        // Apply sorting
        switch (sortBy) {
          case 'price_asc':
            query = query.order('price', { ascending: true })
            break
          case 'price_desc':
            query = query.order('price', { ascending: false })
            break
          case 'name':
            query = query.order('name', { ascending: true })
            break
          case 'newest':
            query = query.order('created_at', { ascending: false })
            break
          default:
            query = query.order('display_order', { ascending: true })
        }
        
        if (limit) {
          query = query.limit(limit)
        }
        
        const { data: productsData, error: productsError } = await query

        if (productsError) throw productsError

        // Sort product images by primary first, then position
        const productsWithSortedImages = (productsData || []).map((product) => {
          if (product.product_images && Array.isArray(product.product_images)) {
            product.product_images.sort((a, b) => {
              if (a.is_primary && !b.is_primary) return -1
              if (!a.is_primary && b.is_primary) return 1
              return (a.position ?? 999) - (b.position ?? 999)
            })
          }
          return product
        })

        setProducts(productsWithSortedImages as ProductWithImages[])

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('product_categories')
          .select('*')
          .eq('site_id', site.id)
          .order('name')
        
        if (categoriesError) {
          console.error('Failed to load categories:', categoriesError)
        } else {
          setCategories(categoriesData || [])
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [site?.id, filterCategory, featured, sortBy, limit])

  // Fetch product counts for category dropdown
  useEffect(() => {
    const fetchProductCounts = async () => {
      if (!site?.id) {
        setCategoryProductCounts({})
        return
      }

      try {
        // Fetch lightweight product data for counting (only id and category_id)
        const { data: productsData, error } = await supabase
          .from('products')
          .select('id, primary_category_id')
          .eq('site_id', site.id)
          .eq('is_active', true)

        if (error) throw error

        // Count products per category
        const counts: Record<string, number> = {}
        productsData?.forEach((product) => {
          if (product.primary_category_id) {
            const categoryId = product.primary_category_id
            counts[categoryId] = (counts[categoryId] || 0) + 1
          }
        })

        setCategoryProductCounts(counts)
      } catch (error) {
        console.error('Failed to fetch product counts:', error)
        setCategoryProductCounts({})
      }
    }

    fetchProductCounts()
  }, [site?.id, supabase])

  // Filter products by search query (includes name, description, and category)
  const filteredProducts = filterProductsBySearch(
    products || [],
    searchQuery,
    (product) => product.primary_category?.name || ''
  )
  
  const handleAddToCart = async (product: ProductWithImages) => {
    try {
      // ProductWithImages extends Product, so we can pass it directly
      await addItem(product, 1)
      toast.success(`${product.name} added to cart`)
    } catch (error) {
      toast.error('Failed to add item to cart')
    }
  }
  
  if (isLoading) {
    return <ProductCatalogSkeleton viewMode={viewMode} />
  }
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Category Filter */}
        {categories && categories.length > 0 && (
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Categories ({Object.values(categoryProductCounts).reduce((sum, count) => sum + count, 0)})
              </SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name} ({categoryProductCounts[category.id] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>
        
        {/* View Mode Toggle */}
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Results Count */}
      <div className="text-sm text-gray-500">
        Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
      </div>
      
      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {filteredProducts.map((product) => (
            <ProductGridCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <ProductListCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ProductCardProps {
  product: ProductWithImages
  onAddToCart: (product: ProductWithImages) => void
}

function ProductGridCard({ product, onAddToCart }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async (productId: string) => {
    setIsAdding(true)
    try {
      await onAddToCart(product)
    } finally {
      setIsAdding(false)
    }
  }

  // Transform database product to display format
  const displayProduct = transformProductForDisplay(product)

  return (
    <Link href={`/products/${product.slug || product.id}`} className="block">
      <ProductCard
        product={displayProduct}
        showAddToCart={true}
        onAddToCart={handleAddToCart}
        isAddingToCart={isAdding}
      />
    </Link>
  )
}

function ProductListCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="relative w-32 h-32 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {product.product_images && product.product_images.length > 0 ? (
            <Image
              src={product.product_images[0].url}
              alt={product.product_images[0].alt_text || product.name || 'Product image'}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ShoppingCart className="h-8 w-8 text-gray-500" />
            </div>
          )}
        </div>
        
        {/* Details */}
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="font-medium">{product.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">
              {product.description}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {product.is_featured && (
              <Badge>Featured</Badge>
            )}
            {product.inventory_count === 0 && (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">
                {formatPrice(product.price || 0)}
              </p>
              {product.compare_at_price && product.compare_at_price > (product.price || 0) && (
                <p className="text-sm text-gray-500 line-through">
                  {formatPrice(product.compare_at_price)}
                </p>
              )}
            </div>
            
            <Button
              onClick={() => onAddToCart(product)}
              disabled={product.inventory_count === 0}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function ProductCatalogSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-square" />
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex gap-4">
            <Skeleton className="w-32 h-32 rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex justify-between items-center pt-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}