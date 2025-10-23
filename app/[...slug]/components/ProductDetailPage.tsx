'use client'

import { useState } from 'react'
import { useProduct } from '@/src/hooks/useProduct'
import { useRelatedProducts } from '@/src/hooks/useRelatedProducts'
import { useCartContext } from '@/src/contexts/CartContext'
import { ProductImageGallery } from '@/src/components/products/ProductImageGallery'
import { QuantitySelector } from '@/src/components/products/QuantitySelector'
import { StockBadge } from '@/src/components/products/StockBadge'
import { Breadcrumbs, BreadcrumbItem } from '@/src/components/products/Breadcrumbs'
import { Button } from '@/src/components/ui/button'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { ShoppingCart, Star, Package } from 'lucide-react'
import { formatPrice } from '@/src/lib/utils/format'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'

interface ProductDetailPageClientProps {
  slug: string
}

export function ProductDetailPageClient({ slug }: ProductDetailPageClientProps) {
  const { data: product, loading: isLoading, error } = useProduct(slug)
  const { data: relatedProducts } = useRelatedProducts(
    product?.id || null,
    product?.primary_category?.id || null,
    4
  )
  const { addItem } = useCartContext()

  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const handleAddToCart = async () => {
    if (!product) return

    setIsAddingToCart(true)
    try {
      // Extract base product fields for cart (remove relations)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { product_images, primary_category, product_category_assignments, ...productForCart } = product

      await addItem(productForCart, quantity)
      toast.success(`${product.name} added to cart`)
      setQuantity(1) // Reset quantity after adding
    } catch {
      toast.error('Failed to add item to cart')
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Build breadcrumbs
  const breadcrumbItems: BreadcrumbItem[] = []
  breadcrumbItems.push({ label: 'Products', href: '/products' })
  if (product?.primary_category) {
    breadcrumbItems.push({
      label: product.primary_category.name,
      href: `/category/${product.primary_category.slug}`,
    })
  }
  if (product) {
    breadcrumbItems.push({ label: product.name, href: `/products/${product.slug}` })
  }

  return (
    <div className="brand-container py-8">
        {/* Breadcrumbs */}
        {!isLoading && product && (
          <Breadcrumbs items={breadcrumbItems} className="mb-6" />
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
            <p className="text-gray-500 mb-6">
              The product you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/products">Browse All Products</Link>
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && <ProductDetailSkeleton />}

        {/* Product Content */}
        {!isLoading && product && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
              {/* Left Column - Images */}
              <div>
                <ProductImageGallery
                  images={product.product_images || []}
                  productName={product.name}
                />
              </div>

              {/* Right Column - Product Info */}
              <div className="space-y-6">
                {/* Product Title & Badges */}
                <div>
                  {product.is_featured && (
                    <Badge className="mb-2">Featured</Badge>
                  )}
                  <h1
                    className="text-3xl lg:text-4xl font-bold mb-2"
                    style={{
                      color: 'var(--theme-text)',
                      fontFamily: 'var(--theme-font-heading)',
                    }}
                  >
                    {product.name}
                  </h1>
                  {product.sku && (
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  )}
                </div>

                {/* Rating & Reviews */}
                {product.rating && product.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.rating.toFixed(1)} ({product.review_count} reviews)
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold">
                      {formatPrice(product.price || 0)}
                    </span>
                    {product.compare_at_price &&
                      product.compare_at_price > (product.price || 0) && (
                        <span className="text-xl text-gray-500 line-through">
                          {formatPrice(product.compare_at_price)}
                        </span>
                      )}
                  </div>
                  {product.compare_at_price &&
                    product.compare_at_price > (product.price || 0) && (
                      <p className="text-sm text-green-600 font-medium">
                        Save{' '}
                        {formatPrice(product.compare_at_price - (product.price || 0))}
                      </p>
                    )}
                </div>

                {/* Stock Status */}
                <div>
                  <StockBadge
                    inventoryCount={product.inventory_count}
                    lowStockThreshold={product.low_stock_threshold}
                  />
                </div>

                <Separator />

                {/* Description */}
                {product.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p
                      className="text-gray-700 leading-relaxed"
                      style={{ fontFamily: 'var(--theme-font-body)' }}
                    >
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Care Instructions */}
                {product.care_instructions && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Care Instructions
                    </h3>
                    <p
                      className="text-gray-700 leading-relaxed"
                      style={{ fontFamily: 'var(--theme-font-body)' }}
                    >
                      {product.care_instructions}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Add to Cart Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Quantity
                      </label>
                      <QuantitySelector
                        value={quantity}
                        onChange={setQuantity}
                        min={1}
                        max={product.inventory_count || 99}
                        disabled={!product.inventory_count}
                      />
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleAddToCart}
                    disabled={
                      !product.inventory_count ||
                      product.inventory_count === 0 ||
                      isAddingToCart
                    }
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                  </Button>
                </div>

                {/* Category */}
                {product.primary_category && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Category:{' '}
                      <Link
                        href={`/category/${product.primary_category.slug}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {product.primary_category.name}
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Related Products */}
            {relatedProducts && relatedProducts.length > 0 && (
              <div>
                <h2
                  className="text-2xl font-bold mb-6"
                  style={{
                    color: 'var(--theme-text)',
                    fontFamily: 'var(--theme-font-heading)',
                  }}
                >
                  Related Products
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {relatedProducts.map((relatedProduct) => (
                    <RelatedProductCard
                      key={relatedProduct.id}
                      product={relatedProduct}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
  )
}

// Related Product Card Component
function RelatedProductCard({ product }: { product: any }) {
  const firstImage =
    product.product_images && product.product_images.length > 0
      ? product.product_images[0]
      : null

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-square bg-muted">
          {firstImage ? (
            <Image
              src={firstImage.url}
              alt={firstImage.alt_text || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium line-clamp-2 mb-2">{product.name}</h3>
          <p className="font-semibold">{formatPrice(product.price || 0)}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

// Loading Skeleton
function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-4">
        <Skeleton className="aspect-square rounded-lg" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}
