'use client'

import React from 'react'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Card } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Loader2, Save, CheckCircle } from 'lucide-react'
import { cn } from '@/src/lib/utils'

// Base loading spinner component
export function LoadingSpinner({ 
  size = 'default', 
  className = '' 
}: { 
  size?: 'sm' | 'default' | 'lg'
  className?: string 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <Loader2 
      className={cn('animate-spin', sizeClasses[size], className)} 
    />
  )
}

// Save status indicator with animation
export function SaveStatusIndicator({ 
  status, 
  className = '' 
}: { 
  status: 'idle' | 'saving' | 'saved' | 'error'
  className?: string 
}) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <LoadingSpinner size="sm" />,
          text: 'Saving...',
          className: 'text-blue-600 border-blue-600'
        }
      case 'saved':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Saved',
          className: 'text-green-600 border-green-600'
        }
      case 'error':
        return {
          icon: <Save className="h-3 w-3" />,
          text: 'Failed',
          className: 'text-red-600 border-red-600'
        }
      default:
        return null
    }
  }

  const statusDisplay = getStatusDisplay()
  if (!statusDisplay) return null

  return (
    <Badge 
      variant="outline" 
      className={cn('h-6 px-2', statusDisplay.className, className)}
    >
      {statusDisplay.icon}
      <span className="ml-1.5 text-xs">{statusDisplay.text}</span>
    </Badge>
  )
}

// Content editor skeleton with proper structure
export function ContentEditorSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <Skeleton className="h-4 w-28 mb-1" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <SectionEditorSkeleton key={i} variant={i % 3 === 0 ? 'rich' : i % 3 === 1 ? 'simple' : 'media'} />
        ))}
        
        {/* Add section skeleton */}
        <div className="border-2 border-dashed border-muted rounded-lg p-4">
          <div className="text-center space-y-3">
            <Skeleton className="h-5 w-5 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
            <div className="flex flex-wrap gap-2 justify-center">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-20" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Section editor skeleton with different variants
export function SectionEditorSkeleton({ 
  variant = 'simple',
  className = '' 
}: { 
  variant?: 'simple' | 'rich' | 'media'
  className?: string 
}) {
  return (
    <Card className={cn('border rounded-lg bg-card', className)}>
      {/* Section header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-7" />
        </div>
      </div>

      {/* Section content based on variant */}
      <div className="p-3">
        {variant === 'rich' && (
          <div className="space-y-3">
            <div className="border rounded-md">
              <div className="border-b p-2">
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        )}
        
        {variant === 'simple' && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}
        
        {variant === 'media' && (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// Rich text editor skeleton
export function RichTextEditorSkeleton({ 
  showToolbar = true,
  className = '' 
}: { 
  showToolbar?: boolean
  className?: string 
}) {
  return (
    <div className={cn('border border-border rounded-md', className)}>
      {showToolbar && (
        <div className="border-b border-border p-2 space-y-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-7" />
            ))}
            <div className="mx-2 h-6 w-px bg-border" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i + 8} className="h-7 w-7" />
            ))}
          </div>
        </div>
      )}
      <div className="p-4 space-y-2 min-h-[200px]">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="py-4">
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-1" />
          <Skeleton className="h-4 w-4/5 mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

// Icon picker skeleton
export function IconPickerSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-20" />
      <div className="border rounded-md p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      </div>
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

// Preview skeleton for different content types
export function PreviewSkeleton({ 
  type = 'general',
  className = '' 
}: { 
  type?: 'general' | 'hero' | 'features' | 'gallery' | 'team'
  className?: string 
}) {
  const getSkeletonByType = () => {
    switch (type) {
      case 'hero':
        return (
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-2/3 mx-auto" />
            <div className="flex justify-center gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        )
      
      case 'features':
        return (
          <div className="space-y-6">
            <Skeleton className="h-8 w-1/2 mx-auto" />
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="text-center space-y-3">
                  <Skeleton className="h-12 w-12 mx-auto rounded-full" />
                  <Skeleton className="h-5 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        )
      
      case 'gallery':
        return (
          <div className="space-y-6">
            <Skeleton className="h-8 w-1/3 mx-auto" />
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        )
      
      case 'team':
        return (
          <div className="space-y-6">
            <Skeleton className="h-8 w-1/3 mx-auto" />
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6 text-center">
                  <Skeleton className="h-24 w-24 mx-auto rounded-full mb-4" />
                  <Skeleton className="h-5 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-4 w-1/2 mx-auto mb-3" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-5/6 mx-auto" />
                </Card>
              ))}
            </div>
          </div>
        )
      
      default:
        return (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        )
    }
  }

  return (
    <div className={cn('animate-pulse', className)}>
      {getSkeletonByType()}
    </div>
  )
}

// Loading overlay for full-screen loading states
export function LoadingOverlay({ 
  message = 'Loading...',
  isVisible = true,
  className = '' 
}: { 
  message?: string
  isVisible?: boolean
  className?: string 
}) {
  if (!isVisible) return null

  return (
    <div className={cn(
      'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center',
      className
    )}>
      <div className="bg-card p-6 rounded-lg shadow-lg border text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

// Shimmer effect for content updates
export function ShimmerOverlay({ 
  isVisible = false,
  className = '' 
}: { 
  isVisible?: boolean
  className?: string 
}) {
  if (!isVisible) return null

  return (
    <div className={cn(
      'absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent',
      'animate-shimmer pointer-events-none',
      className
    )} />
  )
}

export default {
  LoadingSpinner,
  SaveStatusIndicator,
  ContentEditorSkeleton,
  SectionEditorSkeleton,
  RichTextEditorSkeleton,
  IconPickerSkeleton,
  PreviewSkeleton,
  LoadingOverlay,
  ShimmerOverlay
}