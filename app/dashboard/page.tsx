'use client'

import React, { useMemo, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
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
  X,
} from 'lucide-react'
import { useAuth } from '@/src/contexts/AuthContext'
import { useSite } from '@/src/hooks/useSite'
import { useDashboardMetrics, useSiteStats } from '@/src/hooks/useStats'
import { Skeleton } from '@/src/components/ui/skeleton'
import { DashboardStats, type DashboardStat } from '@/src/components/DashboardStats'
import { debug } from '@/src/lib/utils/debug'
import { useDesignSettings } from '@/src/hooks/useDesignSettings'

// Import MetricsChart for actual data visualization
import { MetricsChart } from '@/src/components/charts/MetricsChart'

// Dynamic import for DesignPreview
const DesignPreview = dynamic(
  () => import('@/src/components/design/DesignPreview').then(mod => mod.DesignPreview),
  {
    loading: () => <Skeleton className="h-[600px] w-full" />,
    ssr: false
  }
)

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
  const { data: designSettings } = useDesignSettings()
  const [previewMode, setPreviewMode] = useState<boolean>(false)

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
        <Button
          onClick={() => setPreviewMode(!previewMode)}
          className="flex items-center gap-2 w-full sm:w-auto"
          variant="outline"
        >
          <Eye className="h-4 w-4" />
          <span>{previewMode ? 'Close' : 'View Site'}</span>
        </Button>
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

      {/* Site Preview Modal */}
      {previewMode && designSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] flex flex-col my-2 sm:my-4">
              <div className="flex items-center justify-end p-3 sm:p-4 border-b flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreviewMode(false)}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden relative bg-white flex items-center justify-center">
                <Suspense fallback={
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Eye className="h-8 w-8 animate-pulse text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Loading preview...</p>
                    </div>
                  </div>
                }>
                  <DesignPreview settings={designSettings} className="h-full w-full border-0 shadow-none" />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}