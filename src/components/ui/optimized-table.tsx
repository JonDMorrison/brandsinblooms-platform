'use client'

import React, { memo, useCallback, useMemo } from 'react'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { Input } from './input'
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'

export interface ColumnDef<T> {
  id: string
  header: string | React.ReactNode
  accessorKey?: keyof T
  cell?: (item: T, index: number) => React.ReactNode
  sortable?: boolean
  searchable?: boolean
  width?: string | number
}

export interface OptimizedTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  searchable?: boolean
  sortable?: boolean
  selectable?: boolean
  pagination?: boolean
  pageSize?: number
  className?: string
  onRowSelect?: (selectedRows: T[]) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  emptyState?: React.ReactNode
  loadingRows?: number
}

interface SortConfig {
  column: string
  direction: 'asc' | 'desc'
}

function OptimizedTableComponent<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = false,
  sortable = false,
  selectable = false,
  pagination = false,
  pageSize = 10,
  className = '',
  onRowSelect,
  onSort,
  emptyState,
  loadingRows = 5
}: OptimizedTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortConfig, setSortConfig] = React.useState<SortConfig | null>(null)
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = React.useState(1)

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = data

    // Apply search filter
    if (searchable && searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      filtered = data.filter(item => {
        return columns.some(col => {
          if (!col.searchable) return false
          const value = col.accessorKey ? item[col.accessorKey] : ''
          return String(value).toLowerCase().includes(searchLower)
        })
      })
    }

    // Apply sorting
    if (sortable && sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.column]
        const bVal = b[sortConfig.column]
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [data, columns, searchQuery, sortConfig, searchable, sortable])

  // Memoized pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData
    
    const startIndex = (currentPage - 1) * pageSize
    return processedData.slice(startIndex, startIndex + pageSize)
  }, [processedData, pagination, currentPage, pageSize])

  const totalPages = Math.ceil(processedData.length / pageSize)

  // Handle sorting
  const handleSort = useCallback((column: string) => {
    if (!sortable) return

    const newDirection = sortConfig?.column === column && sortConfig?.direction === 'asc' ? 'desc' : 'asc'
    const newConfig = { column, direction: newDirection }
    
    setSortConfig(newConfig)
    onSort?.(column, newDirection)
  }, [sortConfig, onSort, sortable])

  // Handle row selection
  const handleRowSelect = useCallback((index: number, checked: boolean) => {
    if (!selectable) return

    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(index)
    } else {
      newSelected.delete(index)
    }
    
    setSelectedRows(newSelected)
    
    const selectedData = Array.from(newSelected).map(idx => processedData[idx])
    onRowSelect?.(selectedData)
  }, [selectedRows, processedData, onRowSelect, selectable])

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean) => {
    if (!selectable) return

    const newSelected = checked 
      ? new Set(processedData.map((_, idx) => idx))
      : new Set<number>()
    
    setSelectedRows(newSelected)
    
    const selectedData = checked ? processedData : []
    onRowSelect?.(selectedData)
  }, [processedData, onRowSelect, selectable])

  const isAllSelected = selectedRows.size === processedData.length && processedData.length > 0
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < processedData.length

  // Loading skeleton
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {searchable && (
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <div className="h-10 bg-gray-200 rounded animate-pulse flex-1" />
          </div>
        )}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && <TableHead className="w-12" />}
                {columns.map((col) => (
                  <TableHead key={col.id}>
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: loadingRows }).map((_, index) => (
                <TableRow key={index}>
                  {selectable && <TableCell><div className="w-4 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>}
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      {searchable && (
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      {/* Selection info */}
      {selectable && selectedRows.size > 0 && (
        <div className="text-sm text-gray-600">
          {selectedRows.size} of {processedData.length} rows selected
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate ? "true" : undefined}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead 
                  key={col.id} 
                  className={sortable && col.sortable ? 'cursor-pointer hover:bg-gray-50' : ''}
                  onClick={() => col.sortable && handleSort(col.accessorKey as string)}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center space-x-2">
                    <span>{col.header}</span>
                    {sortable && col.sortable && (
                      <div className="flex flex-col">
                        {sortConfig && sortConfig.column === col.accessorKey ? (
                          sortConfig?.direction === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <div className="h-3 w-3" />
                        )}
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="h-32 text-center">
                  {emptyState || <div className="text-gray-500">No data available</div>}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => {
                const actualIndex = pagination ? (currentPage - 1) * pageSize + index : index
                return (
                  <TableRow key={actualIndex}>
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(actualIndex)}
                          onCheckedChange={(checked) => handleRowSelect(actualIndex, checked as boolean)}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.id} style={{ width: col.width }}>
                        {col.cell ? col.cell(item, actualIndex) : String(col.accessorKey ? item[col.accessorKey] : '')}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Export memoized component for performance
export const OptimizedTable = memo(OptimizedTableComponent) as <T extends Record<string, any>>(
  props: OptimizedTableProps<T>
) => React.ReactElement