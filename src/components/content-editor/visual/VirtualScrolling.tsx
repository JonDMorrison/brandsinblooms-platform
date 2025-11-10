'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ContentSection } from '@/src/lib/content/schema';
import { VisualEditorSkeleton } from './LoadingStates';
import { cn } from '@/src/lib/utils';

/**
 * Virtual scrolling configuration
 */
interface VirtualScrollConfig {
  itemHeight: number;
  overscan: number;
  threshold: number;
  bufferSize: number;
}

/**
 * Virtual item data
 */
interface VirtualItem<T = unknown> {
  index: number;
  data: T;
  height: number;
  offset: number;
  isVisible: boolean;
}

/**
 * Enhanced virtual scrolling hook with dynamic heights
 */
export function useVirtualScroll<T = unknown>({
  items,
  containerHeight,
  itemHeight: defaultItemHeight = 200,
  overscan = 5,
  enabled = true
}: {
  items: T[];
  containerHeight: number;
  itemHeight?: number;
  overscan?: number;
  enabled?: boolean;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const itemHeights = useRef<Map<number, number>>(new Map());
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const measureCache = useRef<Map<number, number>>(new Map());

  // Reset cache when items change
  useEffect(() => {
    itemHeights.current.clear();
    measureCache.current.clear();
  }, [items.length]);

  // Get item height (cached or default)
  const getItemHeight = useCallback((index: number): number => {
    const cached = itemHeights.current.get(index);
    return cached ?? defaultItemHeight;
  }, [defaultItemHeight]);

  // Set item height (for dynamic sizing)
  const setItemHeight = useCallback((index: number, height: number) => {
    if (height !== itemHeights.current.get(index)) {
      itemHeights.current.set(index, height);
      measureCache.current.clear(); // Clear offset cache
    }
  }, []);

  // Calculate item offset with caching
  const getItemOffset = useCallback((index: number): number => {
    if (measureCache.current.has(index)) {
      return measureCache.current.get(index)!;
    }

    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i);
    }
    
    measureCache.current.set(index, offset);
    return offset;
  }, [getItemHeight]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    if (!enabled || items.length === 0) return 0;
    
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += getItemHeight(i);
    }
    return total;
  }, [items.length, enabled, getItemHeight]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (!enabled) {
      return {
        start: 0,
        end: items.length,
        offsetY: 0
      };
    }

    const viewportStart = scrollTop;
    const viewportEnd = scrollTop + containerHeight;

    let start = 0;
    let offsetY = 0;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const itemOffset = getItemOffset(i);
      const itemHeight = getItemHeight(i);
      
      if (itemOffset + itemHeight > viewportStart) {
        start = Math.max(0, i - overscan);
        offsetY = getItemOffset(start);
        break;
      }
    }

    // Find end index
    let end = start;
    for (let i = start; i < items.length; i++) {
      const itemOffset = getItemOffset(i);
      if (itemOffset > viewportEnd) {
        break;
      }
      end = i + 1;
    }
    end = Math.min(items.length, end + overscan);

    return { start, end, offsetY };
  }, [scrollTop, containerHeight, items.length, overscan, enabled, getItemOffset, getItemHeight]);

  // Get visible items
  const visibleItems = useMemo((): VirtualItem<T>[] => {
    const { start, end } = visibleRange;
    
    return items.slice(start, end).map((data, index) => {
      const absoluteIndex = start + index;
      return {
        index: absoluteIndex,
        data,
        height: getItemHeight(absoluteIndex),
        offset: getItemOffset(absoluteIndex),
        isVisible: true
      };
    });
  }, [items, visibleRange, getItemHeight, getItemOffset]);

  // Handle scroll with throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    // Set scroll end timeout
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY: visibleRange.offsetY,
    isScrolling,
    handleScroll,
    setItemHeight,
    scrollToIndex: (index: number) => {
      const offset = getItemOffset(index);
      return offset;
    }
  };
}

/**
 * Virtual list container component
 */
interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight?: number;
  renderItem: (item: VirtualItem<T>) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  enabled?: boolean;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight = 200,
  renderItem,
  overscan = 5,
  className,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent,
  enabled = true
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    visibleItems,
    totalHeight,
    offsetY,
    isScrolling,
    handleScroll,
    setItemHeight
  } = useVirtualScroll({
    items,
    containerHeight: height,
    itemHeight,
    overscan,
    enabled: enabled && items.length > 50 // Only enable for large lists
  });

  const handleScrollWithCallback = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    handleScroll(e);
    onScroll?.(e.currentTarget.scrollTop);
  }, [handleScroll, onScroll]);

  // Loading state
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        {loadingComponent || <VisualEditorSkeleton />}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        {emptyComponent || <div className="text-muted-foreground">No items to display</div>}
      </div>
    );
  }

  // Non-virtualized render for small lists
  if (!enabled || items.length <= 50) {
    return (
      <div
        ref={containerRef}
        className={cn('overflow-auto', className)}
        style={{ height }}
        onScroll={handleScrollWithCallback}
      >
        {items.map((item, index) => (
          <div key={index}>
            {renderItem({
              index,
              data: item,
              height: itemHeight,
              offset: index * itemHeight,
              isVisible: true
            })}
          </div>
        ))}
      </div>
    );
  }

  // Virtualized render
  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height }}
      onScroll={handleScrollWithCallback}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((virtualItem) => (
            <VirtualItemWrapper
              key={virtualItem.index}
              virtualItem={virtualItem}
              onHeightChange={(height) => setItemHeight(virtualItem.index, height)}
            >
              {renderItem(virtualItem)}
            </VirtualItemWrapper>
          ))}
        </div>
      </div>
      
      {/* Scrolling indicator */}
      {isScrolling && (
        <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
          Scrolling...
        </div>
      )}
    </div>
  );
}

