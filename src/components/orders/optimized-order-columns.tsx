'use client'

import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { formatCurrency, formatDate } from '@/src/lib/utils'
import { Eye } from 'lucide-react'
import { ColumnDef } from '@/src/components/ui/optimized-table'
import type { OrderWithCustomer } from '@/src/lib/queries/domains/orders'

// Optimized order status component
const OrderStatus = ({ status }: { status: string }) => {
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'secondary'
      case 'processing':
        return 'default'
      case 'shipped':
        return 'outline'
      case 'delivered':
        return 'default'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <Badge variant={getStatusVariant(status)} className="capitalize">
      {status}
    </Badge>
  )
}

// Optimized payment status component
const PaymentStatus = ({ status }: { status: string }) => {
  const getPaymentVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'failed':
        return 'destructive'
      case 'refunded':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <Badge variant={getPaymentVariant(status)} className="capitalize">
      {status}
    </Badge>
  )
}

export const createOptimizedOrderColumns = (onViewOrder?: (orderId: string) => void): ColumnDef<OrderWithCustomer>[] => [
  {
    id: 'order_number',
    header: 'Order',
    accessorKey: 'order_number',
    sortable: true,
    searchable: true,
    width: 120,
    cell: (order) => (
      <div className="font-medium">
        #{order.order_number}
      </div>
    )
  },
  {
    id: 'customer',
    header: 'Customer',
    sortable: true,
    searchable: true,
    width: 200,
    cell: (order) => (
      <div>
        <div className="font-medium">
          {order.customer_name || 'Unknown Customer'}
        </div>
        <div className="text-sm text-gray-500">
          {order.customer_email}
        </div>
      </div>
    )
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    sortable: true,
    width: 120,
    cell: (order) => <OrderStatus status={order.status || 'pending'} />
  },
  {
    id: 'payment_status',
    header: 'Payment',
    accessorKey: 'payment_status',
    sortable: true,
    width: 120,
    cell: (order) => <PaymentStatus status={order.payment_status || 'pending'} />
  },
  {
    id: 'total',
    header: 'Total',
    accessorKey: 'total_amount',
    sortable: true,
    width: 100,
    cell: (order) => (
      <div className="font-medium">
        {formatCurrency(order.total_amount || 0)}
      </div>
    )
  },
  {
    id: 'items',
    header: 'Items',
    width: 80,
    cell: (order) => (
      <div className="text-center">
        {order.items_count || 0}
      </div>
    )
  },
  {
    id: 'created_at',
    header: 'Date',
    accessorKey: 'created_at',
    sortable: true,
    width: 120,
    cell: (order) => (
      <div className="text-sm">
        {formatDate(order.created_at)}
      </div>
    )
  },
  {
    id: 'actions',
    header: 'Actions',
    width: 100,
    cell: (order) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewOrder?.(order.id)}
      >
        <Eye className="h-4 w-4" />
      </Button>
    )
  }
]

// For backward compatibility
export const optimizedOrderColumns = createOptimizedOrderColumns()