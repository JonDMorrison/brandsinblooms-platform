'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Progress } from '@/src/components/ui/progress'
import { Badge } from '@/src/components/ui/badge'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useSiteId } from '@/contexts/SiteContext'
import { useMemo, useEffect, useState } from 'react'

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
      return 'bg-green-100 text-green-800  '
    case 'good':
      return 'bg-blue-100 text-blue-800  '
    case 'average':
      return 'bg-yellow-100 text-yellow-800  '
    case 'poor':
      return 'bg-red-100 text-red-800  '
    default:
      return 'bg-gray-100 text-gray-800  '
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
  const siteId = useSiteId()
  
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(true)
  const [currentError, setCurrentError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!siteId) {
        setPerformanceData(null)
        setIsLoadingCurrent(false)
        return
      }
      
      setIsLoadingCurrent(true)
      try {
        // Get the latest performance metrics
        const { data: latestArray, error: latestError } = await supabase
          .from('site_performance_metrics')
          .select('*')
          .eq('site_id', siteId)
          .order('recorded_at', { ascending: false })
          .limit(1)
        
        if (latestError) {
          throw latestError
        }
        
        const latest = latestArray?.[0] || null
        
        // Get previous week's metrics for comparison
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        
        const { data: previousArray, error: previousError } = await supabase
          .from('site_performance_metrics')
          .select('*')
          .eq('site_id', siteId)
          .lte('recorded_at', oneWeekAgo.toISOString())
          .order('recorded_at', { ascending: false })
          .limit(1)
        
        if (previousError) {
          console.warn('Could not fetch previous week metrics:', previousError)
        }
        
        const previous = previousArray?.[0] || null
        
        setPerformanceData({ latest, previous })
        setCurrentError(null)
      } catch (error) {
        setCurrentError(error as Error)
        setPerformanceData(null)
      } finally {
        setIsLoadingCurrent(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000) // 5 minutes
    return () => clearInterval(interval)
  }, [siteId])
  
  // Calculate metric changes from history
  const metrics = useMemo(() => {
    if (!performanceData?.latest) return []
    
    const { latest, previous } = performanceData
    
    // Map real performance data to metrics
    const performanceMetrics: MetricItem[] = [
      {
        id: '1',
        name: 'Site Performance',
        // Calculate performance score based on Core Web Vitals
        value: Math.round(
          (100 - (latest.avg_largest_contentful_paint_ms || 2500) / 40) * 0.5 +
          (100 - (latest.avg_first_contentful_paint_ms || 1800) / 30) * 0.3 +
          (100 - (latest.avg_cumulative_layout_shift || 0.1) * 500) * 0.2
        ),
        maxValue: 100,
        change: {
          value: previous ? Math.round(Math.abs(
            ((latest.avg_page_load_time_ms || 0) - (previous.avg_page_load_time_ms || 0)) / 
            (previous.avg_page_load_time_ms || 1) * 100
          )) : 0,
          type: previous && (latest.avg_page_load_time_ms || 0) < (previous.avg_page_load_time_ms || 0) ? 'increase' : 'decrease',
          period: 'vs last week'
        },
        status: getMetricStatus(85) // Placeholder
      },
      {
        id: '2',
        name: 'Page Load Speed',
        value: Math.max(0, Math.round(100 - (latest.avg_page_load_time_ms || 3000) / 50)),
        maxValue: 100,
        change: {
          value: previous ? Math.round(Math.abs(
            ((latest.avg_page_load_time_ms || 0) - (previous.avg_page_load_time_ms || 0)) / 
            (previous.avg_page_load_time_ms || 1) * 100
          )) : 0,
          type: previous && (latest.avg_page_load_time_ms || 0) < (previous.avg_page_load_time_ms || 0) ? 'increase' : 'decrease',
          period: 'vs last week'
        },
        status: getMetricStatus(Math.max(0, Math.round(100 - (latest.avg_page_load_time_ms || 3000) / 50)))
      },
      {
        id: '3',
        name: 'SEO Score',
        value: Math.round(
          Math.min(100, 50 + 
          (latest.avg_search_position ? (30 - latest.avg_search_position) * 2 : 0) +
          (latest.search_clicks || 0) / (latest.search_impressions || 1) * 20)
        ),
        maxValue: 100,
        change: {
          value: previous ? Math.round(Math.abs(
            ((latest.avg_search_position || 0) - (previous.avg_search_position || 0))
          )) : 0,
          type: previous && (latest.avg_search_position || 0) < (previous.avg_search_position || 0) ? 'increase' : 'decrease',
          period: 'vs last week'
        },
        status: getMetricStatus(75) // Placeholder
      },
      {
        id: '4',
        name: 'Mobile Optimization',
        value: Math.round(
          100 - (latest.avg_first_input_delay_ms || 100) / 3 - 
          (latest.avg_cumulative_layout_shift || 0.1) * 100
        ),
        maxValue: 100,
        change: {
          value: 5,
          type: 'increase',
          period: 'vs last week'
        },
        status: getMetricStatus(88)
      },
      {
        id: '5',
        name: 'Security Score',
        value: Math.round(100 - (latest.error_rate || 0.02) * 1000),
        maxValue: 100,
        change: {
          value: previous ? Math.round(Math.abs(
            ((latest.error_rate || 0) - (previous.error_rate || 0)) * 100
          )) : 0,
          type: previous && (latest.error_rate || 0) < (previous.error_rate || 0) ? 'increase' : 'decrease',
          period: 'vs last week'
        },
        status: getMetricStatus(Math.round(100 - (latest.error_rate || 0.02) * 1000))
      },
      {
        id: '6',
        name: 'Accessibility',
        value: 92, // Placeholder - would need real accessibility data
        maxValue: 100,
        change: {
          value: 3,
          type: 'increase',
          period: 'vs last week'
        },
        status: getMetricStatus(92)
      }
    ]
    
    return performanceMetrics
  }, [performanceData])
  
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
  
  if (!performanceData?.latest || metrics.length === 0) {
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