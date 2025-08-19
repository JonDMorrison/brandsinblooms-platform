'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { handleError } from '@/lib/types/error-handling';

/**
 * Configuration options for lazy loading
 */
export interface LazyLoadOptions {
  /** Root margin for intersection observer (default: '50px') */
  rootMargin?: string;
  /** Intersection threshold (default: 0.1) */
  threshold?: number | number[];
  /** Whether to unobserve after loading (default: true) */
  unobserveOnLoad?: boolean;
  /** Delay before triggering load (in ms, default: 0) */
  loadDelay?: number;
  /** Custom root element for intersection observer */
  root?: Element | null;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Loading states for lazy loaded content
 */
export type LazyLoadState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Return type for useLazyLoad hook
 */
export interface LazyLoadReturn {
  /** Whether the element is intersecting (visible) */
  isIntersecting: boolean;
  /** Whether the element has been loaded */
  hasLoaded: boolean;
  /** Current loading state */
  loadState: LazyLoadState;
  /** Ref to attach to the element to observe */
  ref: React.RefObject<Element>;
  /** Manually trigger loading */
  triggerLoad: () => void;
  /** Reset the loading state */
  reset: () => void;
  /** Force reload the content */
  reload: () => void;
}

/**
 * Default configuration for lazy loading
 */
export const DEFAULT_LAZY_LOAD_OPTIONS: Required<LazyLoadOptions> = {
  rootMargin: '50px',
  threshold: 0.1,
  unobserveOnLoad: true,
  loadDelay: 0,
  root: null,
  debug: false,
};

/**
 * Custom hook for implementing lazy loading with Intersection Observer
 * 
 * This hook provides viewport-based loading functionality with configurable
 * intersection thresholds, loading delays, and state management.
 * 
 * @param options - Configuration options for lazy loading behavior
 * @param onLoad - Callback function to execute when loading is triggered
 * @returns Object containing loading state and control functions
 * 
 * @example
 * ```tsx
 * const { isIntersecting, hasLoaded, loadState, ref, triggerLoad } = useLazyLoad(
 *   { rootMargin: '100px', threshold: 0.2 },
 *   async () => {
 *     // Load your content here
 *     await loadImage();
 *   }
 * );
 * 
 * return (
 *   <div ref={ref}>
 *     {hasLoaded ? <YourContent /> : <LoadingSkeleton />}
 *   </div>
 * );
 * ```
 */
export function useLazyLoad(
  options: LazyLoadOptions = {},
  onLoad?: () => Promise<void> | void
): LazyLoadReturn {
  const config = { ...DEFAULT_LAZY_LOAD_OPTIONS, ...options };
  
  // State management
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadState, setLoadState] = useState<LazyLoadState>('idle');
  
  // Refs
  const elementRef = useRef<Element>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredRef = useRef(false);

  /**
   * Cleanup function to clear timeouts and disconnect observer
   */
  const cleanup = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  /**
   * Executes the loading logic with error handling
   */
  const executeLoad = useCallback(async () => {
    if (hasTriggeredRef.current || !onLoad) {
      return;
    }

    hasTriggeredRef.current = true;
    setLoadState('loading');

    if (config.debug) {
      console.log('[useLazyLoad] Triggering load');
    }

    try {
      await onLoad();
      setLoadState('loaded');
      setHasLoaded(true);
      
      if (config.debug) {
        console.log('[useLazyLoad] Load completed successfully');
      }
    } catch (error: unknown) {
      const handledError = handleError(error);
      setLoadState('error');
      
      if (config.debug) {
        console.error('[useLazyLoad] Load failed:', handledError.message);
      }
      
      // Reset trigger flag on error to allow retry
      hasTriggeredRef.current = false;
    }
  }, [onLoad, config.debug]);

  /**
   * Handles intersection changes from the observer
   */
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      const isCurrentlyIntersecting = entry?.isIntersecting ?? false;
      
      setIsIntersecting(isCurrentlyIntersecting);

      if (config.debug) {
        console.log('[useLazyLoad] Intersection changed:', {
          isIntersecting: isCurrentlyIntersecting,
          intersectionRatio: entry?.intersectionRatio,
          hasTriggered: hasTriggeredRef.current,
        });
      }

