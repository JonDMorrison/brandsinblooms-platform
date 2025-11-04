'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'

interface SimpleChartProps {
  title: string
  description?: string
  type: 'area' | 'bar' | 'line'
  dataKey: string
  color?: string
}

/**
 * SimpleChart component - placeholder for future chart implementations
 * Note: This component is currently not used in the application
 * The useDashboardMetrics hook was removed as we're no longer tracking views/orders
 */
export function SimpleChart({
  title,
  description,
}: SimpleChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px] md:h-[350px] flex items-center justify-center bg-muted/10 rounded-lg">
          <p className="text-gray-500">Chart visualization coming soon</p>
        </div>
      </CardContent>
    </Card>
  )
}