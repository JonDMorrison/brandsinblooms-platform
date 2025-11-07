'use client'

import React, { useState } from 'react'
import { useProduct } from '@/src/hooks/useProduct'
import { useRelatedProducts } from '@/src/hooks/useRelatedProducts'
import { useCartContext } from '@/src/contexts/CartContext'
import { ProductImageGallery } from '@/src/components/products/ProductImageGallery'
import { QuantitySelector } from '@/src/components/products/QuantitySelector'
import { StockBadge } from '@/src/components/products/StockBadge'
import { Breadcrumbs, BreadcrumbItem } from '@/src/components/products/Breadcrumbs'
import { ProductCard } from '@/src/components/ProductCard'
import { Button } from '@/src/components/ui/button'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { ShoppingCart, Package, Ruler, Weight } from 'lucide-react'
import { formatPrice } from '@/src/lib/utils/format'
import { transformProductForDisplay } from '@/src/lib/utils/product-transformer'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'
import { Tables } from '@/src/lib/database/types'
import { ProductWithTags } from '@/src/lib/database/aliases'

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

  // Add theme-based tab styling
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      [data-theme-active="true"][data-state="active"] {
        background: var(--theme-primary) !important;
        color: white !important;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

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
                <div
                  className="rounded-xl p-4 border-2"
                  style={{
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 8%, transparent) 0%, color-mix(in srgb, var(--theme-accent) 5%, transparent) 100%)',
                    borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)'
                  }}
                >
                  <div className="flex items-baseline gap-3">
                    <span
                      className="text-4xl font-bold"
                      style={{
                        fontFamily: 'var(--theme-font-heading)',
                        color: 'var(--theme-text)'
                      }}
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
                      <p
                        className="text-sm font-semibold mt-1"
                        style={{ color: 'var(--theme-accent)' }}
                      >
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
                  <TabsList
                    className="grid w-full grid-cols-3"
                    style={{
                      background: 'color-mix(in srgb, var(--theme-primary) 5%, var(--muted))'
                    }}
                  >
                    <TabsTrigger
                      value="description"
                      style={{
                        '--tw-ring-color': 'var(--theme-primary)'
                      } as React.CSSProperties}
                      className="data-[state=active]:text-white"
                      data-theme-active="true"
                    >
                      Description
                    </TabsTrigger>
                    <TabsTrigger
                      value="care"
                      style={{
                        '--tw-ring-color': 'var(--theme-primary)'
                      } as React.CSSProperties}
                      className="data-[state=active]:text-white"
                      data-theme-active="true"
                    >
                      Care
                    </TabsTrigger>
                    <TabsTrigger
                      value="specs"
                      style={{
                        '--tw-ring-color': 'var(--theme-primary)'
                      } as React.CSSProperties}
                      className="data-[state=active]:text-white"
                      data-theme-active="true"
                    >
                      Specifications
                    </TabsTrigger>
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
                              <Ruler className="h-4 w-4" style={{ color: 'var(--theme-primary)' }} />
                              <h4 className="font-semibold text-sm">Dimensions</h4>
                            </div>
                            <dl className="grid grid-cols-3 gap-4 text-sm">
                              {product.width && (
                                <div
                                  className="rounded-lg p-3 border"
                                  style={{
                                    background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)',
                                    borderColor: 'color-mix(in srgb, var(--theme-accent) 20%, transparent)'
                                  }}
                                >
                                  <dt className="text-gray-600 text-xs mb-1">Width</dt>
                                  <dd className="font-semibold" style={{ color: 'var(--theme-text)' }}>
                                    {product.width} {product.dimension_unit || 'in'}
                                  </dd>
                                </div>
                              )}
                              {product.height && (
                                <div
                                  className="rounded-lg p-3 border"
                                  style={{
                                    background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)',
                                    borderColor: 'color-mix(in srgb, var(--theme-accent) 20%, transparent)'
                                  }}
                                >
                                  <dt className="text-gray-600 text-xs mb-1">Height</dt>
                                  <dd className="font-semibold" style={{ color: 'var(--theme-text)' }}>
                                    {product.height} {product.dimension_unit || 'in'}
                                  </dd>
                                </div>
                              )}
                              {product.depth && (
                                <div
                                  className="rounded-lg p-3 border"
                                  style={{
                                    background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)',
                                    borderColor: 'color-mix(in srgb, var(--theme-accent) 20%, transparent)'
                                  }}
                                >
                                  <dt className="text-gray-600 text-xs mb-1">Depth</dt>
                                  <dd className="font-semibold" style={{ color: 'var(--theme-text)' }}>
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
                              <Weight className="h-4 w-4" style={{ color: 'var(--theme-primary)' }} />
                              <h4 className="font-semibold text-sm">Weight</h4>
                            </div>
                            <div
                              className="rounded-lg p-3 border inline-block"
                              style={{
                                background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)',
                                borderColor: 'color-mix(in srgb, var(--theme-accent) 20%, transparent)'
                              }}
                            >
                              <dd className="font-semibold" style={{ color: 'var(--theme-text)' }}>
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
                <div
                  className="bg-white border-2 rounded-xl p-5 space-y-4"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--theme-primary) 40%, transparent)'
                  }}
                >
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
                    style={{
                      backgroundColor: 'var(--theme-primary)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {isAddingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                  </Button>
                </div>

                {/* Category */}
                {product.primary_category && (
                  <div
                    className="flex items-center justify-between rounded-lg p-4 border"
                    style={{
                      background: 'color-mix(in srgb, var(--theme-secondary) 8%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--theme-secondary) 25%, transparent)'
                    }}
                  >
                    <span className="text-sm font-medium text-gray-600">
                      Category
                    </span>
                    <Link
                      href={`/category/${product.primary_category.slug}`}
                      className="font-semibold transition-colors hover:underline"
                      style={{ color: 'var(--theme-primary)' }}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                  {relatedProducts.map((relatedProduct) => (
                    <RelatedProductCard
                      key={relatedProduct.id}
                      product={relatedProduct as ProductWithTags}
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
function RelatedProductCard({ product }: { product: ProductWithTags }) {
  const { addItem } = useCartContext()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async (productId: string) => {
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

  // Transform database product to display format
  const displayProduct = transformProductForDisplay(product)

  return (
    <Link href={`/products/${product.slug}`} className="block">
      <ProductCard
        product={displayProduct}
        showAddToCart={true}
        onAddToCart={handleAddToCart}
        isAddingToCart={isAdding}
      />
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
