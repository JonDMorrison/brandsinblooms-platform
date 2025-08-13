'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Check, CheckCheck, ExternalLink, MoreHorizontal } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { Skeleton } from '@/src/components/ui/skeleton'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { useUnreadNotificationCount } from '@/src/hooks/useUnreadNotificationCount'
import { useRecentNotifications } from '@/src/hooks/useNotifications'
import {
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead
} from '@/src/hooks/useNotificationMutations'
import { NotificationBadge } from './NotificationBadge'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/src/lib/utils'

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Data hooks
  const { data: unreadCount = 0, isLoading: countLoading } = useUnreadNotificationCount()
  const { data: recentNotifications = [], isLoading: notificationsLoading } = useRecentNotifications(8)
  
  // Mutation hooks
  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      try {
        await markAsRead.mutateAsync(notificationId)
      } catch (error) {
        // Error is handled by the hook with toast
      }
    }
    setIsOpen(false)
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync()
    } catch (error) {
      // Error is handled by the hook with toast
    }
  }

  const handleViewAll = () => {
    setIsOpen(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-blue-500'
      case 'low':
        return 'bg-gray-500'
      default:
        return 'bg-blue-500'
    }
  }

  const getCategoryIcon = (category: string) => {
    // You can extend this with specific icons for each category
    switch (category) {
      case 'orders':
        return '📦'
      case 'messages':
        return '💬'
      case 'payments':
        return '💳'
      case 'system':
        return '⚙️'
      case 'content':
        return '📝'
      case 'products':
        return '🛍️'
      default:
        return '🔔'
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("relative", className)}
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <NotificationBadge 
              count={unreadCount}
              className="absolute -top-2 -right-2"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <DropdownMenuLabel className="p-0 font-semibold">
            Notifications
            {!countLoading && unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </DropdownMenuLabel>
          
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
              className="h-6 px-2 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-96">
          {notificationsLoading ? (
            // Loading skeletons
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 rounded-md">
                  <Skeleton className="w-2 h-2 rounded-full mt-2" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentNotifications.length === 0 ? (
            // Empty state
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">🔔</div>
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            // Notifications
            <div className="space-y-1 p-2">
              {recentNotifications.map((notification) => {
                const isUnread = !notification.is_read
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start space-x-3 p-3 rounded-md transition-colors cursor-pointer",
                      isUnread ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-950" : "hover:bg-muted",
                    )}
                    onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                  >
                    {/* Priority indicator */}
                    <div className="mt-2">
                      <div 
                        className={cn(
                          "w-2 h-2 rounded-full",
                          getPriorityColor(notification.priority)
                        )} 
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Category emoji and title */}
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-xs">{getCategoryIcon(notification.category)}</span>
                            <p className={cn(
                              "text-sm truncate",
                              isUnread ? "font-medium" : "font-normal"
                            )}>
                              {notification.title}
                            </p>
                          </div>
                          
                          {/* Message */}
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                            {notification.message}
                          </p>
                          
                          {/* Time and category */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {notification.category}
                            </Badge>
                          </div>
                        </div>

                        {/* Action button */}
                        {notification.action_url && (
                          <div className="ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link href={notification.action_url}>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DropdownMenuSeparator />
        <div className="p-2">
          <DropdownMenuItem asChild>
            <Link 
              href="/dashboard/notifications" 
              className="w-full justify-center text-center"
              onClick={handleViewAll}
            >
              View all notifications
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Wrapper component for easier integration
export function NotificationCenterWrapper(props: NotificationCenterProps) {
  return <NotificationCenter {...props} />
}