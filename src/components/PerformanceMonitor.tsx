'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Activity, Zap, Layout, MousePointer, Clock, Server } from 'lucide-react'
import { getRating, formatMetricValue } from '@/src/lib/performance'

interface Metric {
  name: string
  value: number | null
  rating: 'good' | 'needs-improvement' | 'poor' | null
  icon: React.ReactNode
  description: string
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      name: 'FCP',
      value: null,
      rating: null,
      icon: <Zap className="h-4 w-4" />,
      description: 'First Contentful Paint'
    },
    {
      name: 'LCP',
      value: null,
      rating: null,
      icon: <Layout className="h-4 w-4" />,
      description: 'Largest Contentful Paint'
    },
    {
      name: 'FID',
      value: null,
      rating: null,
      icon: <MousePointer className="h-4 w-4" />,
      description: 'First Input Delay'
    },
    {
      name: 'CLS',
      value: null,
      rating: null,
      icon: <Activity className="h-4 w-4" />,
      description: 'Cumulative Layout Shift'
    },
    {
      name: 'INP',
      value: null,
      rating: null,
      icon: <Clock className="h-4 w-4" />,
      description: 'Interaction to Next Paint'
    },
    {
      name: 'TTFB',
      value: null,
      rating: null,
      icon: <Server className="h-4 w-4" />,
      description: 'Time to First Byte'
    },
  ])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Observe performance metrics
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const metricName = entry.name
        let value = 0
        
        // Handle different performance entry types
        if ('value' in entry && typeof entry.value === 'number') {
          value = entry.value
        } else if ('duration' in entry && typeof entry.duration === 'number') {
          value = entry.duration
        } else if ('loadTime' in entry) {
          const loadTime = (entry as any).loadTime
          value = typeof loadTime === 'number' ? loadTime : 0
        } else if ('renderTime' in entry) {
          const renderTime = (entry as any).renderTime
          value = typeof renderTime === 'number' ? renderTime : 0
        }
        
        setMetrics(prev => prev.map(metric => {
          if (metric.name === metricName) {
            return {
              ...metric,
              value,
              rating: getRating(metricName, value)
            }
          }
          return metric
        }))
      }
    })

    // Observe all web vitals
    try {
      observer.observe({ entryTypes: ['web-vital', 'measure', 'navigation'] })
    } catch (e) {
      // Fallback for browsers that don't support all entry types
      try {
        observer.observe({ entryTypes: ['measure'] })
      } catch (e) {
        console.log('Performance Observer not supported')
      }
    }

    return () => observer.disconnect()
  }, [])

  const getRatingColor = (rating: string | null) => {
    switch (rating) {
      case 'good':
        return 'text-green-600 bg-green-50'
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-50'
      case 'poor':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getRatingBadgeVariant = (rating: string | null) => {
    switch (rating) {
      case 'good':
        return 'default'
      case 'needs-improvement':
        return 'secondary'
      case 'poor':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-lg z-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Performance Monitor
        </CardTitle>
        <CardDescription className="text-xs">
          Real-time Core Web Vitals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${getRatingColor(metric.rating)}`}>
                  {metric.icon}
                </div>
                <span className="font-medium">{metric.description}</span>
              </div>
              <div className="flex items-center gap-2">
                {metric.value !== null && (
                  <>
                    <span className="font-mono">
                      {formatMetricValue(metric.name, metric.value)}
                    </span>
                    <Badge variant={getRatingBadgeVariant(metric.rating)} className="text-xs px-1 py-0">
                      {metric.rating || 'pending'}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}