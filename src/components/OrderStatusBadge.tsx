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
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: CheckCircle
  },
  shipped: {
    label: 'Shipped',
    variant: 'default' as const,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    icon: Truck
  },
  processing: {
    label: 'Processing',
    variant: 'default' as const,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    icon: Package
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'default' as const,
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    icon: XCircle
  },
  pending: {
    label: 'Pending',
    variant: 'default' as const,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    icon: Package
  },
  refunded: {
    label: 'Refunded',
    variant: 'default' as const,
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
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