/**
 * Wrapper component for measuring virtual items
 */
interface VirtualItemWrapperProps<T> {
  virtualItem: VirtualItem<T>;
  onHeightChange: (height: number) => void;
  children: React.ReactNode;
}

function VirtualItemWrapper<T>({
  virtualItem,
  onHeightChange,
  children
}: VirtualItemWrapperProps<T>) {
  const itemRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver>();

  useEffect(() => {
    const element = itemRef.current;
    if (!element) return;

    // Use ResizeObserver for more accurate height detection
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0 && height !== virtualItem.height) {
          onHeightChange(height);
        }
      }
    });

    resizeObserverRef.current.observe(element);

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, [onHeightChange, virtualItem.height]);

  return (
    <div
      ref={itemRef}
      data-index={virtualItem.index}
      style={{ minHeight: virtualItem.height }}
    >
      {children}
    </div>
  );
}

/**
 * Virtual grid component for 2D virtualization
 */
interface VirtualGridProps<T> {
  items: T[];
  height: number;
  width: number;
  itemHeight: number;
  itemWidth: number;
  columns: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  className?: string;
}

export function VirtualGrid<T>({
  items,
  height,
  width,
  itemHeight,
  itemWidth,
  columns,
  renderItem,
  gap = 8,
  className
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const rows = Math.ceil(items.length / columns);
  const totalHeight = rows * (itemHeight + gap) - gap;

  const visibleRange = useMemo(() => {
    const startRow = Math.floor(scrollTop / (itemHeight + gap));
    const visibleRows = Math.ceil(height / (itemHeight + gap)) + 2; // +2 for overscan
    const endRow = Math.min(rows, startRow + visibleRows);

    return {
      startRow: Math.max(0, startRow),
      endRow,
      offsetY: startRow * (itemHeight + gap)
    };
  }, [scrollTop, itemHeight, gap, height, rows]);

  const visibleItems = useMemo(() => {
    const { startRow, endRow } = visibleRange;
    const visible: Array<{ item: T; index: number; row: number; col: number }> = [];

    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        if (index < items.length) {
          visible.push({
            item: items[index],
            index,
            row,
            col
          });
        }
      }
    }

    return visible;
  }, [items, visibleRange, columns]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height, width }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleRange.offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index, row, col }) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: col * (itemWidth + gap),
                top: (row - visibleRange.startRow) * (itemHeight + gap),
                width: itemWidth,
                height: itemHeight,
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Performance monitoring for virtual scrolling
 */
export function useVirtualScrollPerformance(enabled = true) {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const [fps, setFps] = useState(60);
  const [isLagging, setIsLagging] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let animationFrame: number;

    const measurePerformance = () => {
      frameCount.current++;
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime.current;

      // Update FPS every second
      if (deltaTime >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / deltaTime);
        setFps(currentFps);
        setIsLagging(currentFps < 30); // Consider lagging if below 30fps
        
        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      animationFrame = requestAnimationFrame(measurePerformance);
    };

    animationFrame = requestAnimationFrame(measurePerformance);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [enabled]);

  return { fps, isLagging };
}

/**
 * Auto-virtualization wrapper that enables virtualization based on performance
 */
interface AutoVirtualizedListProps<T> extends Omit<VirtualListProps<T>, 'enabled'> {
  autoVirtualizeThreshold?: number;
  performanceThreshold?: number;
}

export function AutoVirtualizedList<T>({
  items,
  autoVirtualizeThreshold = 50,
  performanceThreshold = 30,
  ...props
}: AutoVirtualizedListProps<T>) {
  const { fps, isLagging } = useVirtualScrollPerformance();
  const [forceVirtualization, setForceVirtualization] = useState(false);

  // Enable virtualization if list is large or performance is poor
  const shouldVirtualize = useMemo(() => {
    return items.length > autoVirtualizeThreshold || 
           isLagging || 
           forceVirtualization;
  }, [items.length, autoVirtualizeThreshold, isLagging, forceVirtualization]);

  // Auto-enable virtualization if performance degrades
  useEffect(() => {
    if (fps > 0 && fps < performanceThreshold && !forceVirtualization) {
      console.warn(`Performance degraded (${fps}fps), enabling virtualization`);
      setForceVirtualization(true);
    }
  }, [fps, performanceThreshold, forceVirtualization]);

  return (
    <VirtualList
      {...props}
      items={items}
      enabled={shouldVirtualize}
    />
  );
}