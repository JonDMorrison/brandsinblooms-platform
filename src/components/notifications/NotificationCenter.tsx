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
      case 'normal':
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
      
      <DropdownMenuContent align="end" className="w-[480px] max-w-[calc(100vw-2rem)] p-0">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Notifications</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                You have {unreadCount} unread notifications
              </p>
            </div>
            
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsRead.isPending}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href="/dashboard/notifications">
                  View all
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
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
            <div className="divide-y">
              {recentNotifications.map((notification) => {
                const isUnread = !notification.is_read
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer",
                      isUnread && "bg-blue-50/20 "
                    )}
                    onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon and priority */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="relative">
                          <span className="text-base">{getCategoryIcon(notification.category)}</span>
                          {(notification.priority === 'urgent' || notification.priority === 'high') && (
                            <div className={cn(
                              "absolute -top-1 -right-1 w-2 h-2 rounded-full",
                              notification.priority === 'urgent' ? 'bg-red-500' : 'bg-orange-500'
                            )} />
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={cn(
                              "text-sm",
                              isUnread ? "font-semibold" : "font-normal"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground capitalize">
                                {notification.category}
                              </span>
                            </div>
                          </div>
                          
                          {/* Unread indicator */}
                          {isUnread && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Wrapper component for easier integration
export function NotificationCenterWrapper(props: NotificationCenterProps) {
  return <NotificationCenter {...props} />
}