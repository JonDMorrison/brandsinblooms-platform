'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Package, Truck, CheckCircle, XCircle, CreditCard, User, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Separator } from '@/src/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/src/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import { useOrderDetails } from '@/src/hooks/useOrderDetails'
import { OrderStatusBadge } from '@/src/components/OrderStatusBadge'
import { OrderActionsDropdown } from '@/src/components/orders/OrderActionsDropdown'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface OrderDetailsModalProps {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Payment status badge component
function PaymentStatusBadge({ status }: { status: string | null }) {
  if (!status) return null

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Badge className={getStatusConfig(status)}>
      {status}
    </Badge>
  )
}

export function OrderDetailsModal({ orderId, open, onOpenChange }: OrderDetailsModalProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch order details
  const { data: order, loading, error, refresh } = useOrderDetails(orderId || '', {
    enabled: !!orderId && open,
  })

  const isLoading = loading
  const isError = !!error

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refresh()
      toast.success('Order details refreshed')
    } catch (error) {
      toast.error('Failed to refresh order details')
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="sr-only">Loading Order Details</DialogTitle>
            <DialogDescription className="sr-only">Please wait while we load the order information</DialogDescription>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-48 w-full" />
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Error state
  if (isError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Error Loading Order</DialogTitle>
            <DialogDescription>Unable to load order details</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-medium text-red-600 mb-2">Failed to Load Order</h3>
            <p className="text-sm text-gray-500 mb-4">
              {error instanceof Error ? error.message : 'The order could not be found or loaded'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={() => onOpenChange(false)} variant="default">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // No data state
  if (!order) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Not Found</DialogTitle>
            <DialogDescription>The requested order could not be found</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="font-medium text-gray-600 mb-2">Order Not Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              The order could not be found or you don&apos;t have permission to view it.
            </p>
            <Button onClick={() => onOpenChange(false)} variant="default">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const customerInitials = order.customer.full_name
    ? order.customer.full_name.split(' ').map((name: string) => name[0]).join('').toUpperCase()
    : order.customer.email?.[0]?.toUpperCase() || 'U'

  // Status timeline data
  const statusHistory = [
    { status: 'processing', label: 'Order Placed', timestamp: order.created_at, active: true },
    { status: 'shipped', label: 'Shipped', timestamp: order.shipped_at, active: ['shipped', 'delivered'].includes(order.status) },
    { status: 'delivered', label: 'Delivered', timestamp: order.delivered_at, active: order.status === 'delivered' }
  ].filter(item => item.status !== 'cancelled' || order.status === 'cancelled')

  if (order.status === 'cancelled') {
    statusHistory.push({
      status: 'cancelled',
      label: 'Cancelled',
      timestamp: order.updated_at,
      active: true
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="relative">
          <DialogHeader className="px-6 pt-6 pb-4 space-y-2">
            <DialogTitle className="text-xl pr-24">Order #{order.order_number}</DialogTitle>
            <DialogDescription>
              Created {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>
          <div className="absolute top-6 right-6 flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <OrderActionsDropdown order={order} />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Order Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4" />
                    Order Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <OrderStatusBadge status={order.status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'} showIcon />
                      <p className="text-xs text-gray-500 mt-1">
                        Last updated {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(order.total_amount, order.currency || 'USD')}</p>
                      <p className="text-xs text-gray-500">Total Amount</p>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Order Timeline</h4>
                    <div className="space-y-2">
                      {statusHistory.map((item) => (
                        <div key={item.status} className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            item.active
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-gray-500'
                          }`}>
                            {item.status === 'processing' && <Package className="h-3.5 w-3.5" />}
                            {item.status === 'shipped' && <Truck className="h-3.5 w-3.5" />}
                            {item.status === 'delivered' && <CheckCircle className="h-3.5 w-3.5" />}
                            {item.status === 'cancelled' && <XCircle className="h-3.5 w-3.5" />}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${item.active ? 'text-gray-900' : 'text-gray-500'}`}>
                              {item.label}
                            </p>
                            {item.timestamp && (
                              <p className="text-xs text-gray-500">
                                {new Date(item.timestamp).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {order.order_items && order.order_items.length > 0 ? (
                    <div className="space-y-3">
                      {order.order_items.map((item: { product_name: string; product_sku?: string | null; quantity: number; unit_price: number; total_price: number }, index: number) => (
                        <div key={index} className="flex items-center gap-3 py-3 border-b last:border-b-0">
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                            <Package className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{item.product_name || 'Product'}</h4>
                            <p className="text-xs text-gray-500">
                              Qty: {item.quantity} × {formatCurrency(item.unit_price || 0, order.currency || 'USD')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatCurrency((item.quantity || 1) * (item.unit_price || 0), order.currency || 'USD')}
                            </p>
                          </div>
                        </div>
                      ))}

                      <Separator className="my-3" />

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>{formatCurrency(order.total_amount, order.currency || 'USD')}</span>
                        </div>
                        {order.tax_amount && order.tax_amount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Tax</span>
                            <span>{formatCurrency(order.tax_amount, order.currency || 'USD')}</span>
                          </div>
                        )}
                        {order.shipping_amount && order.shipping_amount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Shipping</span>
                            <span>{formatCurrency(order.shipping_amount, order.currency || 'USD')}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-bold text-sm">
                          <span>Total</span>
                          <span>{formatCurrency(order.total_amount, order.currency || 'USD')}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-6 text-sm">
                      No items found for this order
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={order.customer.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{customerInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {order.customer.full_name || 'Unknown Customer'}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {order.customer.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <PaymentStatusBadge status={order.payment_status} />
                  </div>

                  {order.payment_method && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Method</span>
                      <span className="text-sm text-gray-500 capitalize">
                        {order.payment_method}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Amount</span>
                    <span className="text-sm font-mono">
                      {formatCurrency(order.total_amount, order.currency || 'USD')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Order Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4" />
                    Important Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Created</span>
                    <span className="text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {order.shipped_at && (
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Shipped</span>
                      <span className="text-gray-500">
                        {new Date(order.shipped_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {order.delivered_at && (
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Delivered</span>
                      <span className="text-gray-500">
                        {new Date(order.delivered_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Last Updated</span>
                    <span className="text-gray-500">
                      {new Date(order.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
