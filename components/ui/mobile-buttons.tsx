"use client"

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import React from 'react'

interface MobileButtonProps extends React.ComponentProps<typeof Button> {
  mobile?: 'full' | 'expanded' | 'touch'
  icon?: React.ReactNode
  label?: string
}

export function MobileButton({ 
  mobile, 
  icon, 
  label, 
  children, 
  className, 
  ...props 
}: MobileButtonProps) {
  const mobileClasses = {
    full: 'w-full sm:w-auto',
    expanded: 'px-6 py-3 min-h-[44px]', // 44px is iOS recommended touch target
    touch: 'min-h-[44px] min-w-[44px]'
  }

  return (
    <Button
      className={cn(
        mobile && mobileClasses[mobile],
        'touch-manipulation', // Improve touch responsiveness
        className
      )}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label || children}
    </Button>
  )
}

interface FloatingActionButtonProps {
  onClick: () => void
  icon: React.ReactNode
  label?: string
  className?: string
}

export function FloatingActionButton({ 
  onClick, 
  icon, 
  label, 
  className 
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg',
        'hover:shadow-xl transition-shadow',
        'sm:hidden', // Only show on mobile
        className
      )}
      size="icon"
    >
      {icon}
      {label && <span className="sr-only">{label}</span>}
    </Button>
  )
}

interface ButtonGroupProps {
  children: React.ReactNode
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function MobileButtonGroup({ 
  children, 
  orientation = 'horizontal', 
  className 
}: ButtonGroupProps) {
  return (
    <div className={cn(
      'flex gap-2',
      orientation === 'vertical' ? 'flex-col sm:flex-row' : 'flex-col sm:flex-row',
      className
    )}>
      {children}
    </div>
  )
}