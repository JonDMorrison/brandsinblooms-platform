'use client'

import { useState, useEffect } from 'react'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { useCartContext } from '@/src/contexts/CartContext'
import { useSupabase } from '@/hooks/useSupabase'
import { Tables } from '@/src/lib/database/types'
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
import Image from 'next/image'
import { cn } from '@/src/lib/utils'
import { formatPrice } from '@/src/lib/utils/format'
import { toast } from 'sonner'

type Product = Tables<'products'>

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
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [filterCategory, setFilterCategory] = useState(categoryId || '')
  
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
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
        // Fetch products
        let query = supabase
          .from('products')
          .select('*')
          .eq('site_id', site.id)
          .eq('is_active', true)
        
        if (filterCategory) {
          query = query.eq('category_id', filterCategory)
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
        setProducts(productsData || [])

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
  
  // Filter products by search query
  const filteredProducts = products?.filter(product => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      product.name?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    )
  }) || []
  
  const handleAddToCart = async (product: Product) => {
    try {
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
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
  product: Product
  onAddToCart: (product: Product) => void
}

function ProductGridCard({ product, onAddToCart }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <Card 
      className="group cursor-pointer overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square bg-muted">
        {product.images && Array.isArray(product.images) && (product.images as any[])[0]?.url ? (
          <Image
            src={(product.images as any[])[0].url}
            alt={product.name || ''}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ShoppingCart className="h-12 w-12 text-gray-500" />
          </div>
        )}
        
        {/* Quick Actions */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9"
              onClick={(e) => {
                e.stopPropagation()
                // TODO: Implement quick view
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9"
              onClick={(e) => {
                e.stopPropagation()
                // TODO: Implement favorites
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Badges */}
        {product.is_featured && (
          <Badge className="absolute top-2 left-2">Featured</Badge>
        )}
        {product.inventory_count === 0 && (
          <Badge variant="destructive" className="absolute top-2 right-2">
            Out of Stock
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4 space-y-2">
        <h3 className="font-medium line-clamp-1">{product.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
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
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart(product)
            }}
            disabled={product.inventory_count === 0}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ProductListCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="relative w-32 h-32 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {product.images && Array.isArray(product.images) && (product.images as any[])[0]?.url ? (
            <Image
              src={(product.images as any[])[0].url}
              alt={product.name || ''}
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
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
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