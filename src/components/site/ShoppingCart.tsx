'use client'

import { useState } from 'react'
import { useCartContext } from '@/src/contexts/CartContext'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/src/components/ui/sheet'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Separator } from '@/src/components/ui/separator'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { 
  ShoppingCart as CartIcon, 
  X, 
  Plus, 
  Minus, 
  Trash2,
  ShoppingBag
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/src/lib/utils'
import { formatPrice } from '@/src/lib/utils/format'

interface ShoppingCartProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

export function ShoppingCart({ open, onOpenChange, className }: ShoppingCartProps) {
  const { 
    items, 
    total, 
    itemCount, 
    updateQuantity, 
    removeItem, 
    isLoading 
  } = useCartContext()
  
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    await updateQuantity(itemId, newQuantity)
  }
  
  const handleRemove = async (itemId: string) => {
    await removeItem(itemId)
  }
  
  // Calculate tax and shipping (placeholder - would come from settings)
  const subtotal = total
  const tax = subtotal * 0.08 // 8% tax
  const shipping = subtotal > 100 ? 0 : 10 // Free shipping over $100
  const grandTotal = subtotal + tax + shipping
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className={cn("w-full sm:w-[400px] lg:w-[450px] flex flex-col", className)}
      >
        <SheetHeader className="space-y-2">
          <SheetTitle className="flex items-center gap-2">
            <CartIcon className="h-5 w-5" />
            Shopping Cart
            {itemCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>
        
        {items.length === 0 ? (
          <EmptyCart onClose={() => onOpenChange(false)} />
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6 my-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemove}
                    disabled={isLoading}
                  />
                ))}
              </div>
            </ScrollArea>
            
            <div className="space-y-4 border-t pt-4">
              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-2">
                <Button 
                  asChild 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  <Link href="/checkout" onClick={() => onOpenChange(false)}>
                    Proceed to Checkout
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  Continue Shopping
                </Button>
              </div>
              
              {/* Shipping Notice */}
              {subtotal < 100 && (
                <p className="text-xs text-muted-foreground text-center">
                  Add {formatPrice(100 - subtotal)} more for free shipping!
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

interface CartItemProps {
  item: any // Using any temporarily - should be CartItem from context
  onQuantityChange: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
  disabled?: boolean
}

function CartItem({ item, onQuantityChange, onRemove, disabled }: CartItemProps) {
  const [localQuantity, setLocalQuantity] = useState(item.quantity)
  
  const handleQuantityUpdate = (newQuantity: number) => {
    setLocalQuantity(newQuantity)
    onQuantityChange(item.id, newQuantity)
  }
  
  return (
    <div className="flex gap-4">
      {/* Product Image */}
      <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted">
        {item.product.images && Array.isArray(item.product.images) && (item.product.images as any[])[0]?.url ? (
          <Image
            src={(item.product.images as any[])[0].url}
            alt={item.product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      
      {/* Product Details */}
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-medium line-clamp-1">
          {item.product.name}
        </h4>
        {item.product.variant && (
          <p className="text-xs text-muted-foreground">
            {item.product.variant}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {formatPrice(item.price)}
          </span>
          
          {/* Quantity Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleQuantityUpdate(localQuantity - 1)}
              disabled={disabled || localQuantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="number"
              value={localQuantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1
                if (val > 0) handleQuantityUpdate(val)
              }}
              className="h-7 w-12 text-center px-1"
              disabled={disabled}
              min="1"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleQuantityUpdate(localQuantity + 1)}
              disabled={disabled}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(item.id)}
            disabled={disabled}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Remove
          </Button>
          <span className="text-sm">
            {formatPrice(item.subtotal)}
          </span>
        </div>
      </div>
    </div>
  )
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 space-y-4">
      <div className="rounded-full bg-muted p-6">
        <CartIcon className="h-12 w-12 text-muted-foreground" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold">Your cart is empty</h3>
        <p className="text-sm text-muted-foreground">
          Add some products to get started
        </p>
      </div>
      <Button onClick={onClose} className="mt-4">
        Start Shopping
      </Button>
    </div>
  )
}

// Export a trigger button component for easy integration
export function ShoppingCartTrigger({ className }: { className?: string }) {
  const { itemCount } = useCartContext()
  const [open, setOpen] = useState(false)
  
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn("relative", className)}
        onClick={() => setOpen(true)}
      >
        <CartIcon className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
        <span className="sr-only">Cart ({itemCount} items)</span>
      </Button>
      <ShoppingCart open={open} onOpenChange={setOpen} />
    </>
  )
}