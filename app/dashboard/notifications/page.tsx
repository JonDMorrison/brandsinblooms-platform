'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Skeleton } from '@/src/components/ui/skeleton'
import { RefreshCw, Download, CheckCheck, Archive, Trash2, Bell, BellOff } from 'lucide-react'
import { Input } from '@/src/components/ui/input'
import { 
  useNotifications,
  useNotificationStats,
  useUnreadNotifications 
} from '@/src/hooks/useNotifications'
import { 
  useBulkMarkAsRead,
  useBulkArchive,
  useBulkDelete,
  useMarkAllNotificationsAsRead
} from '@/src/hooks/useNotificationMutations'
import { 
  NotificationList,
  NotificationFilters as NotificationFiltersComponent,
  NotificationEmpty 
} from '@/src/components/notifications'
import { toast } from 'sonner'
import { NotificationFilters } from '@/lib/queries/domains/notifications'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import { exportNotifications } from '@/app/actions/notifications'

export default function NotificationsPage() {
  const [filters, setFilters] = useState<NotificationFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<string[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Data hooks
  const {
    data: notificationsData,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useNotifications(filters)

  const { data: stats, isLoading: statsLoading } = useNotificationStats()
  const { data: unreadNotifications } = useUnreadNotifications(5)

  // Mutation hooks
  const bulkMarkAsRead = useBulkMarkAsRead()
  const bulkArchive = useBulkArchive()
  const bulkDelete = useBulkDelete()
  const markAllAsRead = useMarkAllNotificationsAsRead()

  // Flatten paginated results
  const notifications = notificationsData?.pages.flatMap(page => page.notifications) || []
  const totalCount = notifications.length

  const handleFiltersChange = useCallback((newFilters: {
    search?: string
    category?: string
    priority?: string
    isRead?: boolean
    dateFrom?: string
    dateTo?: string
  }) => {
    // Transform the filters to match NotificationFilters type
    const transformedFilters: NotificationFilters = {
      ...newFilters,
      priority: newFilters.priority as 'low' | 'medium' | 'high' | 'urgent' | undefined
    }
    setFilters(transformedFilters)
    setSelectedNotificationIds([]) // Clear selection when filters change
  }, [])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    // You could implement search filtering here or pass it to the filters
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Notifications refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh notifications')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotificationIds(notifications.map(n => n.id))
    } else {
      setSelectedNotificationIds([])
    }
  }

  const handleSelectNotification = (notificationId: string, checked: boolean) => {
    if (checked) {
      setSelectedNotificationIds(prev => [...prev, notificationId])
    } else {
      setSelectedNotificationIds(prev => prev.filter(id => id !== notificationId))
    }
  }

  const handleBulkMarkAsRead = async () => {
    try {
      await bulkMarkAsRead.mutateAsync(selectedNotificationIds)
      setSelectedNotificationIds([])
    } catch (error) {
      // Error handled by the hook
    }
  }

  const handleBulkArchive = async () => {
    try {
      await bulkArchive.mutateAsync(selectedNotificationIds)
      setSelectedNotificationIds([])
    } catch (error) {
      // Error handled by the hook
    }
  }

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedNotificationIds.length} notifications? This action cannot be undone.`)) {
      try {
        await bulkDelete.mutateAsync(selectedNotificationIds)
        setSelectedNotificationIds([])
      } catch (error) {
        // Error handled by the hook
      }
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync()
      setSelectedNotificationIds([])
    } catch (error) {
      // Error handled by the hook
    }
  }

  const handleExportNotifications = async () => {
    try {
      const result = await exportNotifications(filters)
      const blob = new Blob([result.csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(`Exported ${result.count} notifications`)
    } catch (error) {
      toast.error('Failed to export notifications')
    }
  }

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  // Filter notifications by search query
  const filteredNotifications = useMemo(() => {
    if (!searchQuery) return notifications
    
    const query = searchQuery.toLowerCase()
    return notifications.filter(notification =>
      notification.title.toLowerCase().includes(query) ||
      notification.message.toLowerCase().includes(query) ||
      notification.category.toLowerCase().includes(query) ||
      notification.type.toLowerCase().includes(query)
    )
  }, [notifications, searchQuery])

  // Check if all visible notifications are selected
  const allSelected = filteredNotifications.length > 0 && 
    filteredNotifications.every(n => selectedNotificationIds.includes(n.id))
  const someSelected = selectedNotificationIds.length > 0

  // Show loading skeleton while initial data is loading
  if (isLoading && !notificationsData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-5 w-80 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>

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
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Manage your notifications and stay updated</p>
          </div>
        </div>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-8 text-center">
            <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">Failed to Load Notifications</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'An error occurred while loading notifications'}
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
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {totalCount > 0 ? `Manage your ${totalCount} notifications and stay updated` : 'Manage your notifications and stay updated'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleMarkAllAsRead} 
            disabled={markAllAsRead.isPending || (stats?.unread || 0) === 0}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Hidden for now - Stats Cards, Search and Filters */}

      {/* Bulk Actions Toolbar */}
      {someSelected && (
        <Card className="fade-in-up" style={{ animationDelay: '0.8s' }}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedNotificationIds.length} of {filteredNotifications.length} selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkMarkAsRead}
                  disabled={bulkMarkAsRead.isPending}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark Read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkArchive}
                  disabled={bulkArchive.isPending}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDelete.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card className="fade-in-up" style={{ animationDelay: '1s' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
            {!someSelected && filteredNotifications.length > 0 && (
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <NotificationEmpty 
              hasFilters={Object.keys(filters).some(key => filters[key as keyof NotificationFilters] !== undefined) || searchQuery.length > 0} 
              onClearFilters={() => {
                setFilters({})
                setSearchQuery('')
              }}
            />
          ) : (
            <div className="space-y-4">
              <NotificationList
                notifications={filteredNotifications}
                selectedIds={selectedNotificationIds}
                onSelectNotification={handleSelectNotification}
                showSelection={true}
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
                      'Load More Notifications'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}