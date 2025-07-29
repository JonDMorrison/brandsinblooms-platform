import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

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

const mockMetrics: MetricItem[] = [
  {
    id: '1',
    name: 'Site Performance',
    value: 87,
    maxValue: 100,
    change: { value: 5, type: 'increase', period: 'vs last week' },
    status: 'good'
  },
  {
    id: '2',
    name: 'Page Load Speed',
    value: 92,
    maxValue: 100,
    change: { value: 3, type: 'increase', period: 'vs last week' },
    status: 'excellent'
  },
  {
    id: '3',
    name: 'SEO Score',
    value: 78,
    maxValue: 100,
    change: { value: 2, type: 'decrease', period: 'vs last week' },
    status: 'good'
  },
  {
    id: '4',
    name: 'Mobile Optimization',
    value: 85,
    maxValue: 100,
    change: { value: 0, type: 'neutral', period: 'vs last week' },
    status: 'good'
  },
  {
    id: '5',
    name: 'Security Score',
    value: 95,
    maxValue: 100,
    change: { value: 1, type: 'increase', period: 'vs last week' },
    status: 'excellent'
  },
  {
    id: '6',
    name: 'Accessibility',
    value: 72,
    maxValue: 100,
    change: { value: 8, type: 'increase', period: 'vs last week' },
    status: 'average'
  }
]


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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {mockMetrics.map((metric) => (
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
                    {metric.change.value > 0 && metric.change.type !== 'neutral' && (
                      metric.change.type === 'increase' ? '+' : '-'
                    )}
                    {metric.change.value > 0 && metric.change.value}
                    {metric.change.value > 0 && metric.change.type !== 'neutral' && '%'}
                    {metric.change.value === 0 && 'No change'}
                  </span>
                  <span>{metric.change.period}</span>
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