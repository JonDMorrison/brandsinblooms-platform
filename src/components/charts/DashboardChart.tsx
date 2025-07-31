'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'

const data = [
  {
    name: 'Jan',
    views: 4000,
    orders: 2400,
    sales: 2400,
  },
  {
    name: 'Feb',
    views: 3000,
    orders: 1398,
    sales: 2210,
  },
  {
    name: 'Mar',
    views: 2000,
    orders: 9800,
    sales: 2290,
  },
  {
    name: 'Apr',
    views: 2780,
    orders: 3908,
    sales: 2000,
  },
  {
    name: 'May',
    views: 1890,
    orders: 4800,
    sales: 2181,
  },
  {
    name: 'Jun',
    views: 2390,
    orders: 3800,
    sales: 2500,
  },
  {
    name: 'Jul',
    views: 3490,
    orders: 4300,
    sales: 2100,
  },
]

interface DashboardChartProps {
  title: string
  description?: string
  type: 'area' | 'bar' | 'line'
  dataKey: string
  color?: string
}

export function DashboardChart({ 
  title, 
  description, 
  type, 
  dataKey, 
  color = "#8884d8" 
}: DashboardChartProps) {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: {
        top: 10,
        right: 30,
        left: 0,
        bottom: 0,
      },
    }

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              strokeWidth={2}
              stroke={color}
              fill={color}
              fillOpacity={0.2}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {label}
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].value}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
          </AreaChart>
        )
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Bar
              dataKey={dataKey}
              fill={color}
              radius={[4, 4, 0, 0]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {label}
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].value}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
          </BarChart>
        )
      case 'line':
        return (
          <LineChart {...commonProps}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              strokeWidth={2}
              stroke={color}
              dot={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {label}
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].value}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
          </LineChart>
        )
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300} className="md:h-[350px]">
          {renderChart() || <div>No chart available</div>}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}