import { Badge } from '@/src/components/ui/badge'
import { cn } from '@/src/lib/utils'

interface StockBadgeProps {
  inventoryCount: number | null
  lowStockThreshold?: number | null
  className?: string
}

export function StockBadge({
  inventoryCount,
  lowStockThreshold = 10,
  className
}: StockBadgeProps) {
  // Determine stock status
  const getStockStatus = () => {
    if (inventoryCount === null || inventoryCount === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const }
    }

    if (lowStockThreshold && inventoryCount <= lowStockThreshold) {
      return { label: 'Low Stock', variant: 'warning' as const }
    }

    return { label: 'In Stock', variant: 'default' as const }
  }

  const { label, variant } = getStockStatus()

  return (
    <Badge
      variant={variant}
      className={cn(
        variant === 'warning' && 'bg-yellow-500 hover:bg-yellow-600 text-white',
        className
      )}
    >
      {label}
    </Badge>
  )
}
