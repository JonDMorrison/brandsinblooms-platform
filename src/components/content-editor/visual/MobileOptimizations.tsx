'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Move, 
  Edit3, 
  Save, 
  X,
  Plus,
  Trash2,
  MoreHorizontal,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';

/**
 * Device detection and responsive breakpoints
 */
export function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenWidth: 0,
    screenHeight: 0,
    orientation: 'portrait' as 'portrait' | 'landscape'
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setDeviceInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isTouchDevice,
        screenWidth: width,
        screenHeight: height,
        orientation: width > height ? 'landscape' : 'portrait'
      });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

/**
 * Enhanced touch gesture handler
 */
interface TouchGestureOptions {
  onTap?: (e: TouchEvent) => void;
  onDoubleTap?: (e: TouchEvent) => void;
  onLongPress?: (e: TouchEvent) => void;
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', e: TouchEvent) => void;
  onPinch?: (scale: number, e: TouchEvent) => void;
  longPressDuration?: number;
  swipeThreshold?: number;
  doubleTapDelay?: number;
}

export function useTouchGestures(options: TouchGestureOptions = {}) {
  const {
    onTap,
    onDoubleTap,
    onLongPress,
    onSwipe,
    onPinch,
    longPressDuration = 500,
    swipeThreshold = 50,
    doubleTapDelay = 300
  } = options;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimeout = useRef<NodeJS.Timeout>();
  const lastTap = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now
    };

    // Long press detection
    if (onLongPress) {
      longPressTimeout.current = setTimeout(() => {
        onLongPress(e.nativeEvent);
      }, longPressDuration);
    }

    // Clear any previous long press timeout
    if (longPressTimeout.current && !onLongPress) {
      clearTimeout(longPressTimeout.current);
    }
  }, [onLongPress, longPressDuration]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }

    const touch = e.changedTouches[0];
    const now = Date.now();
    
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now
    };

    if (!touchStart.current) return;

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const deltaTime = touchEnd.current.time - touchStart.current.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Swipe detection
    if (distance > swipeThreshold && onSwipe) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      if (absX > absY) {
        onSwipe(deltaX > 0 ? 'right' : 'left', e.nativeEvent);
      } else {
        onSwipe(deltaY > 0 ? 'down' : 'up', e.nativeEvent);
      }
      return;
    }

    // Tap detection (short touch with minimal movement)
    if (distance < 10 && deltaTime < 500) {
      const timeSinceLastTap = now - lastTap.current;
      
      if (timeSinceLastTap < doubleTapDelay && onDoubleTap) {
        onDoubleTap(e.nativeEvent);
        lastTap.current = 0; // Reset to prevent triple tap
      } else {
        if (onTap) {
          // Delay tap to check for double tap
          setTimeout(() => {
            if (Date.now() - lastTap.current > doubleTapDelay) {
              onTap(e.nativeEvent);
            }
          }, doubleTapDelay);
        }
        lastTap.current = now;
      }
    }
  }, [onTap, onDoubleTap, onSwipe, swipeThreshold, doubleTapDelay]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  };
}

/**
 * Mobile-optimized floating toolbar
 */
interface MobileToolbarProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

export function MobileFloatingToolbar({
  isVisible,
  position,
  onSave,
  onCancel,
  onDelete,
  children
}: MobileToolbarProps) {
  const { isMobile } = useDeviceDetection();
  
  if (!isVisible) return null;

  const toolbarStyle = {
    left: Math.max(16, Math.min(position.x - 100, window.innerWidth - 216)),
    top: Math.max(16, position.y - 60),
    zIndex: 9999
  };

  return (
    <div
      className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2 flex gap-2"
      style={toolbarStyle}
    >
      {onSave && (
        <Button
          size={isMobile ? "sm" : "default"}
          variant="ghost"
          className={cn(
            'flex items-center gap-2',
            isMobile && 'h-11 w-11 p-0' // 44px minimum for touch
          )}
          onClick={onSave}
        >
          <Save className="h-4 w-4" />
          {!isMobile && <span>Save</span>}
        </Button>
      )}
      
      {onCancel && (
        <Button
          size={isMobile ? "sm" : "default"}
          variant="ghost"
          className={cn(
            'flex items-center gap-2',
            isMobile && 'h-11 w-11 p-0'
          )}
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
          {!isMobile && <span>Cancel</span>}
        </Button>
      )}

      {onDelete && (
        <Button
          size={isMobile ? "sm" : "default"}
          variant="ghost"
          className={cn(
            'flex items-center gap-2 text-destructive hover:text-destructive',
            isMobile && 'h-11 w-11 p-0'
          )}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          {!isMobile && <span>Delete</span>}
        </Button>
      )}

      {children}
    </div>
  );
}

