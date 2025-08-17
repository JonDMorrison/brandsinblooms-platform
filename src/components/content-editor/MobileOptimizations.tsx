'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/src/components/ui/sheet'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Separator } from '@/src/components/ui/separator'
import { Badge } from '@/src/components/ui/badge'
import { 
  Menu, 
  X, 
  Eye, 
  Edit3, 
  Smartphone,
  Tablet,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react'
import { cn } from '@/src/lib/utils'

// Hook for detecting screen size and orientation
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState<{
    width: number
    height: number
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
    orientation: 'portrait' | 'landscape'
  }>({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    orientation: 'portrait'
  })

  useEffect(() => {
    function updateScreenSize() {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        orientation: width > height ? 'landscape' : 'portrait'
      })
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  return screenSize
}

// Mobile-friendly editor layout wrapper
interface MobileEditorLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  preview?: React.ReactNode
  className?: string
}

export function MobileEditorLayout({ 
  children, 
  sidebar, 
  preview,
  className = ''
}: MobileEditorLayoutProps) {
  const { isMobile, isTablet } = useScreenSize()
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Mobile: Stack editor and preview, use sheet for sidebar
  if (isMobile) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        {/* Mobile header with tabs and sidebar toggle */}
        <div className="flex items-center justify-between p-2 border-b bg-background">
          <div className="flex items-center gap-1">
            <Button
              variant={activeTab === 'edit' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('edit')}
              className="h-8"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
            {preview && (
              <Button
                variant={activeTab === 'preview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('preview')}
                className="h-8"
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
            )}
          </div>

          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90vw] max-w-sm">
              <SheetHeader>
                <SheetTitle>Content Editor</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                {sidebar}
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'edit' ? children : preview}
        </div>
      </div>
    )
  }

  // Tablet: Side-by-side with collapsible sidebar
  if (isTablet) {
    return (
      <div className={cn('flex h-full', className)}>
        <div className="flex-1 flex flex-col">
          {/* Tablet header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-7 w-7 p-0"
              >
                {sidebarOpen ? <ChevronRight className="h-3 w-3" /> : <Menu className="h-3 w-3" />}
              </Button>
              <Badge variant="secondary" className="text-xs">
                <Tablet className="h-3 w-3 mr-1" />
                Tablet View
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex">
            {/* Sidebar */}
            {sidebarOpen && (
              <div className="w-80 border-r bg-background">
                <ScrollArea className="h-full">
                  {sidebar}
                </ScrollArea>
              </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col">
              {children}
            </div>

            {/* Preview */}
            {preview && (
              <div className="w-1/2 border-l">
                <ScrollArea className="h-full">
                  {preview}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Desktop: Full layout
  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar */}
      <div className="w-80 border-r bg-background">
        <ScrollArea className="h-full">
          {sidebar}
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>

      {/* Preview */}
      {preview && (
        <div className="w-1/2 border-l">
          <ScrollArea className="h-full">
            {preview}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

// Mobile-optimized toolbar
interface MobileToolbarProps {
  tools: Array<{
    icon: React.ReactNode
    label: string
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
  }>
  className?: string
}

export function MobileToolbar({ tools, className = '' }: MobileToolbarProps) {
  const { isMobile } = useScreenSize()
  const [showAll, setShowAll] = useState(false)

  if (!isMobile) {
    return (
      <div className={cn('flex items-center gap-1 p-2', className)}>
        {tools.map((tool, index) => (
          <Button
            key={index}
            variant={tool.isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={tool.onClick}
            disabled={tool.disabled}
            className="h-8 w-8 p-0"
            title={tool.label}
          >
            {tool.icon}
          </Button>
        ))}
      </div>
    )
  }

  const visibleTools = showAll ? tools : tools.slice(0, 6)
  const hasMore = tools.length > 6

  return (
    <div className={cn('flex items-center gap-1 p-2 bg-background border-b', className)}>
      <ScrollArea className="flex-1">
        <div className="flex items-center gap-1 min-w-fit">
          {visibleTools.map((tool, index) => (
            <Button
              key={index}
              variant={tool.isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={tool.onClick}
              disabled={tool.disabled}
              className="h-8 w-8 p-0 flex-shrink-0"
              title={tool.label}
            >
              {tool.icon}
            </Button>
          ))}
          {hasMore && !showAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
              className="h-8 w-8 p-0 flex-shrink-0"
              title="More tools"
            >
              <Settings className="h-3 w-3" />
            </Button>
          )}
          {hasMore && showAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(false)}
              className="h-8 w-8 p-0 flex-shrink-0"
              title="Less tools"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Touch-friendly section controls
interface TouchSectionControlsProps {
  onMoveUp?: () => void
  onMoveDown?: () => void
  onToggleVisibility?: () => void
  onEdit?: () => void
  isVisible?: boolean
  canMoveUp?: boolean
  canMoveDown?: boolean
  className?: string
}

export function TouchSectionControls({
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  onEdit,
  isVisible = true,
  canMoveUp = true,
  canMoveDown = true,
  className = ''
}: TouchSectionControlsProps) {
  const { isMobile } = useScreenSize()

  return (
    <div className={cn(
      'flex items-center gap-1',
      isMobile ? 'min-h-[44px]' : '', // Touch target size
      className
    )}>
      {onEdit && (
        <Button
          variant="ghost"
          size={isMobile ? 'default' : 'sm'}
          onClick={onEdit}
          className={isMobile ? 'h-10 w-10 p-0' : 'h-7 w-7 p-0'}
        >
          <Edit3 className={isMobile ? 'h-4 w-4' : 'h-3 w-3'} />
        </Button>
      )}
      
      {onMoveUp && canMoveUp && (
        <Button
          variant="ghost"
          size={isMobile ? 'default' : 'sm'}
          onClick={onMoveUp}
          className={isMobile ? 'h-10 w-10 p-0' : 'h-7 w-7 p-0'}
        >
          <ChevronLeft className={isMobile ? 'h-4 w-4' : 'h-3 w-3'} />
        </Button>
      )}
      
      {onMoveDown && canMoveDown && (
        <Button
          variant="ghost"
          size={isMobile ? 'default' : 'sm'}
          onClick={onMoveDown}
          className={isMobile ? 'h-10 w-10 p-0' : 'h-7 w-7 p-0'}
        >
          <ChevronRight className={isMobile ? 'h-4 w-4' : 'h-3 w-3'} />
        </Button>
      )}
      
      {onToggleVisibility && (
        <Button
          variant="ghost"
          size={isMobile ? 'default' : 'sm'}
          onClick={onToggleVisibility}
          className={isMobile ? 'h-10 w-10 p-0' : 'h-7 w-7 p-0'}
        >
          <Eye className={cn(
            isMobile ? 'h-4 w-4' : 'h-3 w-3',
            !isVisible && 'opacity-50'
          )} />
        </Button>
      )}
    </div>
  )
}

// Responsive preview frame
interface ResponsivePreviewProps {
  children: React.ReactNode
  device?: 'mobile' | 'tablet' | 'desktop'
  className?: string
}

export function ResponsivePreview({ 
  children, 
  device = 'desktop',
  className = ''
}: ResponsivePreviewProps) {
  const [currentDevice, setCurrentDevice] = useState(device)

  const deviceStyles = {
    mobile: 'max-w-sm mx-auto border rounded-lg overflow-hidden',
    tablet: 'max-w-2xl mx-auto border rounded-lg overflow-hidden',
    desktop: 'w-full'
  }

  const deviceIcons = {
    mobile: Smartphone,
    tablet: Tablet,
    desktop: Monitor
  }

  return (
    <div className={cn('p-4', className)}>
      {/* Device selector */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {Object.entries(deviceIcons).map(([key, Icon]) => (
          <Button
            key={key}
            variant={currentDevice === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentDevice(key as typeof currentDevice)}
            className="h-8"
          >
            <Icon className="h-3 w-3 mr-1" />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </Button>
        ))}
      </div>

      {/* Preview frame */}
      <div className={deviceStyles[currentDevice]}>
        <div className="min-h-96 bg-background">
          {children}
        </div>
      </div>
    </div>
  )
}

// Touch gesture handlers for mobile interactions
export function useTouchGestures() {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isLeftSwipe = distanceX > minSwipeDistance
    const isRightSwipe = distanceX < -minSwipeDistance
    const isUpSwipe = distanceY > minSwipeDistance
    const isDownSwipe = distanceY < -minSwipeDistance

    return {
      isLeftSwipe,
      isRightSwipe,
      isUpSwipe,
      isDownSwipe,
      distanceX: Math.abs(distanceX),
      distanceY: Math.abs(distanceY)
    }
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }
}

export default {
  useScreenSize,
  MobileEditorLayout,
  MobileToolbar,
  TouchSectionControls,
  ResponsivePreview,
  useTouchGestures
}