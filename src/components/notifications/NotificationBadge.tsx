'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/src/lib/utils'
import { Badge } from '@/src/components/ui/badge'

interface NotificationBadgeProps {
  count: number
  className?: string
  maxCount?: number
  animate?: boolean
  variant?: 'default' | 'destructive' | 'secondary' | 'outline'
}

export function NotificationBadge({ 
  count, 
  className,
  maxCount = 99,
  animate = true,
  variant = 'destructive'
}: NotificationBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [prevCount, setPrevCount] = useState(count)

  // Animate when count increases
  useEffect(() => {
    if (animate && count > prevCount && count > 0) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
    setPrevCount(count)
  }, [count, prevCount, animate])

  // Don't render if count is 0
  if (count <= 0) {
    return null
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString()

  return (
    <Badge
      variant={variant}
      className={cn(
        'h-5 min-w-[20px] flex items-center justify-center p-0 text-xs font-medium',
        'absolute -top-2 -right-2 z-10',
        'transition-all duration-300 ease-out',
        isAnimating && [
          'animate-pulse',
          'scale-110',
          'ring-2 ring-destructive/30',
        ],
        className
      )}
    >
      <span 
        className={cn(
          'transition-all duration-200',
          isAnimating && 'scale-110'
        )}
      >
        {displayCount}
      </span>
    </Badge>
  )
}

// Wrapper component that can be used around other elements
interface NotificationBadgeWrapperProps {
  count: number
  children: React.ReactNode
  className?: string
  badgeClassName?: string
  maxCount?: number
  animate?: boolean
  variant?: 'default' | 'destructive' | 'secondary' | 'outline'
}

export function NotificationBadgeWrapper({
  count,
  children,
  className,
  badgeClassName,
  maxCount = 99,
  animate = true,
  variant = 'destructive'
}: NotificationBadgeWrapperProps) {
  return (
    <div className={cn('relative inline-flex', className)}>
      {children}
      <NotificationBadge
        count={count}
        className={badgeClassName}
        maxCount={maxCount}
        animate={animate}
        variant={variant}
      />
    </div>
  )
}