      // Trigger loading when intersecting and not already triggered
      if (isCurrentlyIntersecting && !hasTriggeredRef.current) {
        if (config.loadDelay > 0) {
          // Clear any existing timeout
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
          }
          
          // Set delayed load
          loadTimeoutRef.current = setTimeout(() => {
            executeLoad();
          }, config.loadDelay);
        } else {
          // Immediate load
          executeLoad();
        }
      }
    },
    [executeLoad, config.loadDelay, config.debug]
  );

  /**
   * Sets up the intersection observer
   */
  const setupObserver = useCallback(() => {
    if (!elementRef.current || observerRef.current) {
      return;
    }

    try {
      const observer = new IntersectionObserver(handleIntersection, {
        root: config.root,
        rootMargin: config.rootMargin,
        threshold: config.threshold,
      });

      observer.observe(elementRef.current);
      observerRef.current = observer;

      if (config.debug) {
        console.log('[useLazyLoad] Observer setup completed', {
          rootMargin: config.rootMargin,
          threshold: config.threshold,
        });
      }
    } catch (error: unknown) {
      const handledError = handleError(error);
      console.error('[useLazyLoad] Failed to setup observer:', handledError.message);
    }
  }, [handleIntersection, config]);

  /**
   * Manually trigger loading
   */
  const triggerLoad = useCallback(() => {
    if (hasTriggeredRef.current) {
      return;
    }

    if (config.debug) {
      console.log('[useLazyLoad] Manual trigger');
    }

    executeLoad();
  }, [executeLoad, config.debug]);

  /**
   * Reset the loading state
   */
  const reset = useCallback(() => {
    setIsIntersecting(false);
    setHasLoaded(false);
    setLoadState('idle');
    hasTriggeredRef.current = false;
    
    // Clear timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    if (config.debug) {
      console.log('[useLazyLoad] State reset');
    }
  }, [config.debug]);

  /**
   * Force reload the content
   */
  const reload = useCallback(() => {
    reset();
    // Re-trigger loading immediately
    setTimeout(() => {
      triggerLoad();
    }, 0);
  }, [reset, triggerLoad]);

  // Setup observer when element ref is set
  useEffect(() => {
    if (elementRef.current) {
      setupObserver();
    }

    return () => {
      cleanup();
    };
  }, [setupObserver, cleanup]);

  // Unobserve after loading if configured
  useEffect(() => {
    if (hasLoaded && config.unobserveOnLoad && observerRef.current && elementRef.current) {
      observerRef.current.unobserve(elementRef.current);
      
      if (config.debug) {
        console.log('[useLazyLoad] Unobserved after loading');
      }
    }
  }, [hasLoaded, config.unobserveOnLoad, config.debug]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isIntersecting,
    hasLoaded,
    loadState,
    ref: elementRef,
    triggerLoad,
    reset,
    reload,
  };
}

/**
 * Hook for lazy loading images specifically
 * Provides additional image-specific functionality
 */
export function useLazyLoadImage(
  src: string,
  options: LazyLoadOptions = {}
): LazyLoadReturn & {
  /** The image source to use (empty until loaded) */
  imageSrc: string;
  /** Whether the image has started loading */
  imageLoading: boolean;
} {
  const [imageSrc, setImageSrc] = useState('');
  const [imageLoading, setImageLoading] = useState(false);

  const lazyLoad = useLazyLoad(options, async () => {
    setImageLoading(true);
    
    try {
      // Preload the image
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      });
      
      setImageSrc(src);
    } finally {
      setImageLoading(false);
    }
  });

  // Reset image src when lazy load resets
  useEffect(() => {
    if (lazyLoad.loadState === 'idle') {
      setImageSrc('');
      setImageLoading(false);
    }
  }, [lazyLoad.loadState]);

  return {
    ...lazyLoad,
    imageSrc,
    imageLoading,
  };
}

/**
 * Hook for lazy loading with batch support
 * Useful for loading multiple items together
 */
