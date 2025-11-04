'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Skeleton } from '@/src/components/ui/skeleton'
import { TrendingUp } from 'lucide-react'

export interface DashboardStat {
  id: string
  title: string
  count: number
  trend?: string // Optional trend text
  icon: React.ReactNode
  color: string
  showTrendIcon?: boolean // Optional flag to show/hide the trending icon
}

interface DashboardStatsProps {
  stats: DashboardStat[]
  isLoading: boolean
  className?: string
  animationDelay?: number
}

export function DashboardStats({ 
  stats, 
  isLoading, 
  className = '', 
  animationDelay = 0.2 
}: DashboardStatsProps) {
  return (
    <div className={`grid gap-4 grid-cols-2 lg:grid-cols-4 ${className}`}>
      {isLoading ? (
        // Loading skeletons
        Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-6 w-6 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[80px]" />
            </CardContent>
          </Card>
        ))
      ) : (
        stats.map((stat, index) => (
          <Card 
            key={stat.id} 
            className="fade-in-up" 
            style={{ animationDelay: `${animationDelay + index * 0.1}s` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count.toLocaleString()}</div>
              {stat.trend && (
                <div className="flex items-center text-xs text-gray-500">
                  {stat.showTrendIcon !== false && (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  )}
                  {stat.trend}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}