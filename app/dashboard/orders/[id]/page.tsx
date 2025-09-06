'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Printer, RefreshCw, Package, Truck, CheckCircle, XCircle, CreditCard, MapPin, User, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Separator } from '@/src/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/src/components/ui/avatar'
import { useOrderDetails, type OrderWithDetails } from '@/src/hooks/useOrderDetails'
import { OrderStatusBadge } from '@/src/components/OrderStatusBadge'
import { OrderActionsDropdown } from '@/src/components/orders/OrderActionsDropdown'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

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

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch order details
  const { data: order, isLoading, isError, error, refetch } = useOrderDetails(orderId, {
    enabled: !!orderId,
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Order details refreshed')
    } catch (error) {
      toast.error('Failed to refresh order details')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handlePrint = () => {
    window.print()
    toast.success('Print dialog opened')
  }

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-gray-500">View and manage order information</p>
          </div>
        </div>
        
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
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
              <Button onClick={() => router.push('/dashboard/orders')} variant="default">
                Back to Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No data state
  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-gray-500">View and manage order information</p>
          </div>
        </div>
        
        <Card className="border-gray-200">
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="font-medium text-gray-600 mb-2">Order Not Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              The order could not be found or you don&apos;t have permission to view it.
            </p>
            <Button onClick={() => router.push('/dashboard/orders')} variant="default">
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 fade-in-up">
        <div className="flex items-center gap-4 flex-1">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
            <p className="text-gray-500">
              Created {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <OrderActionsDropdown order={order} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <Card className="fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Package className="h-5 w-5" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <OrderStatusBadge status={order.status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'} showIcon />
                  <p className="text-sm text-gray-500">
                    Last updated {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatCurrency(order.total_amount, order.currency || 'USD')}</p>
                  <p className="text-sm text-gray-500">Total Amount</p>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="space-y-4">
                <h4 className="font-medium">Order Timeline</h4>
                <div className="space-y-3">
                  {statusHistory.map((item, index) => (
                    <div key={item.status} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.active 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-gray-500'
                      }`}>
                        {item.status === 'processing' && <Package className="h-4 w-4" />}
                        {item.status === 'shipped' && <Truck className="h-4 w-4" />}
                        {item.status === 'delivered' && <CheckCircle className="h-4 w-4" />}
                        {item.status === 'cancelled' && <XCircle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${item.active ? 'text-gray-900' : 'text-gray-500'}`}>
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
          <Card className="fade-in-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              {order.order_items && order.order_items.length > 0 ? (
                <div className="space-y-4">
                  {order.order_items.map((item: { product_name: string; product_sku?: string | null; quantity: number; unit_price: number; total_price: number }, index: number) => (
                    <div key={index} className="flex items-center gap-4 py-4 border-b last:border-b-0">
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product_name || 'Product'}</h4>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity} × {formatCurrency(item.unit_price || 0, order.currency || 'USD')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency((item.quantity || 1) * (item.unit_price || 0), order.currency || 'USD')}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
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
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(order.total_amount, order.currency || 'USD')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No items found for this order
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="fade-in-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={order.customer.avatar_url || undefined} />
                  <AvatarFallback>{customerInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-medium">
                    {order.customer.full_name || 'Unknown Customer'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {order.customer.email}
                  </p>
                </div>
              </div>
              
              {/* Customer phone is not available in the current type */}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="fade-in-up" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

          {/* Shipping Information */}
          {(order.shipping_address || order.billing_address) && (
            <Card className="fade-in-up" style={{ animationDelay: '0.5s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Addresses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-500">
                  Address information is stored but detailed display is not implemented yet.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Dates */}
          <Card className="fade-in-up" style={{ animationDelay: '0.6s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
  )
}