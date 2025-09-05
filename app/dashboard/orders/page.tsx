'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Skeleton } from '@/src/components/ui/skeleton'
import { RefreshCw, Download, Plus } from 'lucide-react'
import { useOrders } from '@/src/hooks/useOrders'
import { OrderFilters } from '@/src/components/orders/OrderFilters'
import { DataTable } from '@/src/components/ui/data-table'
import { orderColumns } from '@/src/components/orders/order-columns'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table'
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

export default function OrdersPage() {
  const [filters, setFilters] = useState<OrderFilters>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Table state for row selection
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  // Fetch orders with real data
  const {
    data,
    loading: isLoading,
    error: isError,
    hasMore: hasNextPage,
    loadingMore: isFetchingNextPage,
    loadMore: fetchNextPage,
    refresh: refetch,
  } = useOrders({
    search: filters.search,
    status: filters.status as 'processing' | 'shipped' | 'delivered' | 'cancelled' | undefined,
    paymentStatus: filters.paymentStatus,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    enabled: true,
  })

  // Use data directly (already flattened)
  const orders = data || []
  const totalCount = orders.length
  const error = isError

  // Create table instance
  const table = useReactTable({
    data: orders,
    columns: orderColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Get selected orders
  const selectedOrders = useMemo(() => {
    return table.getFilteredSelectedRowModel().rows.map(row => row.original)
  }, [table, rowSelection])

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
            <p className="text-muted-foreground">Manage your orders and track performance</p>
          </div>
        </div>
        <Card className="border-red-200 ">
          <CardContent className="p-8 text-center">
            <h3 className="font-medium text-red-600  mb-2">Failed to Load Orders</h3>
            <p className="text-sm text-muted-foreground mb-4">
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
          <p className="text-muted-foreground">
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
          {orders.length === 0 ? (
            <OrderEmptyState 
              hasFilters={Object.keys(filters).some(key => filters[key as keyof OrderFilters])} 
              onClearFilters={() => setFilters({})}
            />
          ) : (
            <>
              {/* Custom Data Table with Row Selection */}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={orderColumns.length}
                          className="h-24 text-center"
                        >
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Selection Info */}
              {selectedOrders.length > 0 && (
                <div className="flex items-center justify-between py-4">
                  <div className="text-sm text-muted-foreground">
                    {selectedOrders.length} of {orders.length} row(s) selected.
                  </div>
                </div>
              )}
              
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}