import { Badge } from '@/src/components/ui/badge';
import { Package, AlertTriangle, XCircle } from 'lucide-react';

interface StockIndicatorProps {
  stock: 'in-stock' | 'low-stock' | 'out-of-stock';
  inventoryCount?: number;
  showCount?: boolean;
  className?: string;
}

export function StockIndicator({
  stock,
  inventoryCount,
  showCount = false,
  className = '',
}: StockIndicatorProps) {
  const config = {
    'in-stock': {
      label: 'In Stock',
      variant: 'default' as const,
      icon: Package,
      color: 'text-green-600',
    },
    'low-stock': {
      label: 'Low Stock',
      variant: 'secondary' as const,
      icon: AlertTriangle,
      color: 'text-orange-600',
    },
    'out-of-stock': {
      label: 'Out of Stock',
      variant: 'destructive' as const,
      icon: XCircle,
      color: 'text-red-600',
    },
  };

  const { label, variant, icon: Icon, color } = config[stock];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
      {showCount && inventoryCount !== undefined && (
        <span className={`text-sm ${color}`}>
          ({inventoryCount} units)
        </span>
      )}
    </div>
  );
}
