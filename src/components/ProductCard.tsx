'use client'

import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Star, ShoppingCart, Eye, Heart } from 'lucide-react'
import { useState } from 'react'
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
}

export function ProductCard({ product, viewMode, onAddToSite, onRemoveFromSite, showSelection = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [showMobileActions, setShowMobileActions] = useState(false)
  const { isSelected, toggleProduct } = useProductSelection()
  const { isFavorite, toggleFavorite, isToggling } = useProductFavorites()
  
  const selected = isSelected(product.id)
  const isProductFavorite = isFavorite(product.id)
  
  // Long press for mobile
  const bind = useLongPress(() => {
    setShowMobileActions(true)
  }, {
    threshold: 500,
    captureEvent: true,
    cancelOnMovement: true,
  })
  
  const handleSelectionChange = (checked: boolean) => {
    toggleProduct(product.id)
  }

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
      <Card className={`hover:shadow-md transition-shadow ${selected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Selection Checkbox */}
            {showSelection && (
              <div className="flex items-center pt-1">
                <Checkbox
                  checked={selected}
                  onCheckedChange={handleSelectionChange}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
              </div>
            )}
            
            {/* Product Image */}
            <ProductImage
              src={product.image}
              alt={product.name}
              productName={product.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-lg flex-shrink-0"
              placeholder={{
                type: 'gradient',
                config: { 
                  colors: product.category === 'flowers' ? ['#fce7f3', '#fbbf24'] : 
                          product.category === 'plants' ? ['#d9f99d', '#84cc16'] :
                          ['#e9d5ff', '#c084fc']
                }
              }}
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
                  
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1">
                      {renderStars(product.rating)}
                      <span className="text-xs text-muted-foreground ml-1">
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
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log('Quick view clicked (list)', { productId: product.id });
                        setQuickViewOpen(true);
                      }}
                      aria-label="Quick view"
                      title="Quick view"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    
                    {product.addedToSite ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveFromSite(product.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => onAddToSite(product.id)}
                        disabled={product.stock === 'out-of-stock'}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
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
            console.log('Closing quick view modal (list)');
            setQuickViewOpen(false);
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
        className={`group cursor-pointer hover:shadow-lg transition-all duration-200 ${selected ? 'ring-2 ring-blue-500' : ''}`}
        {...bind()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchEnd={() => {
          setTimeout(() => setShowMobileActions(false), 3000);
        }}
      >
      <CardContent className="p-4">
        {/* Selection Checkbox */}
        {showSelection && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={selected}
              onCheckedChange={handleSelectionChange}
              className="bg-white  data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
          </div>
        )}
        
        {/* Product Image */}
        <div className="relative mb-4">
          <ProductImage
            src={product.image}
            alt={product.name}
            productName={product.name}
            width={300}
            height={300}
            className="aspect-square rounded-lg"
            placeholder={{
              type: 'gradient',
              config: { 
                colors: product.category === 'flowers' ? ['#fce7f3', '#fbbf24'] : 
                        product.category === 'plants' ? ['#d9f99d', '#84cc16'] :
                        ['#e9d5ff', '#c084fc']
              }
            }}
            priority={product.featured}
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
                disabled={isToggling}
                aria-label={isProductFavorite ? "Remove from favorites" : "Add to favorites"}
                title={isProductFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={cn(
                  "h-4 w-4 transition-all",
                  isProductFavorite && "fill-current"
                )} />
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
                aria-label="Quick view"
                title="Quick view"
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
            <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {renderStars(product.rating)}
            <span className="text-xs text-muted-foreground ml-1">({product.reviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-bold">${product.price}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>

          {/* Category */}
          <div className="text-xs text-muted-foreground">{product.category}</div>

          {/* Action Button */}
          <div className="pt-2">
            {product.addedToSite ? (
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:border-red-300"
                onClick={() => onRemoveFromSite(product.id)}
              >
                Remove from Site
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => onAddToSite(product.id)}
                disabled={product.stock === 'out-of-stock'}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Site
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
          console.log('Closing quick view modal');
          setQuickViewOpen(false);
        }}
        onAddToSite={onAddToSite}
      />
    )}
    </>
  )
}