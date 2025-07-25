import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const orderTrendsData = [
  { month: 'Jan', orders: 65, revenue: 1200 },
  { month: 'Feb', orders: 59, revenue: 1100 },
  { month: 'Mar', orders: 80, revenue: 1500 },
  { month: 'Apr', orders: 81, revenue: 1620 },
  { month: 'May', orders: 56, revenue: 1050 },
  { month: 'Jun', orders: 55, revenue: 1300 },
  { month: 'Jul', orders: 78, revenue: 1450 },
  { month: 'Aug', orders: 88, revenue: 1680 },
  { month: 'Sep', orders: 85, revenue: 1590 },
  { month: 'Oct', orders: 90, revenue: 1750 },
  { month: 'Nov', orders: 95, revenue: 1820 },
  { month: 'Dec', orders: 110, revenue: 2100 },
]

export function OrderTrendsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Trends</CardTitle>
        <CardDescription>Monthly order volume and revenue trends</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={orderTrendsData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {label}
                          </span>
                        </div>
                        {payload.map((entry, index) => (
                          <div key={index} className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {entry.dataKey === 'orders' ? 'Orders' : 'Revenue'}
                            </span>
                            <span className="font-bold" style={{ color: entry.color }}>
                              {entry.dataKey === 'revenue' ? `$${entry.value}` : entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="orders"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}