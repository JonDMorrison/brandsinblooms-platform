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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { ShoppingCart, Package, Ruler, Weight } from 'lucide-react'
import { formatPrice } from '@/src/lib/utils/format'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'
import { Tables } from '@/src/lib/database/types'

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
      // Pass full product object - CartContext will extract imageUrl from product_images
      // Note: Relations (product_images, primary_category) are fine to pass - they won't be stored
      await addItem(product as Tables<'products'>, quantity)
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
                    <Badge className="mb-3" variant="secondary">Featured</Badge>
                  )}
                  <h1
                    className="text-3xl lg:text-4xl font-bold mb-3 leading-tight"
                    style={{
                      color: 'var(--theme-text)',
                      fontFamily: 'var(--theme-font-heading)',
                    }}
                  >
                    {product.name}
                  </h1>
                </div>

                {/* Price - More Prominent */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-baseline gap-3">
                    <span
                      className="text-4xl font-bold text-gray-900"
                      style={{ fontFamily: 'var(--theme-font-heading)' }}
                    >
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
                      <p className="text-sm text-green-600 font-semibold mt-1">
                        Save{' '}
                        {formatPrice(product.compare_at_price - (product.price || 0))}
                        {' '}
                        ({Math.round(((product.compare_at_price - (product.price || 0)) / product.compare_at_price) * 100)}% off)
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

                {/* Product Details Tabs */}
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="care">Care</TabsTrigger>
                    <TabsTrigger value="specs">Specifications</TabsTrigger>
                  </TabsList>

                  {/* Description Tab */}
                  <TabsContent value="description" className="mt-4">
                    {product.description ? (
                      <div className="prose prose-sm max-w-none">
                        <p
                          className="text-gray-700 leading-relaxed"
                          style={{ fontFamily: 'var(--theme-font-body)' }}
                        >
                          {product.description}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">
                        No description available for this product.
                      </p>
                    )}
                  </TabsContent>

                  {/* Care Instructions Tab */}
                  <TabsContent value="care" className="mt-4">
                    {product.care_instructions ? (
                      <div className="prose prose-sm max-w-none">
                        <div className="flex items-start gap-3">
                          <Package className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                          <p
                            className="text-gray-700 leading-relaxed"
                            style={{ fontFamily: 'var(--theme-font-body)' }}
                          >
                            {product.care_instructions}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">
                        No care instructions available for this product.
                      </p>
                    )}
                  </TabsContent>

                  {/* Specifications Tab */}
                  <TabsContent value="specs" className="mt-4">
                    {(product.width || product.height || product.depth || product.weight) ? (
                      <div className="space-y-6">
                        {/* Dimensions */}
                        {(product.width || product.height || product.depth) && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Ruler className="h-4 w-4 text-gray-600" />
                              <h4 className="font-semibold text-sm">Dimensions</h4>
                            </div>
                            <dl className="grid grid-cols-3 gap-4 text-sm">
                              {product.width && (
                                <div className="border rounded-lg p-3 bg-gray-50">
                                  <dt className="text-gray-600 text-xs mb-1">Width</dt>
                                  <dd className="font-semibold text-gray-900">
                                    {product.width} {product.dimension_unit || 'in'}
                                  </dd>
                                </div>
                              )}
                              {product.height && (
                                <div className="border rounded-lg p-3 bg-gray-50">
                                  <dt className="text-gray-600 text-xs mb-1">Height</dt>
                                  <dd className="font-semibold text-gray-900">
                                    {product.height} {product.dimension_unit || 'in'}
                                  </dd>
                                </div>
                              )}
                              {product.depth && (
                                <div className="border rounded-lg p-3 bg-gray-50">
                                  <dt className="text-gray-600 text-xs mb-1">Depth</dt>
                                  <dd className="font-semibold text-gray-900">
                                    {product.depth} {product.dimension_unit || 'in'}
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        )}

                        {/* Weight */}
                        {product.weight && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Weight className="h-4 w-4 text-gray-600" />
                              <h4 className="font-semibold text-sm">Weight</h4>
                            </div>
                            <div className="border rounded-lg p-3 bg-gray-50 inline-block">
                              <dd className="font-semibold text-gray-900">
                                {product.weight} {product.weight_unit || 'lb'}
                              </dd>
                            </div>
                          </div>
                        )}

                        {/* Additional Product Info */}
                        {product.sku && (
                          <div className="pt-4 border-t">
                            <dl className="text-sm space-y-2">
                              <div className="flex justify-between">
                                <dt className="text-gray-600">SKU</dt>
                                <dd className="font-medium text-gray-900">{product.sku}</dd>
                              </div>
                            </dl>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">
                        No specifications available for this product.
                      </p>
                    )}
                  </TabsContent>
                </Tabs>

                <Separator />

                {/* Add to Cart Section */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-5 space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-3 block text-gray-700">
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

                  <Button
                    size="lg"
                    className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    onClick={handleAddToCart}
                    disabled={
                      !product.inventory_count ||
                      product.inventory_count === 0 ||
                      isAddingToCart
                    }
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {isAddingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                  </Button>
                </div>

                {/* Category */}
                {product.primary_category && (
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 border border-gray-200">
                    <span className="text-sm font-medium text-gray-600">
                      Category
                    </span>
                    <Link
                      href={`/category/${product.primary_category.slug}`}
                      className="text-primary hover:underline font-semibold transition-colors"
                    >
                      {product.primary_category.name}
                    </Link>
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
