'use client'

import { useCartContext } from '@/src/contexts/CartContext'
import { CartItem } from '@/src/components/cart/CartItem'
import { EmptyState } from '@/src/components/products/EmptyState'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Separator } from '@/src/components/ui/separator'
import { ShoppingCart, ArrowLeft } from 'lucide-react'
import { formatPrice } from '@/src/lib/utils/format'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function CartPageClient() {
  const router = useRouter()
  const {
    items,
    total,
    itemCount,
    updateQuantity,
    removeItem,
    isLoading,
  } = useCartContext()

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      await updateQuantity(itemId, quantity)
      toast.success('Cart updated')
    } catch {
      toast.error('Failed to update cart')
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId)
      toast.success('Item removed from cart')
    } catch {
      toast.error('Failed to remove item')
    }
  }

  const handleCheckout = () => {
    router.push('/checkout')
  }

  return (
    <div className="brand-container py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1
            className="text-3xl lg:text-4xl font-bold"
            style={{
              color: 'var(--theme-text)',
              fontFamily: 'var(--theme-font-heading)',
            }}
          >
            Shopping Cart
          </h1>
          <Button variant="outline" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        {/* Empty Cart State */}
        {!isLoading && items.length === 0 && (
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Add some products to your cart to get started"
            actionLabel="Browse Products"
            actionHref="/products"
          />
        )}

        {/* Cart Content */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Cart Items ({itemCount})
                </h2>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Item Count */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Items ({itemCount})
                    </span>
                    <span className="font-medium">
                      {formatPrice(total)}
                    </span>
                  </div>

                  <Separator />

                  {/* Subtotal */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      {formatPrice(total)}
                    </span>
                  </div>

                  {/* Shipping Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800">
                      Shipping and taxes will be calculated at checkout
                    </p>
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleCheckout}
                    style={{
                      backgroundColor: 'var(--theme-primary)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    Proceed to Checkout
                  </Button>

                  {/* Continue Shopping Link */}
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <Link href="/products">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Continue Shopping
                    </Link>
                  </Button>

                  {/* Security Notice */}
                  <p className="text-xs text-gray-500 text-center pt-2">
                    Secure checkout with SSL encryption
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading cart...</p>
          </div>
        )}
      </div>
  )
}
