'use client';

import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { ContentSection } from '@/src/lib/content/schema';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { VisualEditorSkeleton } from './LoadingStates';

/**
 * Simple intersection observer hook
 */
function useInView(options: {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
} = {}) {
  const { threshold = 0, rootMargin = '0px', triggerOnce = false } = options;
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        
        if (triggerOnce && hasTriggered.current) {
          return;
        }

        if (isIntersecting && triggerOnce) {
          hasTriggered.current = true;
        }

        setInView(isIntersecting);
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, inView };
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    lastRenderTime.current = currentTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render #${renderCount.current}, Time since last: ${timeSinceLastRender.toFixed(2)}ms`);
    }
  });

  return {
    renderCount: renderCount.current,
    logPerformance: (operation: string, startTime: number) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${componentName}] ${operation}: ${(performance.now() - startTime).toFixed(2)}ms`);
      }
    }
  };
}

/**
 * Memoized section wrapper that only re-renders when necessary
 */
interface OptimizedSectionProps {
  section: ContentSection;
  sectionKey: string;
  isEditing: boolean;
  children: React.ReactNode;
  onEdit?: (sectionKey: string) => void;
  onDelete?: (sectionKey: string) => void;
}

export const OptimizedSection = memo<OptimizedSectionProps>(function OptimizedSection({
  section,
  sectionKey,
  isEditing,
  children,
  onEdit,
  onDelete
}) {
  usePerformanceMonitor(`OptimizedSection-${sectionKey}`);

  const handleEdit = useCallback(() => {
    onEdit?.(sectionKey);
  }, [onEdit, sectionKey]);

  const handleDelete = useCallback(() => {
    onDelete?.(sectionKey);
  }, [onDelete, sectionKey]);

  return (
    <div 
      data-section={sectionKey}
      data-section-type={section.type}
      data-editing={isEditing}
      className="optimized-section"
    >
      {children}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for optimal re-rendering
  return (
    prevProps.section === nextProps.section &&
    prevProps.sectionKey === nextProps.sectionKey &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete
  );
});

/**
 * Virtualized list component for large content with many sections
 */
interface VirtualizedContentProps {
  sections: Array<{ key: string; section: ContentSection }>;
  renderSection: (item: { key: string; section: ContentSection }, index: number) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
  containerHeight?: number;
}

export function VirtualizedContent({
  sections,
  renderSection,
  itemHeight = 300,
  overscan = 3,
  containerHeight = 600
}: VirtualizedContentProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  usePerformanceMonitor('VirtualizedContent');

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(sections.length, start + visibleCount + overscan * 2);
    
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, overscan, sections.length]);

  const visibleItems = useMemo(() => {
    return sections.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      ...item,
      absoluteIndex: visibleRange.start + index
    }));
  }, [sections, visibleRange]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = sections.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div 
      ref={containerRef}
      className="virtualized-container overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div 
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={item.key}
              style={{ height: itemHeight }}
            >
              {renderSection(item, item.absoluteIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Lazy loading section that loads content only when in view
 */
interface LazyLoadSectionProps {
  sectionKey: string;
  section: ContentSection;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  children: React.ReactNode;
}

export const LazyLoadSection = memo<LazyLoadSectionProps>(function LazyLoadSection({
  sectionKey,
  section,
  placeholder,
  rootMargin = '100px',
  threshold = 0.1,
  children
}) {
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce: true
  });

  usePerformanceMonitor(`LazyLoadSection-${sectionKey}`);

  if (!inView) {
    return (
      <div 
        ref={ref} 
        className="lazy-section-placeholder"
        style={{ minHeight: '200px' }}
      >
        {placeholder || <VisualEditorSkeleton />}
      </div>
    );
  }

  return (
    <div ref={ref} data-section={sectionKey}>
      {children}
    </div>
  );
});

/**
 * Debounced input for performance optimization
 */
interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
}

export const DebouncedInput = memo<DebouncedInputProps>(function DebouncedInput({
  value: initialValue,
  onChange,
  delay = 300,
  ...props
}) {
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  usePerformanceMonitor('DebouncedInput');

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChange(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, onChange, delay]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  return (
    <input
      {...props}
      value={value}
      onChange={handleChange}
    />
  );
});

/**
 * Memoized content renderer that avoids unnecessary re-renders
 */
interface OptimizedContentRendererProps {
  content: Record<string, unknown>;
  sectionType: string;
  isEditing: boolean;
  onContentChange: (path: string, value: unknown) => void;
}

export const OptimizedContentRenderer = memo<OptimizedContentRendererProps>(function OptimizedContentRenderer({
  content,
  sectionType,
  isEditing,
  onContentChange
}) {
  usePerformanceMonitor(`OptimizedContentRenderer-${sectionType}`);

  const memoizedContent = useMemo(() => {
    return JSON.stringify(content);
  }, [content]);

  const handleContentChange = useCallback((path: string, value: unknown) => {
    onContentChange(path, value);
  }, [onContentChange]);

  return (
    <div 
      data-content-type={sectionType}
      data-content-hash={memoizedContent.slice(0, 10)}
    >
      {/* Content rendering logic would go here */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 p-1">
          Type: {sectionType}, Editing: {isEditing.toString()}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Deep comparison for content changes
  const prevContentHash = JSON.stringify(prevProps.content);
  const nextContentHash = JSON.stringify(nextProps.content);
  
  return (
    prevContentHash === nextContentHash &&
    prevProps.sectionType === nextProps.sectionType &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.onContentChange === nextProps.onContentChange
  );
});

/**
 * Performance-optimized drag preview component
 */
interface OptimizedDragPreviewProps {
  section: ContentSection;
  isDragging: boolean;
}

export const OptimizedDragPreview = memo<OptimizedDragPreviewProps>(function OptimizedDragPreview({
  section,
  isDragging
}) {
  usePerformanceMonitor('OptimizedDragPreview');

  const previewStyle = useMemo(() => ({
    opacity: isDragging ? 0.5 : 1,
    transform: isDragging ? 'rotate(2deg) scale(0.95)' : 'none',
    transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)'
  }), [isDragging]);

  return (
    <div 
      style={previewStyle}
      className="drag-preview"
    >
      {/* Simplified preview content */}
      <div className="border-2 border-dashed border-gray-300 p-4 bg-gray-50 rounded">
        <div className="text-sm font-medium">{section.type}</div>
        <div className="text-xs text-gray-500">Dragging...</div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => (
  prevProps.section.type === nextProps.section.type &&
  prevProps.isDragging === nextProps.isDragging
));

/**
 * Memory usage monitor hook
 */
export function useMemoryMonitor(threshold = 100) { // MB
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);
  const [isHighUsage, setIsHighUsage] = useState(false);

  useEffect(() => {
    if (!('memory' in performance)) {
      return;
    }

    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        setMemoryUsage(usedMB);
        setIsHighUsage(usedMB > threshold);
      }
    };

    const interval = setInterval(checkMemory, 5000); // Check every 5 seconds
    checkMemory(); // Initial check

    return () => clearInterval(interval);
  }, [threshold]);

  return {
    memoryUsage,
    isHighUsage,
    formattedUsage: memoryUsage ? `${memoryUsage.toFixed(1)}MB` : null
  };
}

/**
 * Performance context for sharing optimization state
 */
interface PerformanceContextValue {
  isHighMemoryUsage: boolean;
  renderCount: number;
  shouldUseLazyLoading: boolean;
  shouldUseVirtualization: boolean;
}

const PerformanceContext = React.createContext<PerformanceContextValue | undefined>(undefined);

export function PerformanceProvider({ 
  children,
  sectionCount = 0 
}: { 
  children: React.ReactNode;
  sectionCount?: number;
}) {
  const { isHighUsage } = useMemoryMonitor();
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  const value = useMemo((): PerformanceContextValue => ({
    isHighMemoryUsage: isHighUsage,
    renderCount,
    shouldUseLazyLoading: sectionCount > 10 || isHighUsage,
    shouldUseVirtualization: sectionCount > 50
  }), [isHighUsage, renderCount, sectionCount]);

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = React.useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

/**
 * Component that automatically chooses between normal and virtualized rendering
 */
interface SmartContentListProps {
  sections: Array<{ key: string; section: ContentSection }>;
  renderSection: (item: { key: string; section: ContentSection }, index: number) => React.ReactNode;
  containerHeight?: number;
}

export function SmartContentList({
  sections,
  renderSection,
  containerHeight = 600
}: SmartContentListProps) {
  const { shouldUseVirtualization, shouldUseLazyLoading } = usePerformance();

  if (shouldUseVirtualization) {
    return (
      <VirtualizedContent
        sections={sections}
        renderSection={renderSection}
        containerHeight={containerHeight}
      />
    );
  }

  if (shouldUseLazyLoading) {
    return (
      <div className="smart-content-list">
        {sections.map((item, index) => (
          <LazyLoadSection
            key={item.key}
            sectionKey={item.key}
            section={item.section}
          >
            {renderSection(item, index)}
          </LazyLoadSection>
        ))}
      </div>
    );
  }

  return (
    <div className="smart-content-list">
      {sections.map((item, index) => renderSection(item, index))}
    </div>
  );
}