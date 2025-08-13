'use client'

import { useMemo, useRef, useCallback } from 'react'
import { format, isToday, isYesterday, isThisWeek, isThisYear, startOfDay } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { Tables } from '@/src/lib/database/types'
import { NotificationItem } from './NotificationItem'
import { NotificationEmpty } from './NotificationEmpty'

type Notification = Tables<'notifications'>

interface NotificationListProps {
  notifications: Notification[]
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onNotificationClick?: (notification: Notification) => void
  onMarkAsRead?: (notificationId: string) => void
  emptyFilters?: {
    hasFilters: boolean
    onClearFilters?: () => void
  }
  showSelection?: boolean
  selectedIds?: string[]
  onSelectNotification?: (notificationId: string, checked: boolean) => void
  className?: string
}

interface GroupedNotifications {
  [key: string]: Notification[]
}

// Helper function to get date group label
const getDateGroupLabel = (date: Date): string => {
  if (isToday(date)) {
    return 'Today'
  }
  
  if (isYesterday(date)) {
    return 'Yesterday'
  }
  
  if (isThisWeek(date)) {
    return format(date, 'EEEE') // Day of week (e.g., "Monday")
  }
  
  if (isThisYear(date)) {
    return format(date, 'MMMM d') // Month and day (e.g., "January 15")
  }
  
  return format(date, 'MMMM d, yyyy') // Full date (e.g., "January 15, 2023")
}

// Helper function to get sort key for date groups
const getDateSortKey = (date: Date): string => {
  return format(date, 'yyyy-MM-dd')
}

export function NotificationList({
  notifications,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onNotificationClick,
  onMarkAsRead,
  emptyFilters,
  showSelection = false,
  selectedIds = [],
  onSelectNotification,
  className
}: NotificationListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: GroupedNotifications = {}
    
    notifications.forEach((notification) => {
      const date = startOfDay(new Date(notification.created_at))
      const sortKey = getDateSortKey(date)
      
      if (!groups[sortKey]) {
        groups[sortKey] = []
      }
      groups[sortKey].push(notification)
    })
    
    // Sort each group by creation time (newest first)
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    })
    
    return groups
  }, [notifications])

  // Get sorted group keys (newest dates first)
  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedNotifications).sort((a, b) => b.localeCompare(a))
  }, [groupedNotifications])

  // Intersection observer for infinite scroll
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return
    
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && onLoadMore) {
        onLoadMore()
      }
    })
    
    if (node) {
      observerRef.current.observe(node)
    }
  }, [isLoading, hasMore, onLoadMore])

  // Show empty state if no notifications
  if (!isLoading && notifications.length === 0) {
    return (
      <NotificationEmpty
        hasFilters={emptyFilters?.hasFilters ?? false}
        onClearFilters={emptyFilters?.onClearFilters}
      />
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {sortedGroupKeys.map((dateKey, groupIndex) => {
        const groupNotifications = groupedNotifications[dateKey]
        const date = new Date(dateKey)
        const dateLabel = getDateGroupLabel(date)
        const isLastGroup = groupIndex === sortedGroupKeys.length - 1

        return (
          <div key={dateKey} className="space-y-3">
            {/* Date group header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/40 pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {dateLabel}
              </h3>
            </div>

            {/* Notifications in this group */}
            <div className="space-y-2">
              {groupNotifications.map((notification, index) => {
                const isLastInGroup = index === groupNotifications.length - 1
                const isLastNotification = isLastGroup && isLastInGroup

                return (
                  <div
                    key={notification.id}
                    ref={isLastNotification ? lastElementRef : undefined}
                  >
                    <NotificationItem
                      notification={notification}
                      onClick={onNotificationClick}
                      onMarkAsRead={onMarkAsRead}
                      showSelection={showSelection}
                      selected={selectedIds.includes(notification.id)}
                      onSelect={onSelectNotification}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading notifications...</span>
          </div>
        </div>
      )}

      {/* Load more trigger element */}
      {hasMore && !isLoading && (
        <div ref={loadMoreRef} className="h-10" />
      )}

      {/* End of list indicator */}
      {!hasMore && notifications.length > 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            You've reached the end of your notifications
          </p>
        </div>
      )}
    </div>
  )
}