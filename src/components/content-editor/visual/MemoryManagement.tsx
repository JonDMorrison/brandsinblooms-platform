'use client';

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useVisualEditorToast } from './VisualEditorToast';

/**
 * Memory usage monitoring hook
 */
export function useMemoryMonitoring(options: {
  interval?: number;
  warningThreshold?: number; // MB
  criticalThreshold?: number; // MB
  onWarning?: (usage: number) => void;
  onCritical?: (usage: number) => void;
} = {}) {
  const {
    interval = 10000, // 10 seconds
    warningThreshold = 100, // 100MB
    criticalThreshold = 200, // 200MB
    onWarning,
    onCritical
  } = options;

  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  const warningShown = useRef(false);
  const criticalShown = useRef(false);
  const { performance: performanceToast } = useVisualEditorToast();

  useEffect(() => {
    if (!('memory' in performance)) {
      console.warn('Memory API not available in this browser');
      return;
    }

    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMB = memory.totalJSHeapSize / 1024 / 1024;
        const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;

        setMemoryInfo({
          used: usedMB,
          total: totalMB,
          limit: limitMB
        });

        // Warning threshold
        if (usedMB > warningThreshold && !warningShown.current) {
          warningShown.current = true;
          onWarning?.(usedMB);
          performanceToast.memoryWarning();
          console.warn(`High memory usage detected: ${usedMB.toFixed(1)}MB`);
        }

        // Critical threshold
        if (usedMB > criticalThreshold && !criticalShown.current) {
          criticalShown.current = true;
          onCritical?.(usedMB);
          console.error(`Critical memory usage: ${usedMB.toFixed(1)}MB`);
        }

        // Reset warnings if memory usage drops
        if (usedMB < warningThreshold * 0.8) {
          warningShown.current = false;
          criticalShown.current = false;
        }
      }
    };

    const intervalId = setInterval(checkMemory, interval);
    checkMemory(); // Initial check

    return () => clearInterval(intervalId);
  }, [interval, warningThreshold, criticalThreshold, onWarning, onCritical, performanceToast]);

  return memoryInfo;
}

/**
 * Automatic cleanup hook for event listeners and timers
 */
export function useCleanup() {
  const cleanup = useRef<Array<() => void>>([]);

  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanup.current.push(cleanupFn);
  }, []);

  const runCleanup = useCallback(() => {
    cleanup.current.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });
    cleanup.current = [];
  }, []);

  useEffect(() => {
    return runCleanup;
  }, [runCleanup]);

  return { addCleanup, runCleanup };
}

/**
 * Enhanced useEffect hook with automatic cleanup
 */
export function useEffectWithCleanup(
  effect: () => void | (() => void),
  deps?: React.DependencyList,
  debugName?: string
) {
  const { addCleanup } = useCleanup();
  const effectRef = useRef<(() => void) | void>();

  useEffect(() => {
    if (debugName && process.env.NODE_ENV === 'development') {
      console.log(`[${debugName}] Effect running`);
    }

    // Run the effect
    effectRef.current = effect();

    // If effect returns cleanup function, add it to cleanup registry
    if (typeof effectRef.current === 'function') {
      addCleanup(effectRef.current);
    }

    return () => {
      if (debugName && process.env.NODE_ENV === 'development') {
        console.log(`[${debugName}] Effect cleaning up`);
      }
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Debounced callback with automatic cleanup
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { addCleanup } = useCleanup();

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [...deps, delay]); // eslint-disable-line react-hooks/exhaustive-deps

  // Register cleanup
  useEffect(() => {
    const cleanup = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    
    addCleanup(cleanup);
    return cleanup;
  }, [addCleanup]);

  return debouncedCallback;
}

/**
 * Throttled callback with automatic cleanup
 */
export function useThrottledCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
) {
  const lastRun = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { addCleanup } = useCleanup();

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastRun.current = Date.now();
      }, delay - (now - lastRun.current));
    }
  }, [...deps, delay]); // eslint-disable-line react-hooks/exhaustive-deps

  // Register cleanup
  useEffect(() => {
    const cleanup = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    
    addCleanup(cleanup);
    return cleanup;
  }, [addCleanup]);

  return throttledCallback;
}

