import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/src/lib/utils'

interface MobileCardProps {
  title: string
  description?: string
  value: string | number
  trend?: string
  trendType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
  className?: string
  compact?: boolean
}

export function MobileCard({
  title,
  description,
  value,
  trend,
  trendType = 'neutral',
  icon,
  className,
  compact = false
}: MobileCardProps) {
  const trendColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground'
  }

  if (compact) {
    return (
      <Card className={cn('p-3 sm:p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-lg font-bold sm:text-xl">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && (
              <p className={cn('text-xs', trendColors[trendType])}>
                {trend}
              </p>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 ml-3">
              <div className="p-2 rounded-md bg-muted">
                {icon}
              </div>
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className={cn(
        'flex flex-row items-center justify-between space-y-0',
        compact ? 'pb-2' : 'pb-2'
      )}>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-medium truncate">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs">
              {description}
            </CardDescription>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {trend && (
          <p className={cn('text-xs mt-1', trendColors[trendType])}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  )
}