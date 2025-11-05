'use client'

/**
 * Order Summary Component
 *
 * Display cart items and order totals with dynamic tax/shipping calculations
 */

import { useCart } from '@/src/contexts/CartContext'
import { formatCurrency } from '@/src/lib/stripe/helpers'
import { Separator } from '@/src/components/ui/separator'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Skeleton } from '@/src/components/ui/skeleton'
import Image from 'next/image'

interface OrderSummaryProps {
  subtotal?: number
  tax?: number
  shipping?: number
  total?: number
  isCalculating?: boolean
}

export function OrderSummary({
  subtotal: propSubtotal,
  tax: propTax,
  shipping: propShipping,
  total: propTotal,
  isCalculating = false,
}: OrderSummaryProps) {
  const { items, total: cartTotal } = useCart()

  // Use provided totals or fall back to cart total
  const subtotal = propSubtotal ?? cartTotal
  const tax = propTax ?? 0
  const shipping = propShipping ?? 0
  const total = propTotal ?? subtotal

  return (
    <div className="bg-muted/50 rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold">Order Summary</h2>

      <Separator />

      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="relative w-16 h-16 rounded-md overflow-hidden bg-background">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {item.product.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Qty: {item.quantity}
                </p>
              </div>

              <div className="text-sm font-medium">
                ${item.subtotal.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          {isCalculating ? (
            <Skeleton className="h-4 w-16" />
          ) : shipping === 0 ? (
            <span className="text-green-600">FREE</span>
          ) : (
            <span>${shipping.toFixed(2)}</span>
          )}
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          {isCalculating ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            <span>${tax.toFixed(2)}</span>
          )}
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          {isCalculating ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <span>${total.toFixed(2)}</span>
          )}
        </div>
      </div>

      {shipping === 0 && subtotal > 0 && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          You've qualified for free shipping!
        </p>
      )}
    </div>
  )
}
