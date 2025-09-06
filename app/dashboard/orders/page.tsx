'use client'

import { useState, useCallback, useMemo, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Skeleton } from '@/src/components/ui/skeleton'
import { RefreshCw, Download } from 'lucide-react'
import { useOrders } from '@/src/hooks/useOrders'
import { OrderFilters } from '@/src/components/orders/OrderFilters'
import { OptimizedTable } from '@/src/components/ui/optimized-table'
import { optimizedOrderColumns } from '@/src/components/orders/optimized-order-columns'
import { OrderStats } from '@/src/components/OrderStats'
import { BulkActionsToolbar } from '@/src/components/orders/BulkActionsToolbar'
import { OrderEmptyState } from '@/src/components/orders/OrderEmptyState'
import { exportOrdersToCSV, exportOrdersToJSON } from '@/src/lib/utils/export'
import { toast } from 'sonner'
import type { OrderWithCustomer } from '@/lib/queries/domains/orders'

interface OrderFilters {
  search?: string
  status?: string
  paymentStatus?: string
  dateFrom?: string
  dateTo?: string
}

// Memoized orders page component for better performance
const OrdersPageComponent = () => {
  const [filters, setFilters] = useState<OrderFilters>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<OrderWithCustomer[]>([])

  // Fetch orders with real data - memoized hook call
  const {
    data,
    loading: isLoading,
    error,
    hasMore: hasNextPage,
    loadingMore: isFetchingNextPage,
    loadMore: fetchNextPage,
    refresh: refetch,
  } = useOrders(useMemo(() => ({
    search: filters.search,
    status: filters.status as 'processing' | 'shipped' | 'delivered' | 'cancelled' | undefined,
    paymentStatus: filters.paymentStatus,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    enabled: true,
  }), [filters]))

  // Use data directly (already flattened) - memoized
  const orders = useMemo(() => data || [], [data])
  const totalCount = orders.length
  const isError = !!error

  const handleFiltersChange = useCallback((newFilters: OrderFilters) => {
    setFilters(newFilters)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Orders refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh orders')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      await exportOrdersToCSV(orders)
      toast.success('Orders exported to CSV successfully')
    } catch (error) {
      toast.error('Failed to export orders')
    }
  }

  const handleExportJSON = async () => {
    try {
      await exportOrdersToJSON(orders)
      toast.success('Orders exported to JSON successfully')
    } catch (error) {
      toast.error('Failed to export orders')
    }
  }

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  // Show loading skeleton while initial data is loading
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <OrderStats />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Orders</h1>
            <p className="text-gray-500">Manage your orders and track performance</p>
          </div>
        </div>
        <Card className="border-red-200 ">
          <CardContent className="p-8 text-center">
            <h3 className="font-medium text-red-600  mb-2">Failed to Load Orders</h3>
            <p className="text-sm text-gray-500 mb-4">
              {error instanceof Error ? error.message : 'An error occurred while loading orders'}
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 fade-in-up" style={{ animationDelay: '0s' }}>
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-gray-500">
            {totalCount > 0 ? `Manage your ${totalCount} orders and track performance` : 'Manage your orders and track performance'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={orders.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportJSON} disabled={orders.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Order Statistics */}
      <OrderStats className="fade-in-up" />

      {/* Filters */}
      <div className="fade-in-up" style={{ animationDelay: '0.4s' }}>
        <OrderFilters onFiltersChange={handleFiltersChange} />
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedOrders.length > 0 && (
        <div className="fade-in-up" style={{ animationDelay: '0.6s' }}>
          <BulkActionsToolbar
            selectedOrders={selectedOrders}
            onClearSelection={() => setRowSelection({})}
            onOrdersUpdated={() => {
              refetch()
              setRowSelection({})
            }}
          />
        </div>
      )}

      {/* Main Content */}
      <Card className="fade-in-up" style={{ animationDelay: '0.8s' }}>
        <CardHeader>
          <CardTitle>Orders ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <OptimizedTable
            data={orders}
            columns={optimizedOrderColumns}
            loading={isLoading && !data}
            searchable={true}
            sortable={true}
            selectable={true}
            pagination={true}
            pageSize={20}
            onRowSelect={setSelectedOrders}
            emptyState={
              <OrderEmptyState 
                hasFilters={Object.keys(filters).some(key => filters[key as keyof OrderFilters])} 
                onClearFilters={() => setFilters({})}
              />
            }
            loadingRows={8}
          />
          
          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Orders'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Export memoized component for performance
export default memo(OrdersPageComponent)