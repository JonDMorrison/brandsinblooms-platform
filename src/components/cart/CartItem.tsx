'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Trash2, ShoppingCart } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { QuantitySelector } from '@/src/components/products/QuantitySelector'
import { formatPrice } from '@/src/lib/utils/format'
import { CartItem as CartItemType } from '@/src/contexts/CartContext'
import { cn } from '@/src/lib/utils'

interface CartItemProps {
  item: CartItemType
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
  className?: string
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  className
}: CartItemProps) {
  const { product, quantity, subtotal, imageUrl } = item

  return (
    <div className={cn('flex gap-4 p-4 bg-white border rounded-lg', className)}>
      {/* Product Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative w-24 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name || 'Product'}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ShoppingCart className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <Link
              href={`/products/${product.slug}`}
              className="font-medium hover:underline line-clamp-1"
            >
              {product.name}
            </Link>

            {product.sku && (
              <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
            )}

            <p className="text-sm font-semibold mt-2">
              {formatPrice(item.price)}
            </p>
          </div>

          {/* Remove Button - Desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex text-gray-400 hover:text-red-500"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Quantity and Subtotal */}
        <div className="flex items-center justify-between mt-4">
          <QuantitySelector
            value={quantity}
            onChange={(newQuantity) => onUpdateQuantity(item.id, newQuantity)}
            min={1}
            max={product.inventory_count ?? 99}
          />

          <div className="flex items-center gap-4">
            <p className="font-semibold">
              {formatPrice(subtotal)}
            </p>

            {/* Remove Button - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden text-gray-400 hover:text-red-500"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stock Warning */}
        {product.inventory_count !== null && quantity > product.inventory_count && (
          <p className="text-sm text-red-500 mt-2">
            Only {product.inventory_count} available in stock
          </p>
        )}
      </div>
    </div>
  )
}
