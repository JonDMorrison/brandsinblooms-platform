import { Badge } from '@/src/components/ui/badge'
import { Package, Truck, CheckCircle, XCircle } from 'lucide-react'

type OrderStatus = 'delivered' | 'shipped' | 'processing' | 'cancelled' | 'pending' | 'refunded'

interface OrderStatusBadgeProps {
  status: OrderStatus
  showIcon?: boolean
}

const statusConfig = {
  delivered: {
    label: 'Delivered',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800  ',
    icon: CheckCircle
  },
  shipped: {
    label: 'Shipped',
    variant: 'default' as const,
    className: 'bg-blue-100 text-blue-800  ',
    icon: Truck
  },
  processing: {
    label: 'Processing',
    variant: 'default' as const,
    className: 'bg-yellow-100 text-yellow-800  ',
    icon: Package
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'default' as const,
    className: 'bg-red-100 text-red-800  ',
    icon: XCircle
  },
  pending: {
    label: 'Pending',
    variant: 'default' as const,
    className: 'bg-gray-100 text-gray-800  ',
    icon: Package
  },
  refunded: {
    label: 'Refunded',
    variant: 'default' as const,
    className: 'bg-purple-100 text-purple-800  ',
    icon: XCircle
  }
}

export function OrderStatusBadge({ status, showIcon = false }: OrderStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={config.className}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  )
}