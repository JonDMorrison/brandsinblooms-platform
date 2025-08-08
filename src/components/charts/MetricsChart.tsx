'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useSiteId } from '@/contexts/SiteContext'
import { Skeleton } from '@/src/components/ui/skeleton'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricsChartProps {
  title: string
  description?: string
  type: 'views' | 'orders'
}

export function MetricsChart({ title, description, type }: MetricsChartProps) {
  const siteId = useSiteId()
  
  const { data, isLoading } = useQuery({
    queryKey: ['chart-data', siteId, type],
    queryFn: async () => {
      if (!siteId) return null
      
      // Get last 30 days of data
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      if (type === 'views') {
        const { data: metrics } = await supabase
          .from('site_metrics')
          .select('metric_date, page_views')
          .eq('site_id', siteId)
          .gte('metric_date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('metric_date', { ascending: true })
        
        return {
          data: metrics || [],
          total: metrics?.reduce((sum, item) => sum + (item.page_views || 0), 0) || 0,
          trend: calculateTrend(metrics?.map(m => m.page_views || 0) || [])
        }
      } else {
        // For orders, we'll use inquiry_count as a proxy for now
        const { data: metrics } = await supabase
          .from('site_metrics')
          .select('metric_date, inquiry_count')
          .eq('site_id', siteId)
          .gte('metric_date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('metric_date', { ascending: true })
        
        return {
          data: metrics?.map(m => ({ metric_date: m.metric_date, orders: m.inquiry_count })) || [],
          total: metrics?.reduce((sum, item) => sum + (item.inquiry_count || 0), 0) || 0,
          trend: calculateTrend(metrics?.map(m => m.inquiry_count || 0) || [])
        }
      }
    },
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-[300px] md:h-[350px] flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (!data || data.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-[300px] md:h-[350px] flex items-center justify-center bg-muted/10 rounded-lg">
            <div className="text-center">
              <p className="text-muted-foreground">No data available yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                {type === 'views' 
                  ? 'Site views will be tracked as visitors browse your site'
                  : 'Order data will appear once you receive your first orders'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Simple bar chart visualization
  const maxValue = Math.max(...data.data.map(d => {
    if (type === 'views') {
      return ('page_views' in d) ? d.page_views || 0 : 0
    } else {
      return ('orders' in d) ? d.orders || 0 : 0
    }
  }))
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{data.total.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
              {data.trend > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{data.trend}%</span>
                </>
              ) : data.trend < 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{data.trend}%</span>
                </>
              ) : (
                <span>0%</span>
              )}
              <span className="text-muted-foreground">vs last period</span>
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] md:h-[350px] relative bg-muted/5 rounded-lg">
          {/* Grid lines for better visualization */}
          <div className="absolute inset-0 flex flex-col justify-between pb-8">
            {[0, 25, 50, 75, 100].map((percent) => (
              <div key={percent} className="border-t border-muted/10" />
            ))}
          </div>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-muted-foreground pr-2">
            {[100, 75, 50, 25, 0].map((percent) => (
              <span key={percent} className="text-right w-8">{Math.round(maxValue * percent / 100)}</span>
            ))}
          </div>
          
          <div className="absolute inset-0 flex items-end justify-around gap-1 pb-8 pl-10">
            {data.data.slice(-30).map((item, index) => {
              const value = type === 'views' 
                ? ('page_views' in item ? item.page_views || 0 : 0)
                : ('orders' in item ? item.orders || 0 : 0)
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0
              
              return (
                <div
                  key={index}
                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 transition-colors rounded-t relative group"
                  style={{ height: `${height}%`, minHeight: height > 0 ? '2px' : '0' }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {value.toLocaleString()}
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(item.metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-between text-xs text-muted-foreground px-2">
            <span>{data.data.length > 0 ? new Date(data.data[0].metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
            <span>{data.data.length > 0 ? new Date(data.data[data.data.length - 1].metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0
  
  const midPoint = Math.floor(values.length / 2)
  const firstHalf = values.slice(0, midPoint)
  const secondHalf = values.slice(midPoint)
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length || 0
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length || 0
  
  if (firstAvg === 0) return 0
  return Math.round(((secondAvg - firstAvg) / firstAvg) * 100)
}