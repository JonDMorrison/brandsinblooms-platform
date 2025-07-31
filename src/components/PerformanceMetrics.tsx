'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'
import { useSiteMetrics, useMetricsHistory } from '@/hooks/useSiteMetrics'
import { useMemo } from 'react'

interface MetricItem {
  id: string
  name: string
  value: number
  maxValue: number
  change: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
    period: string
  }
  status: 'excellent' | 'good' | 'average' | 'poor'
}

const metricConfig = [
  { key: 'performance', name: 'Site Performance', maxValue: 100 },
  { key: 'page_load', name: 'Page Load Speed', maxValue: 100 },
  { key: 'seo', name: 'SEO Score', maxValue: 100 },
  { key: 'mobile', name: 'Mobile Optimization', maxValue: 100 },
  { key: 'security', name: 'Security Score', maxValue: 100 },
  { key: 'accessibility', name: 'Accessibility', maxValue: 100 }
] as const


const getMetricStatus = (value: number): MetricItem['status'] => {
  if (value >= 90) return 'excellent'
  if (value >= 70) return 'good'
  if (value >= 50) return 'average'
  return 'poor'
}

const getStatusColor = (status: MetricItem['status']) => {
  switch (status) {
    case 'excellent':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'good':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'average':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'poor':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const getTrendIcon = (type: MetricItem['change']['type']) => {
  const iconProps = { className: 'h-3 w-3' }
  
  switch (type) {
    case 'increase':
      return <TrendingUp {...iconProps} className="h-3 w-3 text-green-500" />
    case 'decrease':
      return <TrendingDown {...iconProps} className="h-3 w-3 text-red-500" />
    case 'neutral':
      return <Minus {...iconProps} className="h-3 w-3 text-gray-500" />
    default:
      return <Minus {...iconProps} className="h-3 w-3 text-gray-500" />
  }
}

export function PerformanceMetrics() {
  const { data: currentMetrics, isLoading: isLoadingCurrent, error: currentError } = useSiteMetrics()
  const { data: history, isLoading: isLoadingHistory } = useMetricsHistory(7) // Last 7 days
  
  // Calculate metric changes from history
  const metrics = useMemo(() => {
    if (!currentMetrics) return []
    
    return metricConfig.map((config, index) => {
      const currentMetric = currentMetrics[config.key]
      const currentValue = currentMetric?.score || 0
      const status = getMetricStatus(currentValue)
      
      // Use trend from metrics or calculate change from history
      let change: MetricItem['change'] = {
        value: currentMetric?.change || 0,
        type: currentMetric?.trend === 'up' ? 'increase' : 
              currentMetric?.trend === 'down' ? 'decrease' : 'neutral',
        period: 'vs previous day'
      }
      
      // If we have history data, calculate weekly change
      if (history && Array.isArray(history) && history.length > 1) {
        const lastWeekMetrics = history[0] // First item is oldest
        const lastWeekMetric = lastWeekMetrics?.metrics?.[config.key]
        const lastWeekValue = lastWeekMetric?.score || 0
        
        if (lastWeekValue > 0) {
          const changeValue = currentValue - lastWeekValue
          change = {
            value: Math.abs(changeValue),
            type: changeValue > 0 ? 'increase' : changeValue < 0 ? 'decrease' : 'neutral',
            period: 'vs last week'
          }
        }
      }
      
      return {
        id: String(index + 1),
        name: config.name,
        value: currentValue,
        maxValue: config.maxValue,
        change,
        status
      }
    })
  }, [currentMetrics, history])
  
  if (isLoadingCurrent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Site Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-2 flex-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (currentError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Site Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load performance metrics. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }
  
  if (!currentMetrics || metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Site Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No metrics available yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Metrics will be collected automatically as your site receives traffic
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {metrics.map((metric) => (
            <div key={metric.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {getTrendIcon(metric.change.type)}
                  <span>
                    {metric.change.type === 'increase' && '+'}
                    {metric.change.type === 'decrease' && '-'}
                    {metric.change.value > 0 && `${metric.change.value}%`}
                    {metric.change.value === 0 && 'No change'}
                  </span>
                  <span className="text-muted-foreground">{metric.change.period}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Progress 
                  value={metric.value} 
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">
                  {metric.value}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}