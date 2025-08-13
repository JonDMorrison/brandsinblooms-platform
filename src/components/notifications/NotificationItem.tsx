'use client'

import { formatDistanceToNow } from 'date-fns'
import { 
  Bell, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Tables } from '@/src/lib/database/types'

type Notification = Tables<'notifications'>

interface NotificationItemProps {
  notification: Notification
  onClick?: (notification: Notification) => void
  onMarkAsRead?: (notificationId: string) => void
  showSelection?: boolean
  selected?: boolean
  onSelect?: (notificationId: string, checked: boolean) => void
  className?: string
}

// Icon mapping based on notification category
const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'order':
      return ShoppingCart
    case 'product':
      return Package
    case 'payment':
      return CreditCard
    case 'user':
      return User
    case 'system':
      return Info
    case 'alert':
      return AlertTriangle
    case 'success':
      return CheckCircle
    default:
      return Bell
  }
}

// Priority color mapping
const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'text-red-500'
    case 'medium':
      return 'text-yellow-500'
    case 'low':
      return 'text-blue-500'
    default:
      return 'text-gray-500'
  }
}

// Category color mapping for icons
const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'order':
      return 'text-green-600'
    case 'product':
      return 'text-blue-600'
    case 'payment':
      return 'text-purple-600'
    case 'user':
      return 'text-orange-600'
    case 'system':
      return 'text-gray-600'
    case 'alert':
      return 'text-red-600'
    case 'success':
      return 'text-green-600'
    default:
      return 'text-gray-600'
  }
}

export function NotificationItem({ 
  notification, 
  onClick, 
  onMarkAsRead,
  showSelection = false,
  selected = false,
  onSelect,
  className 
}: NotificationItemProps) {
  const IconComponent = getCategoryIcon(notification.category)
  const isUnread = !notification.is_read
  const formattedTime = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })

  const handleClick = () => {
    // Don't trigger click when selection is enabled
    if (showSelection) return
    
    if (onClick) {
      onClick(notification)
    }
    
    // Auto-mark as read when clicked
    if (isUnread && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }

    // Navigate to action URL if provided
    if (notification.action_url) {
      window.open(notification.action_url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleSelectChange = (checked: boolean) => {
    if (onSelect) {
      onSelect(notification.id, checked)
    }
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <div 
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200',
        showSelection ? 'cursor-default' : 'cursor-pointer',
        'hover:bg-muted/50 hover:border-border/60',
        isUnread ? 'bg-primary/5 border-primary/20' : 'bg-background border-border/40',
        selected && 'ring-2 ring-primary/20',
        className
      )}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      {showSelection && (
        <div className="flex-shrink-0 mt-0.5">
          <Checkbox
            checked={selected}
            onCheckedChange={handleSelectChange}
          />
        </div>
      )}

      {/* Icon and read indicator */}
      <div className="relative flex-shrink-0 mt-0.5">
        <div className={cn(
          'p-2 rounded-full',
          isUnread ? 'bg-primary/10' : 'bg-muted'
        )}>
          <IconComponent 
            className={cn(
              'h-4 w-4',
              getCategoryColor(notification.category)
            )} 
          />
        </div>
        
        {/* Unread indicator */}
        {isUnread && (
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={cn(
                'text-sm font-medium leading-tight',
                isUnread ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {notification.title}
              </h4>
              
              {/* Priority badge */}
              {notification.priority && notification.priority !== 'low' && (
                <Badge 
                  variant={notification.priority === 'high' ? 'destructive' : 'secondary'}
                  className="h-5 px-1.5 text-xs"
                >
                  {notification.priority}
                </Badge>
              )}
            </div>
            
            <p className={cn(
              'text-sm leading-relaxed mb-2',
              isUnread ? 'text-muted-foreground' : 'text-muted-foreground/80'
            )}>
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formattedTime}
              </span>
              
              {/* Action link indicator */}
              {notification.action_url && (
                <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="h-3 w-3" />
                  <span>View</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Mark as read button - only show for unread notifications */}
          {isUnread && onMarkAsRead && (
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              onClick={handleMarkAsRead}
              title="Mark as read"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}