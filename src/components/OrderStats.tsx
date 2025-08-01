import { Card, CardContent } from '@/src/components/ui/card'
import { 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Package,
  Truck,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Order {
  id: string
  customerName: string
  customerEmail: string
  orderDate: Date
  status: 'delivered' | 'shipped' | 'processing' | 'cancelled'
  total: number
  items: number
}

interface OrderStatsProps {
  orders: Order[]
}

export function OrderStats({ orders }: OrderStatsProps) {
  // Calculate statistics
  const totalOrders = orders.length
  const totalRevenue = orders
    .filter(order => order.status !== 'cancelled')
    .reduce((sum, order) => sum + order.total, 0)
  
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  
  const statusCounts = {
    delivered: orders.filter(o => o.status === 'delivered').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    processing: orders.filter(o => o.status === 'processing').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  }

  // Calculate trends (mock data for demonstration)
  const trends = {
    orders: '+12%',
    revenue: '+8%',
    avgValue: '+5%',
    delivery: '98%'
  }

  const stats = [
    {
      title: 'Total Orders',
      value: totalOrders,
      trend: trends.orders,
      icon: ShoppingCart,
      color: 'blue'
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      trend: trends.revenue,
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Avg Order Value',
      value: `$${averageOrderValue.toFixed(2)}`,
      trend: trends.avgValue,
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Delivery Rate',
      value: trends.delivery,
      trend: '+2%',
      icon: CheckCircle,
      color: 'emerald'
    }
  ]

  const statusStats = [
    {
      title: 'Processing',
      value: statusCounts.processing,
      icon: Package,
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    },
    {
      title: 'Shipped',
      value: statusCounts.shipped,
      icon: Truck,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    },
    {
      title: 'Delivered',
      value: statusCounts.delivered,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    },
    {
      title: 'Cancelled',
      value: statusCounts.cancelled,
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
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.trend} from last month
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