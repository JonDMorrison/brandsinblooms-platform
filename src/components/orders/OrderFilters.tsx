'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { 
  Search, 
  Filter, 
  Calendar, 
  X,
  ShoppingCart,
  CreditCard
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/src/components/ui/popover'
import { Calendar as CalendarComponent } from '@/src/components/ui/calendar'
import { Badge } from '@/src/components/ui/badge'
import { Card, CardContent } from '@/src/components/ui/card'
import { format } from 'date-fns'

interface OrderFiltersProps {
  onFiltersChange?: (filters: {
    search?: string
    status?: string
    paymentStatus?: string
    dateFrom?: string
    dateTo?: string
  }) => void
}

interface FilterValues {
  search: string
  status: string
  paymentStatus: string
  dateFrom: Date | undefined
  dateTo: Date | undefined
}

const ORDER_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PAYMENT_STATUSES = [
  { value: 'all', label: 'All Payment Status' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

export function OrderFilters({ onFiltersChange }: OrderFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<FilterValues>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    paymentStatus: searchParams.get('paymentStatus') || 'all',
    dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
    dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
  })

  const [showDatePopover, setShowDatePopover] = useState(false)

  const updateURLAndFilters = useCallback((newFilters: Partial<FilterValues>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)

    // Create URL params
    const params = new URLSearchParams(searchParams)
    
    // Update each filter parameter
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all') {
        if (key === 'dateFrom' || key === 'dateTo') {
          if (value instanceof Date) {
            params.set(key, value.toISOString().split('T')[0])
          }
        } else {
          params.set(key, value as string)
        }
      } else {
        params.delete(key)
      }
    })

    // Update URL
    router.push(`${pathname}?${params.toString()}`)

    // Call callback if provided
    if (onFiltersChange) {
      onFiltersChange({
        search: updatedFilters.search || undefined,
        status: updatedFilters.status === 'all' ? undefined : updatedFilters.status || undefined,
        paymentStatus: updatedFilters.paymentStatus === 'all' ? undefined : updatedFilters.paymentStatus || undefined,
        dateFrom: updatedFilters.dateFrom?.toISOString().split('T')[0] || undefined,
        dateTo: updatedFilters.dateTo?.toISOString().split('T')[0] || undefined,
      })
    }
  }, [filters, router, pathname, searchParams, onFiltersChange])

  const handleSearchChange = (value: string) => {
    updateURLAndFilters({ search: value })
  }

  const handleStatusChange = (value: string) => {
    updateURLAndFilters({ status: value })
  }

  const handlePaymentStatusChange = (value: string) => {
    updateURLAndFilters({ paymentStatus: value })
  }

  const handleDateRangeChange = (dateFrom?: Date, dateTo?: Date) => {
    updateURLAndFilters({ dateFrom, dateTo })
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      paymentStatus: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    })
    router.push(pathname)
    if (onFiltersChange) {
      onFiltersChange({})
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status && filters.status !== 'all') count++
    if (filters.paymentStatus && filters.paymentStatus !== 'all') count++
    if (filters.dateFrom || filters.dateTo) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Top row - Search and main filters */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by order number, customer name, or email..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filters.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.paymentStatus} onValueChange={handlePaymentStatusChange}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <CreditCard className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover open={showDatePopover} onOpenChange={setShowDatePopover}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`w-full sm:w-[140px] justify-start text-left font-normal ${
                      filters.dateFrom || filters.dateTo ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {filters.dateFrom || filters.dateTo ? (
                      <span className="truncate">
                        {filters.dateFrom && format(filters.dateFrom, 'MMM dd')}
                        {filters.dateFrom && filters.dateTo && ' - '}
                        {filters.dateTo && format(filters.dateTo, 'MMM dd')}
                      </span>
                    ) : (
                      'Date Range'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">From Date</label>
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => handleDateRangeChange(date, filters.dateTo)}
                        className="rounded-md border"
                      />
                    </div>
                    
                    {filters.dateFrom && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">To Date</label>
                        <CalendarComponent
                          mode="single"
                          selected={filters.dateTo}
                          onSelect={(date) => handleDateRangeChange(filters.dateFrom, date)}
                          disabled={{ before: filters.dateFrom }}
                          className="rounded-md border"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          handleDateRangeChange(undefined, undefined)
                          setShowDatePopover(false)
                        }}
                      >
                        Clear
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => setShowDatePopover(false)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active filters display */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Filter className="h-3 w-3" />
                Active filters:
              </div>
              
              <div className="flex flex-wrap gap-1">
                {filters.search && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {filters.search}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleSearchChange('')}
                    />
                  </Badge>
                )}
                
                {filters.status && filters.status !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {ORDER_STATUSES.find(s => s.value === filters.status)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleStatusChange('all')}
                    />
                  </Badge>
                )}
                
                {filters.paymentStatus && filters.paymentStatus !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Payment: {PAYMENT_STATUSES.find(s => s.value === filters.paymentStatus)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handlePaymentStatusChange('all')}
                    />
                  </Badge>
                )}
                
                {(filters.dateFrom || filters.dateTo) && (
                  <Badge variant="secondary" className="gap-1">
                    Date: {filters.dateFrom && format(filters.dateFrom, 'MMM dd')}
                    {filters.dateFrom && filters.dateTo && ' - '}
                    {filters.dateTo && format(filters.dateTo, 'MMM dd')}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleDateRangeChange(undefined, undefined)}
                    />
                  </Badge>
                )}
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}