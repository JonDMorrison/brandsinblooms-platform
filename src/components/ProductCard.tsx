'use client'

import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Star, ShoppingCart, Eye, Heart } from 'lucide-react'
import React, { useState, useRef, useCallback, memo, useMemo } from 'react'
import { useProductSelection } from '@/src/contexts/ProductSelectionContext'
import { ProductImage } from '@/src/components/ui/product-image'
import { useProductFavorites } from '@/src/hooks/useProductFavorites'
import { ProductQuickView } from '@/src/components/products/ProductQuickView'
import { useLongPress } from 'use-long-press'
import { cn } from '@/src/lib/utils'

interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  rating: number
  reviews: number
  category: string
  stock: 'in-stock' | 'low-stock' | 'out-of-stock'
  image: string
  featured: boolean
  addedToSite: boolean
}

interface ProductCardProps {
  product: Product
  viewMode: 'grid' | 'list'
  onAddToSite: (productId: string) => void
  onRemoveFromSite: (productId: string) => void
  showSelection?: boolean
  onEdit?: (productId: string) => void
  isEditLoading?: boolean
}

// Memoized product image component to prevent re-renders on hover
const MemoizedProductImage = memo(ProductImage)

export function ProductCard({ product, viewMode, onAddToSite, onRemoveFromSite, showSelection = false, onEdit, isEditLoading = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [showMobileActions, setShowMobileActions] = useState(false)
  const [isAddingToSite, setIsAddingToSite] = useState(false)
  const [isRemovingFromSite, setIsRemovingFromSite] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { isSelected, toggleProduct } = useProductSelection()
  const { isFavorite, toggleFavorite, isToggling } = useProductFavorites()
  
  const selected = isSelected(product.id)
  const isProductFavorite = isFavorite(product.id)
  
  // Memoize placeholder config to prevent recreation on every render
  const placeholderConfig = useMemo(() => ({
    type: 'gradient' as const,
    config: { 
      colors: product.category === 'flowers' ? ['#fce7f3', '#fbbf24'] : 
              product.category === 'plants' ? ['#d9f99d', '#84cc16'] :
              ['#e9d5ff', '#c084fc']
    }
  }), [product.category])
  
  // Long press for mobile (with improved touch handling)
  const bind = useLongPress(() => {
    if (!onEdit) return // Don't show actions if edit is not available
    setShowMobileActions(true)
    // Provide haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }, {
    threshold: 600, // Slightly longer to avoid accidental triggers
    captureEvent: true,
    cancelOnMovement: true,
    detect: 'touch' // Only detect on touch devices
  })
  
  const handleSelectionChange = (checked: boolean) => {
    toggleProduct(product.id)
  }

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

  // Handle add to site with loading state
  const handleAddToSiteClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsAddingToSite(true)
    try {
      await onAddToSite(product.id)
    } finally {
      setIsAddingToSite(false)
    }
  }, [onAddToSite, product.id])

  // Handle remove from site with loading state
  const handleRemoveFromSiteClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsRemovingFromSite(true)
    try {
      await onRemoveFromSite(product.id)
    } finally {
      setIsRemovingFromSite(false)
    }
  }, [onRemoveFromSite, product.id])

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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300 '
        }`}
      />
    ))
  }

  if (viewMode === 'list') {
    return (
      <>
      <Card 
        ref={cardRef}
        className={cn(
          "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          selected && "ring-2 ring-blue-500",
          onEdit && "cursor-pointer hover:shadow-md hover:ring-1 hover:ring-gray-300",
          isEditLoading && "opacity-75 pointer-events-none"
        )}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        tabIndex={onEdit ? 0 : undefined}
        role={onEdit ? "button" : undefined}
        aria-label={onEdit ? `Edit product ${product.name}. Price: $${product.price}. Stock: ${stockLabels[product.stock]}` : undefined}
        aria-describedby={onEdit ? `product-desc-${product.id}` : undefined}
        aria-disabled={isEditLoading}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Selection Checkbox */}
            {showSelection && (
              <div className="flex items-center pt-1">
                <Checkbox
                  checked={selected}
                  onCheckedChange={handleSelectionChange}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  aria-label={`Select ${product.name}`}
                />
              </div>
            )}
            
            {/* Product Image */}
            <MemoizedProductImage
              src={product.image}
              alt={product.name}
              productName={product.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-lg flex-shrink-0"
              placeholder={placeholderConfig}
              priority={false}
              loading="lazy"
              showLoadingState={false}
            />

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                    {product.featured && (
                      <Badge variant="secondary" className="text-xs">Featured</Badge>
                    )}
                  </div>
                  
                  <p id={`product-desc-${product.id}`} className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1">
                      {renderStars(product.rating)}
                      <span className="text-xs text-gray-500 ml-1">
                        ({product.reviews})
                      </span>
                    </div>
                    
                    <Badge className={stockColors[product.stock]} variant="outline">
                      {stockLabels[product.stock]}
                    </Badge>
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">${product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="hover:bg-gradient-primary-50 hover:border-gray-300 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setQuickViewOpen(true);
                      }}
                      aria-label={`Quick view ${product.name}`}
                      title={`Quick view ${product.name}`}
                      disabled={isEditLoading}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    
                    {product.addedToSite ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveFromSiteClick}
                        className="text-red-600 hover:text-red-700"
                        disabled={isRemovingFromSite || isEditLoading}
                        aria-label={`Remove ${product.name} from site`}
                      >
                        {isRemovingFromSite ? (
                          <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                        ) : (
                          'Remove'
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleAddToSiteClick}
                        disabled={product.stock === 'out-of-stock' || isAddingToSite || isEditLoading}
                        aria-label={`Add ${product.name} to site`}
                      >
                        {isAddingToSite ? (
                          <div className="h-3 w-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                        ) : (
                          <ShoppingCart className="h-3 w-3 mr-1" />
                        )}
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick View Modal for List View */}
      {quickViewOpen && (
        <ProductQuickView
          product={product as any}
          isOpen={quickViewOpen}
          onClose={() => {
            setQuickViewOpen(false);
            // Return focus to the card after modal closes
            setTimeout(returnFocus, 100);
          }}
          onAddToSite={onAddToSite}
        />
      )}
      </>
    )
  }

  // Grid view
  return (
    <>
      <Card 
        ref={cardRef}
        className={cn(
          "group transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          selected && "ring-2 ring-blue-500",
          onEdit ? "cursor-pointer hover:shadow-lg hover:ring-1 hover:ring-gray-300" : "hover:shadow-lg",
          isEditLoading && "opacity-75 pointer-events-none"
        )}
        {...bind()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => {
          // Show mobile actions immediately on touch start for better UX
          if (onEdit) setShowMobileActions(true);
        }}
        onTouchEnd={() => {
          // Hide actions after a delay
          setTimeout(() => setShowMobileActions(false), 4000);
        }}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        tabIndex={onEdit ? 0 : undefined}
        role={onEdit ? "button" : undefined}
        aria-label={onEdit ? `Edit product ${product.name}. Price: $${product.price}. Stock: ${stockLabels[product.stock]}` : undefined}
        aria-describedby={onEdit ? `product-desc-grid-${product.id}` : undefined}
        aria-disabled={isEditLoading}
      >
      <CardContent className="p-4">
        {/* Selection Checkbox */}
        {showSelection && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={selected}
              onCheckedChange={handleSelectionChange}
              className="bg-white  data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              aria-label={`Select ${product.name}`}
            />
          </div>
        )}
        
        {/* Product Image */}
        <div className="relative mb-4">
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
          <div className={`absolute top-2 ${showSelection ? 'left-10' : 'left-2'} flex flex-col gap-1`}>
            {product.featured && (
              <Badge className="bg-blue-600 text-white text-xs">Featured</Badge>
            )}
            <Badge className={stockColors[product.stock]} variant="outline">
              {stockLabels[product.stock]}
            </Badge>
          </div>

          {/* Hover Actions */}
          {(isHovered || showMobileActions) && (
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-50" style={{ pointerEvents: 'auto' }}>
              <Button 
                variant="outline" 
                size="icon" 
                className={cn(
                  "h-8 w-8 bg-white/95 backdrop-blur-sm border-gray-200 shadow-sm transition-all",
                  "hover:scale-110 hover:shadow-md hover:bg-white hover:border-gray-300",
                  isProductFavorite && "text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
                )}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (toggleFavorite) {
                    toggleFavorite({ 
                      productId: product.id, 
                      isFavorite: isProductFavorite 
                    });
                  }
                }}
                disabled={isToggling || isEditLoading}
                aria-label={isProductFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
                title={isProductFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
              >
                {isToggling ? (
                  <div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                ) : (
                  <Heart className={cn(
                    "h-4 w-4 transition-all",
                    isProductFavorite && "fill-current"
                  )} />
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 bg-white/95 backdrop-blur-sm border-gray-200 shadow-sm transition-all hover:scale-110 hover:shadow-md hover:bg-white hover:border-gray-300"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setQuickViewOpen(true);
                }}
                aria-label={`Quick view ${product.name}`}
                title={`Quick view ${product.name}`}
                disabled={isEditLoading}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Discount */}
          {product.originalPrice && (
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-red-600 text-white text-xs">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
              </Badge>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <div>
            <h3 className="font-semibold text-sm mb-1 line-clamp-1">{product.name}</h3>
            <p id={`product-desc-grid-${product.id}`} className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {renderStars(product.rating)}
            <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-bold">${product.price}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>

          {/* Category */}
          <div className="text-xs text-gray-500">{product.category}</div>

          {/* Action Button */}
          <div className="pt-2">
            {product.addedToSite ? (
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:border-red-300"
                onClick={handleRemoveFromSiteClick}
                disabled={isRemovingFromSite || isEditLoading}
                aria-label={`Remove ${product.name} from site`}
              >
                {isRemovingFromSite ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border border-current border-t-transparent" />
                    Removing...
                  </>
                ) : (
                  'Remove from Site'
                )}
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={handleAddToSiteClick}
                disabled={product.stock === 'out-of-stock' || isAddingToSite || isEditLoading}
                aria-label={`Add ${product.name} to site`}
              >
                {isAddingToSite ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border border-current border-t-transparent" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Site
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Quick View Modal */}
    {quickViewOpen && (
      <ProductQuickView
        product={product as any}
        isOpen={quickViewOpen}
        onClose={() => {
          setQuickViewOpen(false);
          // Return focus to the card after modal closes
          setTimeout(returnFocus, 100);
        }}
        onAddToSite={onAddToSite}
      />
    )}
    </>
  )
}