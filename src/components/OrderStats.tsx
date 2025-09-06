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
import { DashboardStats, type DashboardStat } from '@/src/components/DashboardStats'
import { useMemo } from 'react'

interface OrderStatsProps {
  className?: string
}

export function OrderStats({ className }: OrderStatsProps) {
  const { data: metrics, isLoading, error } = useOrderMetrics({
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  // Dashboard stats for the DashboardStats component
  const dashboardStats: DashboardStat[] = useMemo(() => {
    if (!metrics) return []
    
    const deliveryRate = metrics.totalOrders > 0 
      ? (metrics.deliveredOrders / metrics.totalOrders) * 100 
      : 0

    const formatTrend = (value: number) => {
      const isPositive = value >= 0
      const sign = isPositive ? '+' : ''
      return `${sign}${value.toFixed(1)}% from last month`
    }

    return [
      {
        id: '1',
        title: 'Total Orders',
        count: metrics.totalOrders,
        trend: formatTrend(metrics.growthRate?.orders || 0),
        icon: <ShoppingCart className="h-6 w-6" />,
        color: 'text-blue-600'
      },
      {
        id: '2',
        title: 'Total Revenue',
        count: Math.round(metrics.totalRevenue),
        trend: formatTrend(metrics.growthRate?.revenue || 0),
        icon: <DollarSign className="h-6 w-6" />,
        color: 'text-green-600'
      },
      {
        id: '3',
        title: 'Avg Order Value',
        count: Math.round(metrics.averageOrderValue),
        trend: formatTrend(
          metrics.totalRevenue > 0 && metrics.totalOrders > 0
            ? ((metrics.averageOrderValue / (metrics.totalRevenue / metrics.totalOrders)) - 1) * 100
            : 0
        ),
        icon: <TrendingUp className="h-6 w-6" />,
        color: 'text-purple-600'
      },
      {
        id: '4',
        title: "Today's Orders",
        count: metrics.todayOrders,
        trend: `$${metrics.todayRevenue.toFixed(2)} revenue today`,
        icon: <ShoppingCart className="h-6 w-6" />,
        color: 'text-orange-600',
        showTrendIcon: false
      }
    ]
  }, [metrics])

  // Show loading skeleton while data is loading
  if (isLoading || !metrics) {
    return (
      <div className={`space-y-4 ${className || ''}`}>
        <DashboardStats 
          stats={[]} 
          isLoading={true} 
          animationDelay={0.2} 
        />
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
        <Card className="fade-in-up border-red-200 ">
          <CardContent className="p-4 text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-medium text-red-600 ">Failed to Load Order Stats</h3>
            <p className="text-sm text-gray-500 mt-1">
              {error instanceof Error ? error.message : 'An error occurred while loading order statistics'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Status stats for the breakdown section

  const statusStats = [
    {
      title: 'Processing',
      value: metrics.processingOrders,
      icon: Package,
      color: 'bg-yellow-100 text-yellow-800  '
    },
    {
      title: 'Shipped',
      value: metrics.shippedOrders,
      icon: Truck,
      color: 'bg-blue-100 text-blue-800  '
    },
    {
      title: 'Delivered',
      value: metrics.deliveredOrders,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800  '
    },
    {
      title: 'Cancelled',
      value: metrics.cancelledOrders,
      icon: XCircle,
      color: 'bg-red-100 text-red-800  '
    }
  ]


  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Main Stats */}
      <DashboardStats 
        stats={dashboardStats}
        isLoading={false}
        animationDelay={0.2}
      />

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
                  <p className="text-sm text-gray-500">{stat.title}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}