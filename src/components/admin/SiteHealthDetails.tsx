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
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Progress } from '@/src/components/ui/progress'
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  RefreshCw,
  Server,
  Shield,
  Timer,
  TrendingUp,
  Wifi,
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
  Bar
} from 'recharts'
import {
  checkSiteHealth,
  getSiteHealthSummary,
  getSiteHealthChecks,
  getSiteUptimeStats,
  type SiteHealthSummary,
  type SiteHealthCheck
} from '@/src/lib/admin/monitoring'

interface SiteHealthDetailsProps {
  siteId: string
  siteName: string
}

interface HealthComponentProps {
  title: string
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  description?: string
  lastChecked?: string
  metrics?: Record<string, any>
}

function HealthComponent({ title, status, description, lastChecked, metrics }: HealthComponentProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'critical': return <AlertCircle className="h-5 w-5 text-red-600" />
      default: return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <Card className={`border-2 ${getStatusColor(status)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge 
            variant={status === 'healthy' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}
          >
            {status.toUpperCase()}
          </Badge>
        </div>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      {(lastChecked || metrics) && (
        <CardContent className="pt-0">
          {lastChecked && (
            <p className="text-xs text-muted-foreground mb-2">
              Last checked: {new Date(lastChecked).toLocaleString()}
            </p>
          )}
          {metrics && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(metrics).map(([key, value]) => (
                <div key={key}>
                  <p className="text-muted-foreground">{key.replace(/_/g, ' ')}</p>
                  <p className="font-medium">{String(value)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export function SiteHealthDetails({ siteId, siteName }: SiteHealthDetailsProps) {
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false)

  // Fetch current health status
  const {
    data: currentHealth,
    isLoading: isLoadingCurrent,
    error: currentError,
    refetch: refetchCurrent
  } = useQuery<SiteHealthSummary>({
    queryKey: ['site-health-current', siteId],
    queryFn: () => checkSiteHealth(siteId),
    refetchInterval: 60000, // Refresh every minute
  })

  // Fetch health summary with trends
  const {
    data: healthSummary,
    isLoading: isLoadingSummary,
    refetch: refetchSummary
  } = useQuery({
    queryKey: ['site-health-summary', siteId, 7],
    queryFn: () => getSiteHealthSummary(siteId, 7),
    refetchInterval: 300000, // Refresh every 5 minutes
  })

  // Fetch recent health checks
  const {
    data: recentChecks,
    isLoading: isLoadingChecks
  } = useQuery<SiteHealthCheck[]>({
    queryKey: ['site-health-checks', siteId, 50],
    queryFn: () => getSiteHealthChecks(siteId, 50),
    refetchInterval: 120000, // Refresh every 2 minutes
  })

  // Fetch uptime statistics
  const {
    data: uptimeStats,
    isLoading: isLoadingUptime
  } = useQuery({
    queryKey: ['site-uptime-stats', siteId, 30],
    queryFn: () => getSiteUptimeStats(siteId, 30),
    refetchInterval: 300000,
  })

  const handleRunHealthCheck = async () => {
    try {
      setIsRunningHealthCheck(true)
      await checkSiteHealth(siteId)
      
      // Refetch data after health check completes
      setTimeout(() => {
        refetchCurrent()
        refetchSummary()
      }, 2000)
    } catch (error) {
      console.error('Failed to run health check:', error)
    } finally {
      setIsRunningHealthCheck(false)
    }
  }

  if (currentError) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load site health data. Please try again.
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
          <h1 className="text-3xl font-bold">Site Health Details</h1>
          <p className="text-muted-foreground">{siteName}</p>
        </div>
        <Button
          onClick={handleRunHealthCheck}
          disabled={isRunningHealthCheck}
          variant="outline"
        >
          {isRunningHealthCheck ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Activity className="h-4 w-4 mr-2" />
          )}
          {isRunningHealthCheck ? 'Checking...' : 'Run Health Check'}
        </Button>
      </div>

      {isLoadingCurrent ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : currentHealth ? (
        <>
          {/* Overall Health Score */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Overall Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-4xl font-bold mb-2">
                    {currentHealth.health_score}/100
                  </div>
                  <Progress 
                    value={currentHealth.health_score} 
                    className="w-full h-3"
                  />
                </div>
                <div className="text-right">
                  <Badge 
                    variant={
                      currentHealth.overall_status === 'healthy' ? 'default' :
                      currentHealth.overall_status === 'warning' ? 'secondary' : 'destructive'
                    }
                    className="text-lg px-4 py-2"
                  >
                    {currentHealth.overall_status.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Last checked: {new Date(currentHealth.checked_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime (24h)</CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentHealth.uptime_24h.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentHealth.avg_response_time_ms || 0}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Average response
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Items</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentHealth.metrics.content_count}
                </div>
                <p className="text-xs text-muted-foreground">
                  Published content
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Component Health Status */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Component Health</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <HealthComponent
                title="Domain"
                status={currentHealth.components.domain as any}
                description="DNS resolution and domain configuration"
                lastChecked={currentHealth.checked_at}
              />
              <HealthComponent
                title="SSL Certificate"
                status={currentHealth.components.ssl as any}
                description="SSL certificate validity and security"
                lastChecked={currentHealth.checked_at}
              />
              <HealthComponent
                title="Content"
                status={currentHealth.components.content as any}
                description="Published content availability"
                lastChecked={currentHealth.checked_at}
                metrics={{
                  'Content Items': currentHealth.metrics.content_count,
                  'Products': currentHealth.metrics.product_count
                }}
              />
              <HealthComponent
                title="Performance"
                status={currentHealth.components.performance as any}
                description="Site speed and responsiveness"
                lastChecked={currentHealth.checked_at}
                metrics={{
                  'Avg Response': `${currentHealth.avg_response_time_ms || 0}ms`,
                  'Uptime 24h': `${currentHealth.uptime_24h.toFixed(1)}%`
                }}
              />
            </div>
          </div>

          {/* Issues and Warnings */}
          {(currentHealth.issues.length > 0 || currentHealth.warnings.length > 0) && (
            <div className="space-y-4">
              {currentHealth.issues.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      Critical Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentHealth.issues.map((issue, index) => (
                        <Alert key={index}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>{issue.type}:</strong> {issue.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentHealth.warnings.length > 0 && (
                <Card className="border-yellow-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="h-5 w-5" />
                      Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentHealth.warnings.map((warning, index) => (
                        <Alert key={index}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>{warning.type}:</strong> {warning.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Historical Data */}
          {!isLoadingSummary && healthSummary && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Uptime Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Uptime Trend (7 Days)</CardTitle>
                  <CardDescription>
                    Daily uptime percentage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* TODO: Add historical_data to SiteHealthSummary type */}
                  {(healthSummary as any).historical_data?.uptime_trend?.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={(healthSummary as any).historical_data.uptime_trend}>
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

              {/* Response Time Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Response Time Trend</CardTitle>
                  <CardDescription>
                    Average response time over 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(healthSummary as any).historical_data?.uptime_trend?.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={(healthSummary as any).historical_data.uptime_trend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            formatter={(value: number) => [`${value}ms`, 'Response Time']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="avg_response_time" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No response time data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Error Trend */}
              {(healthSummary as any).historical_data?.error_trend?.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Error Trend</CardTitle>
                    <CardDescription>
                      Daily error count over the last 7 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={(healthSummary as any).historical_data.error_trend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            formatter={(value: number) => [value, 'Errors']}
                          />
                          <Bar 
                            dataKey="error_count" 
                            fill="#ef4444"
                            name="Errors"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Uptime Statistics */}
          {!isLoadingUptime && uptimeStats && (
            <Card>
              <CardHeader>
                <CardTitle>Uptime Statistics (30 Days)</CardTitle>
                <CardDescription>
                  Detailed uptime metrics and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {uptimeStats.uptime_percentage.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {uptimeStats.successful_checks}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Successful checks
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {uptimeStats.avg_response_time}ms
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Avg response time
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {uptimeStats.max_downtime_minutes}m
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Max downtime
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Health Checks */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Health Checks</CardTitle>
              <CardDescription>
                Latest health check results and history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingChecks ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : recentChecks && recentChecks.length > 0 ? (
                <div className="space-y-3">
                  {recentChecks.slice(0, 10).map((check) => (
                    <div key={check.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          check.status === 'healthy' ? 'bg-green-500' :
                          check.status === 'warning' ? 'bg-yellow-500' : 
                          check.status === 'critical' ? 'bg-red-500' : 'bg-gray-500'
                        }`} />
                        <div>
                          <p className="font-medium">{check.check_type.replace('_', ' ')}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(check.checked_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            check.status === 'healthy' ? 'default' :
                            check.status === 'warning' ? 'secondary' : 'destructive'
                          }
                        >
                          {check.status}
                        </Badge>
                        {check.response_time_ms && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {check.response_time_ms}ms
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No health check history available
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}