'use client'

import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Package, 
  ShoppingCart, 
  Eye, 
  Plus, 
  Palette,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Dynamic imports for heavy components
const DashboardChart = dynamic(
  () => import('@/components/charts/DashboardChart').then(mod => mod.DashboardChart),
  { 
    loading: () => (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded"></div>
        </CardContent>
      </Card>
    ),
    ssr: false 
  }
)

const ActivityFeed = dynamic(
  () => import('@/components/ActivityFeed').then(mod => mod.ActivityFeed),
  { 
    loading: () => (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
)

const PerformanceMetrics = dynamic(
  () => import('@/components/PerformanceMetrics').then(mod => mod.PerformanceMetrics),
  { 
    loading: () => (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-gray-100 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
)

interface DashboardStat {
  id: string
  title: string
  count: number
  trend: string
  icon: React.ReactNode
  color: string
}

const dashboardStats: DashboardStat[] = [
  {
    id: '1',
    title: 'Pages',
    count: 12,
    trend: '+2 this week',
    icon: <FileText className="h-6 w-6" />,
    color: 'text-blue-600'
  },
  {
    id: '2',
    title: 'Products',
    count: 45,
    trend: '+5 this month',
    icon: <Package className="h-6 w-6" />,
    color: 'text-green-600'
  },
  {
    id: '3',
    title: 'Orders',
    count: 23,
    trend: '+12 today',
    icon: <ShoppingCart className="h-6 w-6" />,
    color: 'text-purple-600'
  },
  {
    id: '4',
    title: 'Site Views',
    count: 1247,
    trend: '+15% this week',
    icon: <Eye className="h-6 w-6" />,
    color: 'text-orange-600'
  }
]

interface QuickAction {
  id: string
  title: string
  description: string
  href: string
  icon: React.ReactNode
  color: string
}

const quickActions: QuickAction[] = [
  {
    id: '1',
    title: 'Create New Page',
    description: 'Design and publish a new page',
    href: '/dashboard/content/new',
    icon: <Plus className="h-5 w-5" />,
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: '2',
    title: 'Add Products',
    description: 'Manage your product catalog',
    href: '/dashboard/products',
    icon: <Package className="h-5 w-5" />,
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    id: '3',
    title: 'Customize Design',
    description: 'Update your site appearance',
    href: '/dashboard/design',
    icon: <Palette className="h-5 w-5" />,
    color: 'bg-purple-500 hover:bg-purple-600'
  }
]

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.email?.split('@')[0]}! Here's what's happening with your site.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                {stat.trend}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-shadow"
                onClick={() => router.push(action.href)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-2 rounded-md ${action.color} text-white`}>
                    {action.icon}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardChart
          title="Site Views"
          description="Monthly site views over time"
          type="area"
          dataKey="views"
          color="#8884d8"
        />
        <DashboardChart
          title="Order Volume"
          description="Orders received each month"
          type="bar"
          dataKey="orders"
          color="#82ca9d"
        />
      </div>

      {/* Activity Feed and Performance Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed />
        <PerformanceMetrics />
      </div>
    </div>
  )
}