/**
 * Touch-optimized drag handle
 */
interface TouchDragHandleProps {
  isVisible: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  className?: string;
}

export function TouchDragHandle({
  isVisible,
  onDragStart,
  onDragEnd,
  className
}: TouchDragHandleProps) {
  const { isTouchDevice } = useDeviceDetection();
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = useCallback(() => {
    setIsDragging(true);
    onDragStart?.();
  }, [onDragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    onDragEnd?.();
  }, [onDragEnd]);

  if (!isVisible || !isTouchDevice) return null;

  return (
    <div
      className={cn(
        'absolute left-1/2 -translate-x-1/2 -top-3 z-10',
        'w-12 h-6 bg-primary/80 rounded-full',
        'flex items-center justify-center',
        'touch-manipulation cursor-grab active:cursor-grabbing',
        'shadow-lg border-2 border-white',
        isDragging && 'scale-110 bg-primary',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        minHeight: '44px', // Accessibility guideline for touch targets
        minWidth: '44px'
      }}
    >
      <Move className="h-4 w-4 text-white" />
    </div>
  );
}

/**
 * Mobile-optimized section controls
 */
interface MobileSectionControlsProps {
  sectionKey: string;
  isEditing: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
}

export function MobileSectionControls({
  sectionKey,
  isEditing,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate
}: MobileSectionControlsProps) {
  const { isMobile, isTouchDevice } = useDeviceDetection();
  const [isOpen, setIsOpen] = useState(false);

  if (!isTouchDevice) return null;

  const buttonSize = isMobile ? "sm" : "default";
  const touchTargetClass = 'h-11 w-11 p-0'; // 44px minimum

  return (
    <div className="absolute top-2 right-2 z-10">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size={buttonSize}
            variant="secondary"
            className={cn(
              'bg-white/90 backdrop-blur-sm shadow-lg border',
              touchTargetClass
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          side="bottom" 
          align="end" 
          className="p-2 w-auto"
        >
          <div className="flex flex-col gap-1">
            {onEdit && (
              <Button
                size={buttonSize}
                variant="ghost"
                className={cn('justify-start gap-2', touchTargetClass)}
                onClick={() => {
                  onEdit();
                  setIsOpen(false);
                }}
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            )}
            
            {onMoveUp && (
              <Button
                size={buttonSize}
                variant="ghost"
                className={cn('justify-start gap-2', touchTargetClass)}
                onClick={() => {
                  onMoveUp();
                  setIsOpen(false);
                }}
              >
                <ChevronUp className="h-4 w-4" />
                <span>Move Up</span>
              </Button>
            )}
            
            {onMoveDown && (
              <Button
                size={buttonSize}
                variant="ghost" 
                className={cn('justify-start gap-2', touchTargetClass)}
                onClick={() => {
                  onMoveDown();
                  setIsOpen(false);
                }}
              >
                <ChevronDown className="h-4 w-4" />
                <span>Move Down</span>
              </Button>
            )}
            
            {onDuplicate && (
              <Button
                size={buttonSize}
                variant="ghost"
                className={cn('justify-start gap-2', touchTargetClass)}
                onClick={() => {
                  onDuplicate();
                  setIsOpen(false);
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Duplicate</span>
              </Button>
            )}
            
            {onDelete && (
              <>
                <div className="h-px bg-border my-1" />
                <Button
                  size={buttonSize}
                  variant="ghost"
                  className={cn(
                    'justify-start gap-2 text-destructive hover:text-destructive',
                    touchTargetClass
                  )}
                  onClick={() => {
                    onDelete();
                    setIsOpen(false);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Responsive viewport switcher
 */
interface ViewportSwitcherProps {
  currentViewport: 'mobile' | 'tablet' | 'desktop';
  onViewportChange: (viewport: 'mobile' | 'tablet' | 'desktop') => void;
  className?: string;
}

export function ViewportSwitcher({
  currentViewport,
  onViewportChange,
  className
}: ViewportSwitcherProps) {
  const { isMobile } = useDeviceDetection();

  const viewports = [
    { id: 'mobile' as const, icon: Smartphone, label: 'Mobile', width: '375px' },
    { id: 'tablet' as const, icon: Tablet, label: 'Tablet', width: '768px' },
    { id: 'desktop' as const, icon: Monitor, label: 'Desktop', width: '100%' }
  ];

  return (
    <div className={cn('flex bg-muted rounded-lg p-1', className)}>
      {viewports.map(({ id, icon: Icon, label }) => (
        <Button
          key={id}
          size={isMobile ? "sm" : "default"}
          variant={currentViewport === id ? "secondary" : "ghost"}
          className={cn(
            'flex items-center gap-2',
            isMobile && 'h-11 px-3' // Touch-friendly on mobile
          )}
          onClick={() => onViewportChange(id)}
        >
          <Icon className="h-4 w-4" />
          {!isMobile && <span>{label}</span>}
        </Button>
      ))}
    </div>
  );
}

/**
 * Touch-optimized scrollable area
 */
interface TouchScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  height?: string;
  showScrollbars?: boolean;
}

export function TouchScrollArea({
  children,
  className,
  height = '100%',
  showScrollbars = true
}: TouchScrollAreaProps) {
  const { isTouchDevice } = useDeviceDetection();

  return (
    <div
      className={cn(
        'overflow-auto',
        // Better touch scrolling on iOS
        isTouchDevice && 'touch-pan-y overflow-x-hidden',
        // Hide scrollbars on touch devices if requested
        !showScrollbars && isTouchDevice && 'scrollbar-hide',
        className
      )}
      style={{
        height,
        WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
      }}
    >
      {children}
    </div>
  );
}

/**
 * Enhanced touch area for small interactive elements
 */
interface TouchAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  minSize?: number;
  className?: string;
}

export function TouchArea({
  children,
  minSize = 44,
  className,
  onClick,
  ...props
}: TouchAreaProps) {
  const { isTouchDevice } = useDeviceDetection();

  if (!isTouchDevice) {
    return (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center touch-manipulation',
        className
      )}
      style={{
        minWidth: `${minSize}px`,
        minHeight: `${minSize}px`
      }}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Mobile keyboard height adjustment hook
 */
export function useKeyboardAdjustment() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(heightDiff);
        setIsKeyboardVisible(heightDiff > 150); // Threshold for keyboard detection
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, []);

  return {
    keyboardHeight,
    isKeyboardVisible,
    adjustedHeight: `calc(100vh - ${keyboardHeight}px)`
  };
}

/**
 * CSS classes for touch optimization
 */
export const touchOptimizationClasses = {
  // Prevent text selection during drag operations
  noSelect: 'select-none touch-manipulation',
  
  // Optimize touch targets
  touchTarget: 'min-h-[44px] min-w-[44px] touch-manipulation',
  
  // Smooth scrolling
  smoothScroll: 'scroll-smooth touch-pan-y',
  
  // Prevent zoom on input focus (iOS)
  noZoom: '[font-size:16px] sm:[font-size:inherit]',
  
  // Safe area padding for notched devices
  safeArea: 'pt-safe-area-inset-top pb-safe-area-inset-bottom pl-safe-area-inset-left pr-safe-area-inset-right',
  
  // Touch feedback
  touchFeedback: 'active:scale-95 active:bg-muted/50 transition-transform'
};