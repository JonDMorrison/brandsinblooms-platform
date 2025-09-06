'use client'

import React, { memo } from 'react'
import { Skeleton } from './skeleton'
import { Card, CardContent, CardHeader } from './card'

interface StreamingLoaderProps {
  type: 'products' | 'orders' | 'stats' | 'table' | 'form'
  count?: number
  className?: string
}

const ProductsLoader = memo(({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <div className="aspect-square">
          <Skeleton className="h-full w-full" />
        </div>
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
))
ProductsLoader.displayName = 'ProductsLoader'

const OrdersTableLoader = memo(() => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="border rounded-lg">
        <div className="border-b p-4">
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-b last:border-0">
            <div className="grid grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
))
OrdersTableLoader.displayName = 'OrdersTableLoader'

const StatsLoader = memo(({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
))
StatsLoader.displayName = 'StatsLoader'

const TableLoader = memo(({ count = 8 }: { count?: number }) => (
  <div className="border rounded-lg">
    <div className="border-b p-4">
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
    </div>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-4 border-b last:border-0">
        <div className="grid grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, j) => (
            <Skeleton key={j} className="h-4" />
          ))}
        </div>
      </div>
    ))}
  </div>
))
TableLoader.displayName = 'TableLoader'

const FormLoader = memo(() => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-24 w-full" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
    <div className="flex justify-end gap-2">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
))
FormLoader.displayName = 'FormLoader'

export const StreamingLoader = memo(({ type, count, className = '' }: StreamingLoaderProps) => {
  const LoaderComponent = () => {
    switch (type) {
      case 'products':
        return <ProductsLoader count={count} />
      case 'orders':
        return <OrdersTableLoader />
      case 'stats':
        return <StatsLoader count={count} />
      case 'table':
        return <TableLoader count={count} />
      case 'form':
        return <FormLoader />
      default:
        return <Skeleton className="h-32 w-full" />
    }
  }

  return (
    <div className={`animate-pulse ${className}`}>
      <LoaderComponent />
    </div>
  )
})

StreamingLoader.displayName = 'StreamingLoader'

// Progressive loading component for better UX
export const ProgressiveLoader = memo(({ 
  children, 
  fallback, 
  delay = 200,
  className = '' 
}: {
  children: React.ReactNode
  fallback: React.ReactNode
  delay?: number
  className?: string
}) => {
  const [shouldRender, setShouldRender] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={className}>
      {shouldRender ? children : fallback}
    </div>
  )
})

ProgressiveLoader.displayName = 'ProgressiveLoader'