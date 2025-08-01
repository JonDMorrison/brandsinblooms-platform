'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { useDashboardMetrics } from '@/src/hooks/useStats'
import { Skeleton } from '@/src/components/ui/skeleton'

interface SimpleChartProps {
  title: string
  description?: string
  type: 'area' | 'bar' | 'line'
  dataKey: string
  color?: string
}

export function SimpleChart({ 
  title, 
  description, 
  type, 
  dataKey, 
  color = "#8884d8" 
}: SimpleChartProps) {
  const { data: metrics, isLoading } = useDashboardMetrics()
  
  // Show loading state
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
  
  // Check if we have data to display
  const hasData = metrics && (
    (dataKey === 'views' && metrics.totalViews && metrics.totalViews > 0) ||
    (dataKey === 'orders' && metrics.totalOrders && metrics.totalOrders > 0)
  )
  
  // Show no data message
  if (!hasData) {
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
                {dataKey === 'views' 
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
  
  // Placeholder chart until recharts is properly loaded
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px] md:h-[350px] flex items-center justify-center bg-muted/10 rounded-lg">
          <p className="text-muted-foreground">Chart visualization coming soon</p>
        </div>
      </CardContent>
    </Card>
  )
}