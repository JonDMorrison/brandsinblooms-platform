'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'

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
  // Placeholder chart until recharts is properly loaded
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px] md:h-[350px] flex items-center justify-center bg-muted/10 rounded-lg">
          <p className="text-muted-foreground">Chart loading...</p>
        </div>
      </CardContent>
    </Card>
  )
}