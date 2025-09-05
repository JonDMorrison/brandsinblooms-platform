'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  RefreshCw,
  Server,
  Shield,
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'
import {
  getPlatformHealthOverview,
  runPlatformHealthChecks,
  getHealthCheckTrend,
  getSitesNeedingAttention,
  type PlatformHealthOverview
} from '@/src/lib/admin/monitoring'

interface HealthStatusProps {
  status: 'healthy' | 'warning' | 'critical'
  count: number
  label: string
  icon: React.ReactNode
}

function HealthStatusCard({ status, count, label, icon }: HealthStatusProps) {
  const colors = {
    healthy: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    critical: 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <Card className={`border-2 ${colors[status]}`}>
      <CardContent className="flex items-center p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/50">
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-sm font-medium">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

interface UptimeTrendData {
  date: string
  uptime_percentage: number
  avg_response_time: number
  error_count: number
}

interface SiteIssue {
  site_id: string
  site_name: string
  health_score: number
  status: string
  issues: string[]
  last_checked: string
}

export function SiteHealthDashboard() {
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false)
  const [lastHealthCheckRun, setLastHealthCheckRun] = useState<string | null>(null)

  const [healthOverview, setHealthOverview] = useState<PlatformHealthOverview | null>(null)
  const [uptimeTrends, setUptimeTrends] = useState<UptimeTrendData[] | null>(null)
  const [sitesNeedingAttention, setSitesNeedingAttention] = useState<SiteIssue[] | null>(null)
  const [isLoadingOverview, setIsLoadingOverview] = useState(true)
  const [isLoadingTrends, setIsLoadingTrends] = useState(true)
  const [isLoadingSites, setIsLoadingSites] = useState(true)
  const [overviewError, setOverviewError] = useState<Error | null>(null)

  // Fetch data on component mount and periodically
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingOverview(true)
        const overview = await getPlatformHealthOverview()
        setHealthOverview(overview)
        setOverviewError(null)
      } catch (error) {
        setOverviewError(error as Error)
      } finally {
        setIsLoadingOverview(false)
      }

      try {
        setIsLoadingTrends(true)
        const trends = await getHealthCheckTrend(undefined, 7, 'uptime')
        setUptimeTrends(trends)
      } catch (error) {
        console.error('Failed to load trends:', error)
      } finally {
        setIsLoadingTrends(false)
      }

      try {
        setIsLoadingSites(true)
        const sites = await getSitesNeedingAttention()
        setSitesNeedingAttention(sites)
      } catch (error) {
        console.error('Failed to load sites needing attention:', error)
      } finally {
        setIsLoadingSites(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const refetchOverview = async () => {
    try {
      const overview = await getPlatformHealthOverview()
      setHealthOverview(overview)
    } catch (error) {
      console.error('Failed to refetch overview:', error)
    }
  }

  const refetchSites = async () => {
    try {
      const sites = await getSitesNeedingAttention()
      setSitesNeedingAttention(sites)
    } catch (error) {
      console.error('Failed to refetch sites:', error)
    }
  }

  const handleRunHealthChecks = async () => {
    try {
      setIsRunningHealthCheck(true)
      await runPlatformHealthChecks()
      setLastHealthCheckRun(new Date().toLocaleTimeString())
      
      // Refetch data after health checks complete
      setTimeout(() => {
        refetchOverview()
        refetchSites()
      }, 2000)
    } catch (error) {
      console.error('Failed to run health checks:', error)
    } finally {
      setIsRunningHealthCheck(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981'
      case 'warning': return '#f59e0b'
      case 'critical': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy': return 'default'
      case 'warning': return 'secondary'
      case 'critical': return 'destructive'
      default: return 'outline'
    }
  }

  if (overviewError) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load platform health data. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Health Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and health status of all sites
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastHealthCheckRun && (
            <p className="text-sm text-muted-foreground">
              Last check: {lastHealthCheckRun}
            </p>
          )}
          <Button
            onClick={handleRunHealthChecks}
            disabled={isRunningHealthCheck}
            variant="outline"
          >
            {isRunningHealthCheck ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            {isRunningHealthCheck ? 'Running...' : 'Run Health Checks'}
          </Button>
        </div>
      </div>

      {isLoadingOverview ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : healthOverview ? (
        <>
          {/* Health Status Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <HealthStatusCard
              status="healthy"
              count={healthOverview.healthy_sites}
              label="Healthy Sites"
              icon={<CheckCircle className="h-6 w-6 text-green-600" />}
            />
            <HealthStatusCard
              status="warning"
              count={healthOverview.warning_sites}
              label="Warning Sites"
              icon={<AlertCircle className="h-6 w-6 text-yellow-600" />}
            />
            <HealthStatusCard
              status="critical"
              count={healthOverview.critical_sites}
              label="Critical Sites"
              icon={<AlertCircle className="h-6 w-6 text-red-600" />}
            />
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{healthOverview.total_sites}</p>
                  <p className="text-sm font-medium text-muted-foreground">Total Sites</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Metrics */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Uptime</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthOverview.avg_platform_uptime.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthOverview.avg_response_time}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Platform average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Errors (24h)</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthOverview.total_errors_24h}
                </div>
                <p className="text-xs text-muted-foreground">
                  Critical issues
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Health Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Health Distribution</CardTitle>
                <CardDescription>
                  Current health status across all sites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Healthy', value: healthOverview.health_distribution.healthy, color: '#10b981' },
                          { name: 'Warning', value: healthOverview.health_distribution.warning, color: '#f59e0b' },
                          { name: 'Critical', value: healthOverview.health_distribution.critical, color: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: 'Healthy', value: healthOverview.health_distribution.healthy, color: '#10b981' },
                          { name: 'Warning', value: healthOverview.health_distribution.warning, color: '#f59e0b' },
                          { name: 'Critical', value: healthOverview.health_distribution.critical, color: '#ef4444' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Uptime Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Uptime Trend (7 Days)</CardTitle>
                <CardDescription>
                  Platform uptime percentage over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTrends ? (
                  <div className="h-64 flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : uptimeTrends && uptimeTrends.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={uptimeTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis 
                          domain={[95, 100]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value: number) => [`${value}%`, 'Uptime']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="uptime_percentage" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No uptime data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sites Needing Attention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Sites Needing Attention
              </CardTitle>
              <CardDescription>
                Sites with health warnings or critical issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSites ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : sitesNeedingAttention && sitesNeedingAttention.length > 0 ? (
                <div className="space-y-4">
                  {sitesNeedingAttention.map((site) => (
                    <div key={site.site_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{site.site_name}</h4>
                          <Badge variant={getStatusBadgeVariant(site.status)}>
                            {site.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Score: {site.health_score}/100
                          </span>
                        </div>
                        {site.issues.length > 0 && (
                          <div className="space-y-1">
                            {site.issues.slice(0, 2).map((issue, index) => (
                              <p key={index} className="text-sm text-red-600">
                                • {issue}
                              </p>
                            ))}
                            {site.issues.length > 2 && (
                              <p className="text-sm text-muted-foreground">
                                +{site.issues.length - 2} more issues
                              </p>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Last checked: {new Date(site.last_checked).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm">
                          Fix Issues
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <p className="text-lg font-medium">All Sites Healthy</p>
                  <p className="text-sm">No sites currently need attention</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Issues */}
          {healthOverview.recent_issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Issues</CardTitle>
                <CardDescription>
                  Latest critical issues across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {healthOverview.recent_issues.slice(0, 5).map((issue, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-red-800">{issue.site_name}</h5>
                          <Badge variant="destructive" className="text-xs">
                            {issue.issue_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-red-700">{issue.message}</p>
                        <p className="text-xs text-red-600 mt-1">
                          {new Date(issue.occurred_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}