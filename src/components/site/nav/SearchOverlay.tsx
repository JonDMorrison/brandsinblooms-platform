'use client'

import { useEffect, useRef } from 'react'
import { X, Search, ShoppingCart, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { useProductSearch } from '@/src/hooks/useProductSearch'
import { useCartContext } from '@/src/contexts/CartContext'
import { formatPrice } from '@/src/lib/utils/format'
import { toast } from 'sonner'
import { cn } from '@/src/lib/utils'
import { Tables } from '@/src/lib/database/types'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { searchQuery, setSearchQuery, products, isLoading, hasResults, clearSearch } = useProductSearch({ limit: 8 })
  const { addItem } = useCartContext()
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleClose = () => {
    clearSearch()
    onClose()
  }

  const handleAddToCart = async (product: Tables<'products'>, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      await addItem(product, 1)
      toast.success(`${product.name} added to cart`)
    } catch {
      toast.error('Failed to add to cart')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Overlay Content */}
      <div className="fixed inset-x-0 top-0 z-50 animate-in slide-in-from-top duration-300">
        <div className="brand-container mx-auto px-4 pt-4 pb-8">
          <Card className="w-full max-w-3xl mx-auto shadow-2xl" style={{ backgroundColor: 'var(--theme-background, white)' }}>
            <CardContent className="p-6">
              {/* Search Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    ref={inputRef}
                    type="search"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 h-12 text-lg"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-12 w-12"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Search Results */}
              <div className="min-h-[200px] max-h-[60vh] overflow-y-auto">
                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                      <p className="text-sm text-gray-500">Searching...</p>
                    </div>
                  </div>
                )}

                {/* Empty State - No Query */}
                {!isLoading && !searchQuery && (
                  <div className="text-center py-12 space-y-2">
                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500" style={{ fontFamily: 'var(--theme-font-body)' }}>
                      Start typing to search for products
                    </p>
                    <p className="text-sm text-gray-400">
                      Try searching for plant names, categories, or descriptions
                    </p>
                  </div>
                )}

                {/* No Results */}
                {!isLoading && searchQuery && !hasResults && searchQuery.length >= 2 && (
                  <div className="text-center py-12 space-y-2">
                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500" style={{ fontFamily: 'var(--theme-font-body)' }}>
                      No products found for "{searchQuery}"
                    </p>
                    <p className="text-sm text-gray-400">
                      Try a different search term or browse all products
                    </p>
                    <Button asChild variant="outline" className="mt-4">
                      <Link href="/products" onClick={handleClose}>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Browse All Products
                      </Link>
                    </Button>
                  </div>
                )}

                {/* Results Grid */}
                {!isLoading && hasResults && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Found {products.length} product{products.length !== 1 ? 's' : ''}
                      </p>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/products?q=${encodeURIComponent(searchQuery)}`} onClick={handleClose}>
                          View all results
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {products.map((product) => {
                        const firstImage =
                          product.product_images &&
                          Array.isArray(product.product_images) &&
                          product.product_images[0]?.url

                        return (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            onClick={handleClose}
                            className="group"
                          >
                            <Card className="overflow-hidden hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--theme-background, white)' }}>
                              <div className="flex gap-3 p-3">
                                {/* Product Image */}
                                <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                  {firstImage ? (
                                    <Image
                                      src={firstImage}
                                      alt={product.name}
                                      fill
                                      className="object-cover group-hover:scale-110 transition-transform"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full">
                                      <ShoppingCart className="h-8 w-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>

                                {/* Product Details */}
                                <div className="flex-1 min-w-0 space-y-1">
                                  <h3
                                    className="font-medium line-clamp-1 group-hover:text-primary transition-colors"
                                    style={{ fontFamily: 'var(--theme-font-heading)' }}
                                  >
                                    {product.name}
                                  </h3>
                                  <p className="text-xs text-gray-500 line-clamp-2">
                                    {product.description}
                                  </p>
                                  <div className="flex items-center justify-between pt-1">
                                    <div>
                                      <p className="font-semibold" style={{ color: 'var(--theme-primary)' }}>
                                        {formatPrice(product.price || 0)}
                                      </p>
                                      {product.compare_at_price &&
                                        product.compare_at_price > (product.price || 0) && (
                                          <p className="text-xs text-gray-500 line-through">
                                            {formatPrice(product.compare_at_price)}
                                          </p>
                                        )}
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="secondary"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => handleAddToCart(product, e)}
                                      disabled={!product.inventory_count}
                                    >
                                      <ShoppingCart className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {product.inventory_count === 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      Out of Stock
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </Link>
                        )
                      })}
                    </div>

                    {/* View All Link */}
                    {products.length >= 8 && (
                      <div className="text-center pt-4 border-t">
                        <Button asChild variant="outline" className="w-full sm:w-auto">
                          <Link href={`/products?q=${encodeURIComponent(searchQuery)}`} onClick={handleClose}>
                            View all products
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions Footer */}
              {searchQuery.length >= 2 && !isLoading && (
                <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-500">
                  <p>
                    Press <kbd className="px-2 py-1 bg-gray-100 rounded border">Esc</kbd> to close
                  </p>
                  {hasResults && (
                    <Button asChild variant="link" size="sm">
                      <Link href="/products" onClick={handleClose}>
                        Browse all products
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
