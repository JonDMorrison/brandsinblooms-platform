'use client'

import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import React, { useState, useRef, useCallback, memo, useMemo } from 'react'
import { ProductImage } from '@/src/components/ui/product-image'
import { cn } from '@/src/lib/utils'
import { shouldShowCompareAtPrice } from '@/src/lib/products/utils/pricing'
import { ShoppingCart } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  category: string
  stock: 'in-stock' | 'low-stock' | 'out-of-stock'
  image: string
  featured: boolean
  addedToSite: boolean
}

interface ProductCardProps {
  product: Product
  onEdit?: (productId: string) => void
  isEditLoading?: boolean
  showAddToCart?: boolean
  onAddToCart?: (productId: string) => void
  isAddingToCart?: boolean
}

// Memoized product image component to prevent re-renders on hover
const MemoizedProductImage = memo(ProductImage)

export function ProductCard({
  product,
  onEdit,
  isEditLoading = false,
  showAddToCart = false,
  onAddToCart,
  isAddingToCart = false
}: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Memoize placeholder config to prevent recreation on every render
  const placeholderConfig = useMemo(() => ({
    type: 'gradient' as const,
    config: {
      colors: ['var(--theme-primary)', 'var(--theme-secondary)']
    }
  }), [])

  // Helper function to check if click target is an interactive element
  const isInteractiveElement = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false
    
    // Check if the target or its closest ancestor is an interactive element
    // But exclude the card itself which might have tabindex
    const interactiveSelector = 'button, input, select, textarea, a, [role="button"]:not(.group)'
    const interactive = target.closest(interactiveSelector)
    
    // If we found an interactive element, make sure it's not the card itself
    if (interactive) {
      // Check if the interactive element has a specific action (not just the card)
      return !interactive.classList.contains('group')
    }
    
    return false
  }

  // Handle card click for edit functionality
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if (!onEdit || isEditLoading) {
      return
    }
    
    // Don't trigger edit if clicking on interactive elements
    if (isInteractiveElement(e.target)) {
      return
    }
    
    // Prevent double-clicks on mobile
    e.preventDefault()
    onEdit(product.id)
  }, [onEdit, product.id, isEditLoading])

  // Handle keyboard navigation for accessibility
  const handleCardKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!onEdit || isEditLoading) return
    
    if ((e.key === 'Enter' || e.key === ' ') && !isInteractiveElement(e.target)) {
      e.preventDefault()
      onEdit(product.id)
    }
  }, [onEdit, product.id, isEditLoading])

  // Enhanced focus management
  const returnFocus = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.focus()
    }
  }, [])

  // Handle add to cart click
  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (onAddToCart && !isAddingToCart) {
      onAddToCart(product.id)
    }
  }, [onAddToCart, product.id, isAddingToCart])

  const stockColors = {
    'in-stock': 'bg-green-100 text-green-800  ',
    'low-stock': 'bg-yellow-100 text-yellow-800  ',
    'out-of-stock': 'bg-red-100 text-red-800  '
  }

  const stockLabels = {
    'in-stock': 'In Stock',
    'low-stock': 'Low Stock',
    'out-of-stock': 'Out of Stock'
  }

  return (
    <Card
      ref={cardRef}
      className={cn(
        "py-0 group transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        onEdit ? "cursor-pointer hover:shadow-lg hover:ring-1 hover:ring-gray-300" : "hover:shadow-lg",
        isEditLoading && "opacity-75 pointer-events-none"
      )}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      tabIndex={onEdit ? 0 : undefined}
      role={onEdit ? "button" : undefined}
      aria-label={onEdit ? `Edit product ${product.name}. Price: $${product.price}. Stock: ${stockLabels[product.stock]}` : undefined}
      aria-disabled={isEditLoading}
    >
      <CardContent className="p-4">
        {/* Product Image */}
        <div className="relative mb-3">
          <MemoizedProductImage
            src={product.image}
            alt={product.name}
            productName={product.name}
            width={300}
            height={300}
            className="aspect-square rounded-lg"
            placeholder={placeholderConfig}
            priority={product.featured}
            showLoadingState={false}
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <Badge className={stockColors[product.stock]} variant="outline">
              {stockLabels[product.stock]}
            </Badge>
          </div>

          {/* Discount */}
          {shouldShowCompareAtPrice(product.price, product.originalPrice) && (
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-red-600 text-white text-xs">
                {Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}% OFF
              </Badge>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm mb-1 line-clamp-1">{product.name}</h3>

          {/* Price and Cart */}
          <div className={cn("flex items-center", showAddToCart ? "justify-between" : "gap-2")}>
            <div className="flex items-center gap-2">
              <span className="font-bold">${product.price}</span>
              {shouldShowCompareAtPrice(product.price, product.originalPrice) && (
                <span className="text-sm text-gray-500 line-through">
                  ${product.originalPrice}
                </span>
              )}
            </div>

            {showAddToCart && onAddToCart && (
              <Button
                size="icon"
                variant="default"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleAddToCart}
                disabled={isAddingToCart || product.stock === 'out-of-stock'}
                aria-label={`Add ${product.name} to cart`}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Category */}
          <div className="text-xs text-gray-500">{product.category}</div>
        </div>
      </CardContent>
    </Card>
  )
}