export function useLazyLoadBatch(
  items: string[],
  options: LazyLoadOptions = {},
  batchSize: number = 3
): LazyLoadReturn & {
  /** Items that have been loaded */
  loadedItems: Set<string>;
  /** Currently loading items */
  loadingItems: Set<string>;
  /** Failed items */
  failedItems: Set<string>;
} {
  const [loadedItems, setLoadedItems] = useState(new Set<string>());
  const [loadingItems, setLoadingItems] = useState(new Set<string>());
  const [failedItems, setFailedItems] = useState(new Set<string>());

  const lazyLoad = useLazyLoad(options, async () => {
    // Load items in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Mark batch as loading
      setLoadingItems(prev => new Set([...prev, ...batch]));
      
      try {
        await Promise.all(
          batch.map(async (item) => {
            try {
              // Simulate or implement actual loading logic
              await new Promise(resolve => setTimeout(resolve, 100));
              
              setLoadedItems(prev => new Set([...prev, item]));
              setLoadingItems(prev => {
                const next = new Set(prev);
                next.delete(item);
                return next;
              });
            } catch (error: unknown) {
              setFailedItems(prev => new Set([...prev, item]));
              setLoadingItems(prev => {
                const next = new Set(prev);
                next.delete(item);
                return next;
              });
            }
          })
        );
      } catch (error: unknown) {
        // Handle batch failure
        batch.forEach(item => {
          setFailedItems(prev => new Set([...prev, item]));
          setLoadingItems(prev => {
            const next = new Set(prev);
            next.delete(item);
            return next;
          });
        });
      }
    }
  });

  // Reset sets when lazy load resets
  useEffect(() => {
    if (lazyLoad.loadState === 'idle') {
      setLoadedItems(new Set());
      setLoadingItems(new Set());
      setFailedItems(new Set());
    }
  }, [lazyLoad.loadState]);

  return {
    ...lazyLoad,
    loadedItems,
    loadingItems,
    failedItems,
  };
}

/**
 * Performance monitoring utilities for lazy loading
 */
export interface LazyLoadPerformanceMetrics {
  /** Time from intersection to load start (ms) */
  intersectionToLoadDelay: number;
  /** Time to complete loading (ms) */
  loadDuration: number;
  /** Total time from intersection to loaded (ms) */
  totalTime: number;
  /** Whether loading was triggered by intersection or manual trigger */
  triggeredBy: 'intersection' | 'manual';
}

/**
 * Hook for monitoring lazy load performance
 */
export function useLazyLoadPerformance(
  options: LazyLoadOptions = {},
  onLoad?: () => Promise<void> | void,
  onMetrics?: (metrics: LazyLoadPerformanceMetrics) => void
): LazyLoadReturn & {
  /** Performance metrics */
  metrics: LazyLoadPerformanceMetrics | null;
} {
  const [metrics, setMetrics] = useState<LazyLoadPerformanceMetrics | null>(null);
  const metricsRef = useRef({
    intersectionTime: 0,
    loadStartTime: 0,
    loadEndTime: 0,
    triggeredBy: 'intersection' as const,
  });

  const lazyLoad = useLazyLoad(options, async () => {
    metricsRef.current.loadStartTime = performance.now();
    
    try {
      await onLoad?.();
    } finally {
      metricsRef.current.loadEndTime = performance.now();
      
      const computedMetrics: LazyLoadPerformanceMetrics = {
        intersectionToLoadDelay: metricsRef.current.loadStartTime - metricsRef.current.intersectionTime,
        loadDuration: metricsRef.current.loadEndTime - metricsRef.current.loadStartTime,
        totalTime: metricsRef.current.loadEndTime - metricsRef.current.intersectionTime,
        triggeredBy: metricsRef.current.triggeredBy,
      };
      
      setMetrics(computedMetrics);
      onMetrics?.(computedMetrics);
    }
  });

  // Track intersection timing
  useEffect(() => {
    if (lazyLoad.isIntersecting && metricsRef.current.intersectionTime === 0) {
      metricsRef.current.intersectionTime = performance.now();
      metricsRef.current.triggeredBy = 'intersection';
    }
  }, [lazyLoad.isIntersecting]);

  // Provide manual trigger with metrics tracking
  const triggerLoadWithMetrics = useCallback(() => {
    metricsRef.current.intersectionTime = performance.now();
    metricsRef.current.triggeredBy = 'manual';
    lazyLoad.triggerLoad();
  }, [lazyLoad.triggerLoad]);

  return {
    ...lazyLoad,
    triggerLoad: triggerLoadWithMetrics,
    metrics,
  };
}