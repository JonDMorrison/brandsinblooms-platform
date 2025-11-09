'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { 
  Search, 
  Filter, 
  Calendar, 
  X,
  Bell,
  Package,
  ShoppingCart,
  CreditCard,
  User,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff
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
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group'
import { format } from 'date-fns'

interface NotificationFiltersProps {
  onFiltersChange?: (filters: {
    search?: string
    category?: string
    priority?: string
    isRead?: boolean
    dateFrom?: string
    dateTo?: string
  }) => void
}

interface FilterValues {
  search: string
  category: string
  priority: string
  readStatus: string // 'all' | 'read' | 'unread'
  dateFrom: Date | undefined
  dateTo: Date | undefined
}

const NOTIFICATION_CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: Bell },
  { value: 'order', label: 'Orders', icon: ShoppingCart },
  { value: 'product', label: 'Products', icon: Package },
  { value: 'payment', label: 'Payments', icon: CreditCard },
  { value: 'user', label: 'Users', icon: User },
  { value: 'system', label: 'System', icon: AlertTriangle },
  { value: 'alert', label: 'Alerts', icon: AlertTriangle },
]

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'high', label: 'High Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'low', label: 'Low Priority' },
]

const READ_STATUS_OPTIONS = [
  { value: 'all', label: 'All', icon: Bell },
  { value: 'unread', label: 'Unread', icon: EyeOff },
  { value: 'read', label: 'Read', icon: Eye },
]

export function NotificationFilters({ onFiltersChange }: NotificationFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<FilterValues>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'all',
    priority: searchParams.get('priority') || 'all',
    readStatus: searchParams.get('readStatus') || 'all',
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
        category: updatedFilters.category === 'all' ? undefined : updatedFilters.category || undefined,
        priority: updatedFilters.priority === 'all' ? undefined : updatedFilters.priority || undefined,
        isRead: updatedFilters.readStatus === 'all' ? undefined : updatedFilters.readStatus === 'read',
        dateFrom: updatedFilters.dateFrom?.toISOString().split('T')[0] || undefined,
        dateTo: updatedFilters.dateTo?.toISOString().split('T')[0] || undefined,
      })
    }
  }, [filters, router, pathname, searchParams, onFiltersChange])

  const handleSearchChange = (value: string) => {
    updateURLAndFilters({ search: value })
  }

  const handleCategoryChange = (value: string) => {
    updateURLAndFilters({ category: value })
  }

  const handlePriorityChange = (value: string) => {
    updateURLAndFilters({ priority: value })
  }

  const handleReadStatusChange = (value: string) => {
    updateURLAndFilters({ readStatus: value })
  }

  const handleDateRangeChange = (dateFrom?: Date, dateTo?: Date) => {
    updateURLAndFilters({ dateFrom, dateTo })
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      priority: 'all',
      readStatus: 'all',
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
    if (filters.category && filters.category !== 'all') count++
    if (filters.priority && filters.priority !== 'all') count++
    if (filters.readStatus && filters.readStatus !== 'all') count++
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search notifications..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {/* Category filter */}
              <Select value={filters.category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <Package className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_CATEGORIES.map((category) => {
                    const IconComponent = category.icon
                    return (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              {/* Priority filter */}
              <Select value={filters.priority} onValueChange={handlePriorityChange}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Read status toggle */}
              <ToggleGroup 
                type="single" 
                value={filters.readStatus} 
                onValueChange={(value) => value && handleReadStatusChange(value)}
                className="border rounded-md"
              >
                {READ_STATUS_OPTIONS.map((status) => {
                  const IconComponent = status.icon
                  return (
                    <ToggleGroupItem 
                      key={status.value} 
                      value={status.value}
                      className="h-10 px-3"
                      title={status.label}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">{status.label}</span>
                    </ToggleGroupItem>
                  )
                })}
              </ToggleGroup>

              {/* Date range picker */}
              <Popover open={showDatePopover} onOpenChange={setShowDatePopover}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`w-full sm:w-[140px] justify-start text-left font-normal ${
                      filters.dateFrom || filters.dateTo ? 'text-gray-900' : 'text-gray-500'
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
                <PopoverContent className="w-auto p-0 bg-white border shadow-md" align="end">
                  <div className="p-4 space-y-4 bg-white">
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
              <div className="flex items-center gap-1 text-sm text-gray-500">
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
                
                {filters.category && filters.category !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Category: {NOTIFICATION_CATEGORIES.find(c => c.value === filters.category)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleCategoryChange('all')}
                    />
                  </Badge>
                )}
                
                {filters.priority && filters.priority !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Priority: {PRIORITY_OPTIONS.find(p => p.value === filters.priority)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handlePriorityChange('all')}
                    />
                  </Badge>
                )}

                {filters.readStatus && filters.readStatus !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {READ_STATUS_OPTIONS.find(s => s.value === filters.readStatus)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleReadStatusChange('all')}
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
                className="ml-auto text-gray-500 hover:text-gray-900"
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