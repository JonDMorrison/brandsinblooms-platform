import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardChart } from '@/components/charts/DashboardChart'
import { OrderTrendsChart } from '@/components/charts/OrderTrendsChart'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  ShoppingCart, 
  DollarSign 
} from 'lucide-react'

interface AnalyticsCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative'
  icon: React.ReactNode
}

function AnalyticsCard({ title, value, change, changeType, icon }: AnalyticsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          {changeType === 'positive' ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={changeType === 'positive' ? 'text-green-500' : 'text-red-500'}>
            {change}
          </span>
          <span>from last month</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Total Revenue"
          value="$45,231.89"
          change="+20.1%"
          changeType="positive"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <AnalyticsCard
          title="Total Orders"
          value="2,350"
          change="+15.2%"
          changeType="positive"
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
        <AnalyticsCard
          title="Site Visitors"
          value="12,234"
          change="+8.1%"
          changeType="positive"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <AnalyticsCard
          title="Conversion Rate"
          value="3.2%"
          change="-2.4%"
          changeType="negative"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <DashboardChart
          title="Page Views"
          description="Monthly page views over time"
          type="area"
          dataKey="views"
          color="#8884d8"
        />
        <DashboardChart
          title="Orders"
          description="Order volume by month"
          type="bar"
          dataKey="orders"
          color="#82ca9d"
        />
      </div>

      {/* Order Trends */}
      <OrderTrendsChart />

      {/* Additional Analytics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best selling products this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Rose Bouquet Premium', sales: 234, revenue: '$2,340' },
                { name: 'Sunflower Arrangement', sales: 198, revenue: '$1,980' },
                { name: 'Wedding Package Deluxe', sales: 156, revenue: '$7,800' },
                { name: 'Spring Garden Mix', sales: 142, revenue: '$1,420' },
              ].map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">{product.sales} sales</span>
                  </div>
                  <span className="text-sm font-medium">{product.revenue}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { source: 'Organic Search', percentage: '45%', visitors: '5,234' },
                { source: 'Direct', percentage: '32%', visitors: '3,721' },
                { source: 'Social Media', percentage: '15%', visitors: '1,745' },
                { source: 'Referrals', percentage: '8%', visitors: '932' },
              ].map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{source.source}</span>
                    <span className="text-xs text-muted-foreground">{source.visitors} visitors</span>
                  </div>
                  <span className="text-sm font-medium">{source.percentage}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest customer interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'New order placed', customer: 'Sarah Johnson', time: '2 min ago' },
                { action: 'Product reviewed', customer: 'Mike Chen', time: '5 min ago' },
                { action: 'Newsletter signup', customer: 'Emma Davis', time: '12 min ago' },
                { action: 'Contact form submitted', customer: 'Alex Smith', time: '18 min ago' },
              ].map((activity, index) => (
                <div key={index} className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{activity.action}</span>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.customer}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}