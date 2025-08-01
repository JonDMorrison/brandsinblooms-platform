'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import {
  Activity,
  BarChart3,
  Download,
  Eye,
  Globe,
  MousePointer,
  RefreshCw,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts'
import {
  getSiteAnalytics,
  getTrafficTrends,
  getPerformanceTrends,
  getCoreWebVitalsTrends,
  getSiteEngagementMetrics,
  exportAnalyticsData,
  type SiteAnalyticsSummary
} from '@/src/lib/admin/analytics'

interface SiteAnalyticsProps {
  siteId: string
  siteName: string
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

function MetricCard({ title, value, subtitle, icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`h-4 w-4 mr-1 ${!trend.isPositive ? 'rotate-180' : ''}`} />
            {Math.abs(trend.value)}% from last period
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function SiteAnalytics({ siteId, siteName }: SiteAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<number>(30)
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [isExporting, setIsExporting] = useState(false)

  // Fetch site analytics summary
  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery<SiteAnalyticsSummary>({
    queryKey: ['site-analytics', siteId, timeRange, periodType],
    queryFn: () => getSiteAnalytics(siteId, timeRange, periodType),
    refetchInterval: 300000, // Refresh every 5 minutes
  })

  // Fetch traffic trends
  const {
    data: trafficTrends,
    isLoading: isLoadingTraffic
  } = useQuery({
    queryKey: ['traffic-trends', siteId, timeRange, periodType],
    queryFn: () => getTrafficTrends(siteId, timeRange, periodType),
    refetchInterval: 300000,
  })

  // Fetch performance trends
  const {
    data: performanceTrends,
    isLoading: isLoadingPerformance
  } = useQuery({
    queryKey: ['performance-trends', siteId, timeRange, periodType],
    queryFn: () => getPerformanceTrends(siteId, timeRange, periodType),
    refetchInterval: 300000,
  })

  // Fetch Core Web Vitals
  const {
    data: coreWebVitals,
    isLoading: isLoadingCWV
  } = useQuery({
    queryKey: ['core-web-vitals', siteId, timeRange],
    queryFn: () => getCoreWebVitalsTrends(siteId, timeRange),
    refetchInterval: 300000,
  })

  // Fetch engagement metrics
  const {
    data: engagementMetrics,
    isLoading: isLoadingEngagement
  } = useQuery({
    queryKey: ['engagement-metrics', siteId, timeRange],
    queryFn: () => getSiteEngagementMetrics(siteId, timeRange),
    refetchInterval: 300000,
  })

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const csvData = await exportAnalyticsData(siteId, timeRange, true)
      
      // Create and download the file
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${siteName}-analytics-${timeRange}days.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const deviceColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  if (analyticsError) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Failed to load analytics</p>
          <p className="text-sm text-muted-foreground mb-4">
            There was an error loading the analytics data
          </p>
          <Button onClick={() => refetchAnalytics()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Analytics</h1>
          <p className="text-muted-foreground">{siteName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodType} onValueChange={(value: any) => setPeriodType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
          >
            {isExporting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
        </div>
      </div>

      {isLoadingAnalytics ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Unique Visitors"
              value={formatNumber(analytics.summary_metrics.total_unique_visitors)}
              subtitle={`${timeRange} days`}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Page Views"
              value={formatNumber(analytics.summary_metrics.total_page_views)}
              subtitle={`${timeRange} days`}
              icon={<Eye className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Avg. Session Duration"
              value={analytics.summary_metrics.avg_session_duration 
                ? formatDuration(analytics.summary_metrics.avg_session_duration)
                : 'N/A'
              }
              subtitle="Per session"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Bounce Rate"
              value={analytics.summary_metrics.avg_bounce_rate 
                ? `${analytics.summary_metrics.avg_bounce_rate.toFixed(1)}%`
                : 'N/A'
              }
              subtitle="Visitors leaving immediately"
              icon={<MousePointer className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <Tabs defaultValue="traffic" className="space-y-6">
            <TabsList>
              <TabsTrigger value="traffic">Traffic</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="geography">Geography</TabsTrigger>
            </TabsList>

            {/* Traffic Tab */}
            <TabsContent value="traffic" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Traffic Trends Chart */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Traffic Trends</CardTitle>
                    <CardDescription>
                      Visitors and page views over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTraffic ? (
                      <div className="h-80 flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      </div>
                    ) : trafficTrends && trafficTrends.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={trafficTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip 
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <Area
                              yAxisId="left"
                              type="monotone"
                              dataKey="page_views"
                              fill="#3b82f6"
                              fillOpacity={0.3}
                              stroke="#3b82f6"
                              strokeWidth={2}
                              name="Page Views"
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="unique_visitors"
                              stroke="#10b981"
                              strokeWidth={2}
                              name="Unique Visitors"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center text-muted-foreground">
                        No traffic data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Device Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Device Breakdown</CardTitle>
                    <CardDescription>
                      Traffic by device type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.device_breakdown && Object.keys(analytics.device_breakdown).length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(analytics.device_breakdown).map(([key, value], index) => ({
                                name: key.charAt(0).toUpperCase() + key.slice(1),
                                value: Number(value),
                                color: deviceColors[index % deviceColors.length]
                              }))}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            >
                              {Object.entries(analytics.device_breakdown).map(([key, value], index) => (
                                <Cell key={`cell-${index}`} fill={deviceColors[index % deviceColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        No device data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sessions vs Bounce Rate */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sessions & Bounce Rate</CardTitle>
                    <CardDescription>
                      Session count and bounce rate trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trafficTrends && trafficTrends.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={trafficTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip 
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <Bar
                              yAxisId="left"
                              dataKey="sessions"
                              fill="#3b82f6"
                              name="Sessions"
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="bounce_rate"
                              stroke="#ef4444"
                              strokeWidth={2}
                              name="Bounce Rate %"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        No session data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Performance Metrics */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Performance Trends</CardTitle>
                    <CardDescription>
                      Page load times and server response metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPerformance ? (
                      <div className="h-80 flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      </div>
                    ) : performanceTrends && performanceTrends.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={performanceTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <YAxis />
                            <Tooltip 
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                              formatter={(value: number, name: string) => [
                                `${value}ms`,
                                name
                              ]}
                            />
                            <Line
                              type="monotone"
                              dataKey="avg_page_load_time"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              name="Page Load Time"
                            />
                            <Line
                              type="monotone"
                              dataKey="avg_server_response_time"
                              stroke="#10b981"
                              strokeWidth={2}
                              name="Server Response Time"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center text-muted-foreground">
                        No performance data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Core Web Vitals */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Core Web Vitals</CardTitle>
                    <CardDescription>
                      Google&apos;s Core Web Vitals metrics over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingCWV ? (
                      <div className="h-80 flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      </div>
                    ) : coreWebVitals && coreWebVitals.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={coreWebVitals}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <YAxis />
                            <Tooltip 
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <Line
                              type="monotone"
                              dataKey="first_contentful_paint"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              name="FCP (ms)"
                            />
                            <Line
                              type="monotone"
                              dataKey="largest_contentful_paint"
                              stroke="#10b981"
                              strokeWidth={2}
                              name="LCP (ms)"
                            />
                            <Line
                              type="monotone"
                              dataKey="first_input_delay"
                              stroke="#f59e0b"
                              strokeWidth={2}
                              name="FID (ms)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center text-muted-foreground">
                        No Core Web Vitals data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Engagement Tab */}
            <TabsContent value="engagement" className="space-y-6">
              {isLoadingEngagement ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-20 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : engagementMetrics ? (
                <>
                  {/* Engagement Metrics */}
                  <div className="grid gap-6 md:grid-cols-3">
                    <MetricCard
                      title="Form Submissions"
                      value={engagementMetrics.total_form_submissions}
                      subtitle={`${timeRange} days`}
                      icon={<MousePointer className="h-4 w-4 text-muted-foreground" />}
                    />
                    <MetricCard
                      title="Contact Inquiries"
                      value={engagementMetrics.total_contact_inquiries}
                      subtitle={`${timeRange} days`}
                      icon={<Globe className="h-4 w-4 text-muted-foreground" />}
                    />
                    <MetricCard
                      title="Product Views"
                      value={engagementMetrics.total_product_views}
                      subtitle={`${timeRange} days`}
                      icon={<Eye className="h-4 w-4 text-muted-foreground" />}
                    />
                  </div>

                  {/* Engagement Trends */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Engagement Trends</CardTitle>
                      <CardDescription>
                        User engagement metrics over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {engagementMetrics.engagement_trend.length > 0 ? (
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={engagementMetrics.engagement_trend}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                              />
                              <YAxis />
                              <Tooltip 
                                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                              />
                              <Area
                                type="monotone"
                                dataKey="form_submissions"
                                stackId="1"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                name="Form Submissions"
                              />
                              <Area
                                type="monotone"
                                dataKey="contact_inquiries"
                                stackId="1"
                                stroke="#10b981"
                                fill="#10b981"
                                name="Contact Inquiries"
                              />
                              <Area
                                type="monotone"
                                dataKey="product_views"
                                stackId="1"
                                stroke="#f59e0b"
                                fill="#f59e0b"
                                name="Product Views"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-80 flex items-center justify-center text-muted-foreground">
                          No engagement data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </TabsContent>

            {/* Geography Tab */}
            <TabsContent value="geography" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                  <CardDescription>
                    Top countries by visitor count
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.geographic_data.top_countries.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.geographic_data.top_countries.slice(0, 10).map((country: any, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="font-medium">{country.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${(country.visitors / analytics.summary_metrics.total_unique_visitors) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {country.visitors}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No geographic data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Pages */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Pages</CardTitle>
                  <CardDescription>
                    Most visited pages on your site
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.top_pages.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.top_pages.slice(0, 10).map((page: any, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="font-medium truncate flex-1 mr-4">{page.path}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${(page.views / analytics.summary_metrics.total_page_views) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {page.views}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No page data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  )
}