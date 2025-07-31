'use client'

import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Star, ShoppingCart, Eye, Heart, Package } from 'lucide-react'
import { useState } from 'react'

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
}

export function ProductCard({ product, viewMode, onAddToSite, onRemoveFromSite }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const stockColors = {
    'in-stock': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'low-stock': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'out-of-stock': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
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
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ))
  }

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Product Image */}
            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="h-8 w-8 text-gray-500" />
            </div>

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
                    <Button variant="outline" size="sm">
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
    )
  }

  // Grid view
  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        {/* Product Image */}
        <div className="relative mb-4">
          <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-500" />
          </div>
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.featured && (
              <Badge className="bg-blue-600 text-white text-xs">Featured</Badge>
            )}
            <Badge className={stockColors[product.stock]} variant="outline">
              {stockLabels[product.stock]}
            </Badge>
          </div>

          {/* Hover Actions */}
          {isHovered && (
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8 bg-white dark:bg-gray-800">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-white dark:bg-gray-800">
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
  )
}