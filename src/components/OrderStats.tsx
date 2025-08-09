import { Card, CardContent } from '@/src/components/ui/card'
import { Skeleton } from '@/src/components/ui/skeleton'
import { 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  Truck,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useOrderMetrics } from '@/hooks/useOrderStats'

interface OrderStatsProps {
  className?: string
}

export function OrderStats({ className }: OrderStatsProps) {
  const { data: metrics, isLoading, error } = useOrderMetrics({
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  // Show loading skeleton while data is loading
  if (isLoading || !metrics) {
    return (
      <div className={`space-y-4 ${className || ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="fade-in-up">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="fade-in-up">
          <CardContent className="p-4">
            <Skeleton className="h-5 w-48 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="text-center space-y-2">
                  <Skeleton className="h-12 w-12 rounded-lg mx-auto" />
                  <Skeleton className="h-6 w-8 mx-auto" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className={`space-y-4 ${className || ''}`}>
        <Card className="fade-in-up border-red-200 dark:border-red-800">
          <CardContent className="p-4 text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-medium text-red-600 dark:text-red-400">Failed to Load Order Stats</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'An error occurred while loading order statistics'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatTrend = (value: number) => {
    const isPositive = value >= 0
    const TrendIcon = isPositive ? TrendingUp : TrendingDown
    const sign = isPositive ? '+' : ''
    return {
      text: `${sign}${value.toFixed(1)}%`,
      icon: TrendIcon,
      className: isPositive ? 'text-green-600' : 'text-red-600'
    }
  }

  const deliveryRate = metrics.totalOrders > 0 
    ? (metrics.deliveredOrders / metrics.totalOrders) * 100 
    : 0

  const ordersTrend = formatTrend(metrics.growthRate?.orders || 0)
  const revenueTrend = formatTrend(metrics.growthRate?.revenue || 0)
  const avgValueTrend = formatTrend(
    metrics.totalRevenue > 0 && metrics.totalOrders > 0
      ? ((metrics.averageOrderValue / (metrics.totalRevenue / metrics.totalOrders)) - 1) * 100
      : 0
  )
  const deliveryTrend = formatTrend(2) // Mock 2% improvement

  const stats = [
    {
      title: 'Total Orders',
      value: metrics.totalOrders.toLocaleString(),
      trend: ordersTrend,
      icon: ShoppingCart,
      color: 'blue'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      trend: revenueTrend,
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(metrics.averageOrderValue),
      trend: avgValueTrend,
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Delivery Rate',
      value: `${deliveryRate.toFixed(1)}%`,
      trend: deliveryTrend,
      icon: CheckCircle,
      color: 'emerald'
    }
  ]

  const statusStats = [
    {
      title: 'Processing',
      value: metrics.processingOrders,
      icon: Package,
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    },
    {
      title: 'Shipped',
      value: metrics.shippedOrders,
      icon: Truck,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    },
    {
      title: 'Delivered',
      value: metrics.deliveredOrders,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    },
    {
      title: 'Cancelled',
      value: metrics.cancelledOrders,
      icon: XCircle,
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    }
  ]

  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600',
    green: 'bg-green-100 dark:bg-green-900 text-green-600',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600',
    emerald: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600'
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="fade-in-up" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className={`text-xs flex items-center mt-1 ${stat.trend.className}`}>
                      <stat.trend.icon className="h-3 w-3 mr-1" />
                      {stat.trend.text} from last period
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Status Breakdown */}
      <Card className="fade-in-up" style={{ animationDelay: '1s' }}>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4">Order Status Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statusStats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-2 ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}