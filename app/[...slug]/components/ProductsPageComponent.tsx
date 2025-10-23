'use client'

import { useFeaturedProducts } from '@/src/hooks/useProducts'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { useSupabase } from '@/hooks/useSupabase'
import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { ProductCatalog } from '@/src/components/site/ProductCatalog'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { ShoppingCart, Sparkles, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Tables } from '@/lib/database/types'
import { useCartContext } from '@/src/contexts/CartContext'
import { formatPrice } from '@/src/lib/utils/format'
import { toast } from 'sonner'

type ProductCategory = Tables<'product_categories'>

export function ProductsPageComponent() {
  const { currentSite: site } = useSiteContext()
  const supabase = useSupabase()
  const { data: featuredProducts, loading: isFeaturedLoading } =
    useFeaturedProducts(4)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true)

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!site?.id) {
        setCategories([])
        setIsCategoriesLoading(false)
        return
      }

      setIsCategoriesLoading(true)
      try {
        const { data, error } = await supabase
          .from('product_categories')
          .select('*')
          .eq('site_id', site.id)
          .eq('is_active', true)
          .is('parent_id', null) // Only top-level categories
          .order('sort_order', { ascending: true })
          .limit(8)

        if (error) throw error
        setCategories(data || [])
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        setCategories([])
      } finally {
        setIsCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [site?.id, supabase])

  if (!site) {
    return null
  }

  return (
    <SiteRenderer siteId={site.id} mode="live" showNavigation={true}>
      <div className="brand-container">
        {/* Hero Section */}
        <div className="py-12 mb-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4" variant="secondary">
              <Sparkles className="h-3 w-3 mr-1" />
              Our Collection
            </Badge>
            <h1
              className="text-4xl lg:text-5xl font-bold mb-4"
              style={{
                color: 'var(--theme-text)',
                fontFamily: 'var(--theme-font-heading)',
              }}
            >
              Discover Beautiful Plants
            </h1>
            <p
              className="text-lg text-gray-600 mb-8"
              style={{ fontFamily: 'var(--theme-font-body)' }}
            >
              Browse our curated selection of healthy, vibrant plants perfect for
              your home and garden. From beginner-friendly to rare specimens,
              find your next green companion.
            </p>
          </div>
        </div>

        {/* Featured Products Section */}
        {!isFeaturedLoading &&
          featuredProducts &&
          featuredProducts.data.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-2xl font-bold"
                  style={{
                    color: 'var(--theme-text)',
                    fontFamily: 'var(--theme-font-heading)',
                  }}
                >
                  Featured Products
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {featuredProducts.data.map((product) => (
                  <FeaturedProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

        {/* Categories Grid */}
        {!isCategoriesLoading && categories.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-2xl font-bold"
                style={{
                  color: 'var(--theme-text)',
                  fontFamily: 'var(--theme-font-heading)',
                }}
              >
                Shop by Category
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        )}

        {/* All Products Section */}
        <div>
          <h2
            className="text-2xl font-bold mb-6"
            style={{
              color: 'var(--theme-text)',
              fontFamily: 'var(--theme-font-heading)',
            }}
          >
            All Products
          </h2>
          <ProductCatalog />
        </div>
      </div>
    </SiteRenderer>
  )
}

// Featured Product Card
function FeaturedProductCard({ product }: { product: Tables<'products'> }) {
  const { addItem } = useCartContext()
  const [isAdding, setIsAdding] = useState(false)

  const firstImage =
    product.images &&
    Array.isArray(product.images) &&
    (product.images as Array<{ url: string }>)[0]?.url

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsAdding(true)
    try {
      await addItem(product, 1)
      toast.success(`${product.name} added to cart`)
    } catch {
      toast.error('Failed to add to cart')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all">
        <div className="relative aspect-square bg-muted">
          {firstImage ? (
            <Image
              src={firstImage}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <Badge className="absolute top-2 left-2">Featured</Badge>
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-medium line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">
                {formatPrice(product.price || 0)}
              </p>
              {product.compare_at_price &&
                product.compare_at_price > (product.price || 0) && (
                  <p className="text-sm text-gray-500 line-through">
                    {formatPrice(product.compare_at_price)}
                  </p>
                )}
            </div>
            <Button
              size="icon"
              variant="secondary"
              onClick={handleAddToCart}
              disabled={isAdding || !product.inventory_count}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Category Card
function CategoryCard({ category }: { category: ProductCategory }) {
  return (
    <Link href={`/category/${category.slug}`}>
      <Card className="group cursor-pointer overflow-hidden hover:shadow-md transition-all h-full">
        {category.image_url && (
          <div className="relative aspect-video bg-muted">
            <Image
              src={category.image_url}
              alt={category.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            {category.icon && (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                style={{
                  backgroundColor: category.color || '#f3f4f6',
                }}
              >
                {category.icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-gray-600 line-clamp-1">
                  {category.description}
                </p>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