/**
 * WeakMap-based cache for better garbage collection
 */
class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>();

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    // WeakMap doesn't have clear method, create new instance
    this.cache = new WeakMap<K, V>();
  }
}

/**
 * Hook for managing WeakMap-based caches
 */
export function useWeakCache<K extends object, V>() {
  const cache = useMemo(() => new WeakCache<K, V>(), []);

  const { addCleanup } = useCleanup();

  useEffect(() => {
    addCleanup(() => {
      cache.clear();
    });
  }, [addCleanup, cache]);

  return cache;
}

/**
 * Observer pattern with automatic cleanup
 */
export class CleanupObserver<T> {
  private observers = new Set<(data: T) => void>();
  private cleanupCallbacks = new Set<() => void>();

  subscribe(callback: (data: T) => void, cleanup?: () => void): () => void {
    this.observers.add(callback);
    if (cleanup) {
      this.cleanupCallbacks.add(cleanup);
    }

    return () => {
      this.observers.delete(callback);
      if (cleanup) {
        this.cleanupCallbacks.delete(cleanup);
      }
    };
  }

  notify(data: T): void {
    this.observers.forEach(observer => {
      try {
        observer(data);
      } catch (error) {
        console.error('Observer error:', error);
      }
    });
  }

  destroy(): void {
    // Run all cleanup callbacks
    this.cleanupCallbacks.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });

    this.observers.clear();
    this.cleanupCallbacks.clear();
  }

  get size(): number {
    return this.observers.size;
  }
}

/**
 * Hook for creating and managing observers
 */
export function useObserver<T>() {
  const observer = useMemo(() => new CleanupObserver<T>(), []);
  const { addCleanup } = useCleanup();

  useEffect(() => {
    addCleanup(() => {
      observer.destroy();
    });
  }, [addCleanup, observer]);

  return observer;
}

/**
 * Resource manager for tracking and cleaning up resources
 */
class ResourceManager {
  private resources = new Map<string, () => void>();

  register(id: string, cleanup: () => void): void {
    // Clean up existing resource if it exists
    if (this.resources.has(id)) {
      const existingCleanup = this.resources.get(id)!;
      try {
        existingCleanup();
      } catch (error) {
        console.error(`Error cleaning up resource ${id}:`, error);
      }
    }

    this.resources.set(id, cleanup);
  }

  unregister(id: string): boolean {
    const cleanup = this.resources.get(id);
    if (cleanup) {
      try {
        cleanup();
      } catch (error) {
        console.error(`Error cleaning up resource ${id}:`, error);
      }
      return this.resources.delete(id);
    }
    return false;
  }

  cleanup(pattern?: RegExp): void {
    const toCleanup = pattern 
      ? Array.from(this.resources.keys()).filter(id => pattern.test(id))
      : Array.from(this.resources.keys());

    toCleanup.forEach(id => {
      this.unregister(id);
    });
  }

  destroy(): void {
    this.cleanup();
    this.resources.clear();
  }

  get size(): number {
    return this.resources.size;
  }

  getResourceIds(): string[] {
    return Array.from(this.resources.keys());
  }
}

/**
 * Hook for resource management
 */
export function useResourceManager() {
  const manager = useMemo(() => new ResourceManager(), []);
  const { addCleanup } = useCleanup();

  useEffect(() => {
    addCleanup(() => {
      manager.destroy();
    });
  }, [addCleanup, manager]);

  return manager;
}

/**
 * Memory-safe interval hook
 */
