'use client'

/**
 * Order Confirmation Page Component
 *
 * Displays order confirmation details after successful payment
 */

import { useEffect, useState } from 'react'
import { CheckCircle2, Package, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Separator } from '@/src/components/ui/separator'
import { Skeleton } from '@/src/components/ui/skeleton'
import Link from 'next/link'

interface OrderConfirmationPageProps {
  orderId: string
}

interface OrderDetails {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  subtotal: number
  taxAmount: number
  shippingAmount: number
  customerName: string
  customerEmail: string
  shippingAddress: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
  }
  items: Array<{
    id: string
    productName: string
    productSku: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  createdAt: string
}

export function OrderConfirmationPage({ orderId }: OrderConfirmationPageProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${orderId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch order')
        }
        const data = await response.json()
        setOrder(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (isLoading) {
    return (
      <div className="brand-container py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="brand-container py-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-destructive mb-4">{error || 'Order not found'}</p>
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="brand-container py-12">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. We've sent a confirmation email to{' '}
            <strong>{order.customerEmail}</strong>
          </p>
        </div>

        {/* Order Number */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order #{order.orderNumber}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Order placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress.addressLine1}
            </p>
            {order.shippingAddress.addressLine2 && (
              <p className="text-sm text-muted-foreground">
                {order.shippingAddress.addressLine2}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    {item.productSku && (
                      <p className="text-sm text-muted-foreground">SKU: {item.productSku}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(item.totalPrice ?? 0).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">${(item.unitPrice ?? 0).toFixed(2)} each</p>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${(order.subtotal ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${(order.shippingAmount ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${(order.taxAmount ?? 0).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${(order.totalAmount ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
