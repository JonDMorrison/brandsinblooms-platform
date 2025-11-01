'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import {
  FileText,
  Package,
  ShoppingCart,
  Eye,
  Plus,
  Palette,
  ArrowUpRight,
} from 'lucide-react'
import { useAuth } from '@/src/contexts/AuthContext'
import { useSite } from '@/src/hooks/useSite'
import { useDashboardMetrics, useSiteStats } from '@/src/hooks/useStats'
import { Skeleton } from '@/src/components/ui/skeleton'
import { DashboardStats, type DashboardStat } from '@/src/components/DashboardStats'
import { debug } from '@/src/lib/utils/debug'
import { getCustomerSiteFullUrl } from '@/src/lib/site/url-utils'

// Import MetricsChart for actual data visualization
import { MetricsChart } from '@/src/components/charts/MetricsChart'

// const ActivityFeed = dynamic(
//   () => import('@/src/components/ActivityFeed').then(mod => mod.ActivityFeed),
//   { 
//     loading: () => (
//       <Card className="animate-pulse">
//         <CardHeader>
//           <div className="h-4 bg-gray-200 rounded w-1/4"></div>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-3">
//             {[1, 2, 3].map(i => (
//               <div key={i} className="h-12 bg-gray-100 rounded"></div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }
// )

// const PerformanceMetrics = dynamic(
//   () => import('@/src/components/PerformanceMetrics').then(mod => mod.PerformanceMetrics),
//   { 
//     loading: () => (
//       <Card className="animate-pulse">
//         <CardHeader>
//           <div className="h-4 bg-gray-200 rounded w-1/4"></div>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-3">
//             {[1, 2, 3].map(i => (
//               <div key={i} className="h-8 bg-gray-100 rounded"></div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }
// )

// DashboardStat interface is now imported from DashboardStats component

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
    href: '/dashboard/content',
    icon: <Plus className="h-5 w-5" />,
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: '2',
    title: 'Add Products',
    description: 'Manage your product catalog',
    href: '/dashboard/products',
    icon: <Package className="h-5 w-5" />,
    color: 'bg-gray-1000 hover:bg-green-600'
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
  const { site: currentSite, loading: siteLoading } = useSite()
  const { data: siteStats, loading: statsLoading } = useSiteStats()
  const { data: metrics, loading: metricsLoading } = useDashboardMetrics()

  debug.dashboard('Dashboard page render:', {
    user: !!user,
    currentSite: !!currentSite,
    siteLoading,
    statsLoading,
    metricsLoading,
    siteId: currentSite?.id,
    siteName: currentSite?.name
  })

  // Memoize dashboard stats to prevent recalculation on every render
  const dashboardStats: DashboardStat[] = useMemo(() => [
    {
      id: '1',
      title: 'Content',
      count: siteStats?.totalContent || 0,
      trend: `${metrics?.contentGrowth || 0}% this week`,
      icon: <FileText className="h-6 w-6" />,
      color: 'text-blue-600'
    },
    {
      id: '2',
      title: 'Products',
      count: siteStats?.totalProducts || 0,
      trend: `${metrics?.productGrowth || 0}% this month`,
      icon: <Package className="h-6 w-6" />,
      color: 'text-green-600'
    },
    {
      id: '3',
      title: 'Orders',
      count: metrics?.totalOrders || 0,
      trend: `+${metrics?.newOrdersToday || 0} today`,
      icon: <ShoppingCart className="h-6 w-6" />,
      color: 'text-purple-600'
    },
    {
      id: '4',
      title: 'Site Views',
      count: metrics?.totalViews || 0,
      trend: `${metrics?.viewsGrowth || 0}% this week`,
      icon: <Eye className="h-6 w-6" />,
      color: 'text-orange-600'
    }
  ], [siteStats, metrics])

  const isLoading = statsLoading || metricsLoading

  // Enhanced loading detection for site switching scenarios
  const isCriticalLoading = siteLoading || !user || (!currentSite && !siteLoading)

  // Wait for critical data (site and user) to load before rendering
  // This prevents the animations from playing twice and handles site switching properly
  if (isCriticalLoading) {
    debug.dashboard('Showing loading state:', {
      siteLoading,
      hasUser: !!user,
      hasCurrentSite: !!currentSite,
      reason: !user ? 'no-user' : siteLoading ? 'site-loading' : !currentSite ? 'no-site' : 'unknown'
    })

    return (
      <div className="space-y-8">
        {/* Loading skeleton that matches the layout */}
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-6 w-6 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-3 w-[80px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  debug.dashboard('Rendering dashboard content for site:', currentSite?.name)

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="fade-in-up flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ animationDelay: '0s' }}>
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-2">
            Welcome back, {user?.email?.split('@')[0]}! Here&apos;s what&apos;s happening with {currentSite?.business_name || 'your site'}.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={() => router.push('/dashboard/sites?create=true')}
            className="btn-gradient-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create A New Site</span>
          </Button>
          <Button
            onClick={() => {
              if (currentSite) {
                window.open(getCustomerSiteFullUrl(currentSite), '_blank')
              }
            }}
            disabled={!currentSite}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Eye className="h-4 w-4" />
            <span>View Site</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <DashboardStats 
        stats={dashboardStats}
        isLoading={isLoading}
        className="fade-in-up"
        animationDelay={0.2}
      />

      {/* Quick Actions */}
      <Card className="fade-in-up" style={{ animationDelay: '0.7s' }}>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-3 sm:p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-shadow"
                onClick={() => router.push(action.href)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-1.5 sm:p-2 rounded-md ${action.color} text-white`}>
                    {action.icon}
                  </div>
                  <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm sm:text-base">{action.title}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2 fade-in-up" style={{ animationDelay: '0.8s' }}>
        <MetricsChart
          title="Site Views"
          description="Daily site views over the last 30 days"
          type="views"
        />
        <MetricsChart
          title="Order Volume"
          description="Daily orders over the last 30 days"
          type="orders"
        />
      </div>

      {/* Activity Feed and Performance Metrics - Hidden for now */}
      {/* <div className="grid gap-6 lg:grid-cols-2 fade-in-up" style={{ animationDelay: '0.9s' }}>
        <ActivityFeed />
        <PerformanceMetrics />
      </div> */}
    </div>
  )
}