export function useMemorySafeInterval(
  callback: () => void,
  delay: number | null,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout>();
  const { addCleanup } = useCleanup();

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const tick = () => {
      try {
        callbackRef.current();
      } catch (error) {
        console.error('Interval callback error:', error);
      }
    };

    intervalRef.current = setInterval(tick, delay);

    const cleanup = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    addCleanup(cleanup);
    return cleanup;
  }, [delay, addCleanup]);
}

/**
 * Async operation manager with cancellation
 */
export class AsyncOperationManager {
  private operations = new Map<string, AbortController>();

  start(id: string): AbortSignal {
    // Cancel existing operation if it exists
    this.cancel(id);

    const controller = new AbortController();
    this.operations.set(id, controller);

    return controller.signal;
  }

  cancel(id: string): boolean {
    const controller = this.operations.get(id);
    if (controller) {
      controller.abort();
      return this.operations.delete(id);
    }
    return false;
  }

  cancelAll(): void {
    this.operations.forEach((controller, id) => {
      controller.abort();
    });
    this.operations.clear();
  }

  isActive(id: string): boolean {
    const controller = this.operations.get(id);
    return controller ? !controller.signal.aborted : false;
  }

  get activeCount(): number {
    return Array.from(this.operations.values()).filter(
      controller => !controller.signal.aborted
    ).length;
  }

  destroy(): void {
    this.cancelAll();
  }
}

/**
 * Hook for managing async operations
 */
export function useAsyncOperations() {
  const manager = useMemo(() => new AsyncOperationManager(), []);
  const { addCleanup } = useCleanup();

  useEffect(() => {
    addCleanup(() => {
      manager.destroy();
    });
  }, [addCleanup, manager]);

  return manager;
}

/**
 * Performance-aware component wrapper
 */
interface MemoryOptimizedProps {
  children: React.ReactNode;
  maxMemoryUsage?: number; // MB
  cleanupInterval?: number; // ms
  onMemoryWarning?: () => void;
}

export function MemoryOptimized({
  children,
  maxMemoryUsage = 150,
  cleanupInterval = 30000, // 30 seconds
  onMemoryWarning
}: MemoryOptimizedProps) {
  const [shouldRender, setShouldRender] = useState(true);
  const { addCleanup, runCleanup } = useCleanup();
  const memoryInfo = useMemoryMonitoring({
    warningThreshold: maxMemoryUsage,
    onWarning: () => {
      onMemoryWarning?.();
      // Force garbage collection if available
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
      }
    }
  });

  // Periodic cleanup
  useMemorySafeInterval(() => {
    runCleanup();
    
    // Force re-render to clean up any lingering references
    setShouldRender(false);
    setTimeout(() => setShouldRender(true), 0);
  }, cleanupInterval);

  if (!shouldRender) {
    return null;
  }

  return (
    <div data-memory-optimized="true">
      {children}
      {process.env.NODE_ENV === 'development' && memoryInfo && (
        <div className="fixed bottom-4 right-4 text-xs bg-black text-white p-2 rounded opacity-50">
          Memory: {memoryInfo.used.toFixed(1)}MB / {memoryInfo.limit.toFixed(0)}MB
        </div>
      )}
    </div>
  );
}

/**
 * Hook for detecting memory leaks during development
 */
export function useMemoryLeakDetection(componentName: string) {
  const mountTime = useRef(Date.now());
  const { addCleanup } = useCleanup();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Component mounted`);
      
      const checkForLeaks = () => {
        const lifetime = Date.now() - mountTime.current;
        if (lifetime > 300000) { // 5 minutes
          console.warn(`[${componentName}] Component has been alive for ${lifetime}ms - potential memory leak?`);
        }
      };

      const interval = setInterval(checkForLeaks, 60000); // Check every minute
      addCleanup(() => {
        clearInterval(interval);
        console.log(`[${componentName}] Component unmounted after ${Date.now() - mountTime.current}ms`);
      });
    }
  }, [componentName, addCleanup]);
}