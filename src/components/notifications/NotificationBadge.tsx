'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/src/lib/utils'

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
    <div
      className={cn(
        'h-5 min-w-[20px] flex items-center justify-center px-1.5 rounded-full',
        'absolute -top-2 -right-2 z-10',
        'transition-all duration-300 ease-out',
        'bg-red-500 text-white text-xs font-semibold',
        isAnimating && [
          'animate-pulse',
          'scale-110',
          'ring-2 ring-red-500/30',
        ],
        variant === 'secondary' && 'bg-gray-500',
        variant === 'outline' && 'bg-white text-gray-900 border border-gray-300',
        variant === 'default' && 'bg-gray-900 text-white  ',
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
    </div>
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