'use client'

import { useState } from 'react'
import { 
  ShoppingCart, 
  User, 
  MapPin, 
  CreditCard, 
  Package, 
  Truck,
  Calendar,
  Edit,
  MessageSquare,
  Phone,
  Mail
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/src/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/src/components/ui/avatar'
import { Textarea } from '@/src/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { OrderStatusBadge } from '@/src/components/OrderStatusBadge'
import { useOrderDetails } from '@/hooks/useOrderDetails'
import { useOrderMutations } from '@/hooks/useOrderMutations'
import { Skeleton } from '@/src/components/ui/skeleton'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { OrderPayment, OrderShipment, OrderStatusHistory, OrderWithDetails } from '@/src/lib/queries/domains/orders'

interface OrderDetailsSheetProps {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AddressData {
  street: string
  city: string
  state: string
  postal_code: string
  country: string
}

export function OrderDetailsSheet({ orderId, open, onOpenChange }: OrderDetailsSheetProps) {
  const [note, setNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const { data: orderData, isLoading, error } = useOrderDetails(orderId!, { enabled: !!orderId, includeFullDetails: true })
  const { updateStatus } = useOrderMutations()
  
  // Cast to OrderWithDetails since we're using includeFullDetails: true
  const order = orderData as OrderWithDetails | undefined

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return
    
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        status: newStatus as any,
        notes: `Status updated to ${newStatus}`,
      })
      toast.success('Order status updated successfully')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update order status'
      toast.error(message)
    }
  }

  const handleAddNote = async () => {
    if (!order || !note.trim()) return
    
    setIsAddingNote(true)
    try {
      // For now, we'll use the status update to add notes
      // TODO: Implement proper addOrderNote mutation
      await updateStatus.mutateAsync({
        orderId: order.id,
        status: order.status as any,
        notes: note.trim(),
      })
      setNote('')
      toast.success('Note added successfully')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add note'
      toast.error(message)
    } finally {
      setIsAddingNote(false)
    }
  }

  const formatAddress = (address: any): string => {
    if (!address || typeof address !== 'object') return 'No address provided'
    
    const addr = address as AddressData
    return [
      addr.street,
      `${addr.city}, ${addr.state} ${addr.postal_code}`,
      addr.country
    ].filter(Boolean).join('\n')
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const getStatusOptions = (currentStatus: string) => {
    const allStatuses = ['processing', 'shipped', 'delivered', 'cancelled']
    const validTransitions: Record<string, string[]> = {
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    }
    
    return validTransitions[currentStatus] || []
  }

  if (error) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600">Error Loading Order</h3>
              <p className="text-muted-foreground mt-2">
                {error instanceof Error ? error.message : 'Failed to load order details'}
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : order ? (
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order #{order.order_number}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Created {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                </p>
              </div>
              <OrderStatusBadge status={order.status as any} showIcon />
            </div>
          ) : null}
        </SheetHeader>

        {isLoading && (
          <div className="space-y-6 py-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {order && (
          <div className="space-y-6 py-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={order.customer.avatar_url || undefined} />
                    <AvatarFallback>
                      {order.customer.full_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">
                      {order.customer.full_name || 'Unknown Customer'}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {order.customer.email}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Order Items ({order.items_count} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.order_items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {item.product?.name || 'Product'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(item.unit_price, order.currency || 'USD')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total: {formatCurrency(item.unit_price * item.quantity, order.currency || 'USD')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal || 0, order.currency || 'USD')}</span>
                  </div>
                  {(order.tax_amount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatCurrency(order.tax_amount || 0, order.currency || 'USD')}</span>
                    </div>
                  )}
                  {(order.shipping_amount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{formatCurrency(order.shipping_amount || 0, order.currency || 'USD')}</span>
                    </div>
                  )}
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(order.discount_amount || 0, order.currency || 'USD')}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(order.total_amount, order.currency || 'USD')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge className={
                      order.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }>
                      {order.payment_status || 'pending'}
                    </Badge>
                  </div>
                  {order.payment_method && (
                    <div className="flex justify-between">
                      <span>Method</span>
                      <span className="capitalize">{order.payment_method}</span>
                    </div>
                  )}
                  {order.order_payments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Payment History</span>
                      {order.order_payments.map((payment) => (
                        <div key={payment.id} className="flex justify-between text-sm p-2 bg-muted rounded">
                          <span>{formatCurrency(payment.amount, payment.currency || 'USD')}</span>
                          <span>{payment.status}</span>
                          {payment.processed_at && (
                            <span>{new Date(payment.processed_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            {order.shipping_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm">
                    {formatAddress(order.shipping_address)}
                  </pre>
                  
                  {order.order_shipments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Shipment Details
                      </span>
                      {order.order_shipments.map((shipment) => (
                        <div key={shipment.id} className="p-3 bg-muted rounded">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{shipment.carrier || 'Carrier'}</span>
                            <Badge>{shipment.status || 'pending'}</Badge>
                          </div>
                          {shipment.tracking_number && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Tracking: {shipment.tracking_number}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Update Status:</span>
                    <Select
                      value={order.status}
                      onValueChange={handleStatusUpdate}
                      disabled={updateStatus.loading}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={order.status} disabled>
                          {order.status} (current)
                        </SelectItem>
                        {getStatusOptions(order.status).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Add Note:</span>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a note about this order..."
                      rows={3}
                    />
                    <Button 
                      onClick={handleAddNote}
                      disabled={!note.trim() || isAddingNote}
                      size="sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {isAddingNote ? 'Adding...' : 'Add Note'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status History */}
            {order.order_status_history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Status History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.order_status_history
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 p-3 bg-muted rounded">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {entry.from_status ? `${entry.from_status} → ` : ''}
                              {entry.to_status}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}