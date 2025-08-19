/**
 * Image preloading utilities for the Brands in Blooms platform
 * Optimized for performance with priority-based loading and resource management
 */

import { handleError } from '@/lib/types/error-handling';
import { validateImageUrl, type RetryConfig, DEFAULT_RETRY_CONFIG } from './image-helpers';

/**
 * Priority levels for image preloading
 */
export type PreloadPriority = 'critical' | 'high' | 'normal' | 'low';

/**
 * Preload strategy configuration
 */
export interface PreloadStrategy {
  /** Maximum number of concurrent preloads */
  maxConcurrent: number;
  /** Delay between preload batches (ms) */
  batchDelay: number;
  /** Whether to use high priority hint */
  useHighPriority: boolean;
  /** Whether to prefetch (vs preload) */
  usePrefetch: boolean;
  /** Memory management settings */
  memoryManagement: {
    /** Maximum number of cached images */
    maxCachedImages: number;
    /** Time to keep images in cache (ms) */
    cacheTimeout: number;
    /** Enable cache cleanup on memory pressure */
    enableCleanup: boolean;
  };
}

/**
 * Default preload strategy
 */
export const DEFAULT_PRELOAD_STRATEGY: PreloadStrategy = {
  maxConcurrent: 3,
  batchDelay: 100,
  useHighPriority: true,
  usePrefetch: false,
  memoryManagement: {
    maxCachedImages: 50,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    enableCleanup: true,
  },
};

/**
 * Preload request configuration
 */
export interface PreloadRequest {
  /** Image URL to preload */
  url: string;
  /** Preload priority */
  priority: PreloadPriority;
  /** Optional sizes hint for responsive images */
  sizes?: string;
  /** Optional source set for responsive images */
  srcset?: string;
  /** Retry configuration */
  retryConfig?: Partial<RetryConfig>;
  /** Custom fetch options */
  fetchOptions?: RequestInit;
  /** Callback when preloading starts */
  onStart?: () => void;
  /** Callback when preloading completes */
  onComplete?: (success: boolean) => void;
  /** Callback for preload progress (if supported) */
  onProgress?: (loaded: number, total: number) => void;
}

/**
 * Preload result
 */
export interface PreloadResult {
  /** The preloaded image element */
  image: HTMLImageElement;
  /** Time taken to preload (ms) */
  loadTime: number;
  /** Whether preload was successful */
  success: boolean;
  /** Any error that occurred */
  error?: Error;
  /** Cache hit indicator */
  fromCache: boolean;
}

/**
 * Cache entry for preloaded images
 */
interface CacheEntry {
  image: HTMLImageElement;
  timestamp: number;
  url: string;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Queue item for preload management
 */
interface QueueItem {
  request: PreloadRequest;
  resolve: (result: PreloadResult) => void;
  reject: (error: Error) => void;
  addedAt: number;
}

/**
 * Performance metrics for preloading
 */
export interface PreloadMetrics {
  /** Total preload requests */
  totalRequests: number;
  /** Successful preloads */
  successfulPreloads: number;
  /** Failed preloads */
  failedPreloads: number;
  /** Cache hits */
  cacheHits: number;
  /** Average load time */
  averageLoadTime: number;
  /** Current queue size */
  queueSize: number;
  /** Active preloads */
  activePreloads: number;
  /** Memory usage estimate (number of cached images) */
  memoryUsage: number;
}

/**
 * Priority order for queue processing
 */
const PRIORITY_ORDER: Record<PreloadPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/**
 * Advanced image preloader with priority queue and caching
 */
export class ImagePreloader {
  private cache = new Map<string, CacheEntry>();
  private queue: QueueItem[] = [];
  private activePreloads = 0;
  private strategy: PreloadStrategy;
  private metrics: PreloadMetrics = {
    totalRequests: 0,
    successfulPreloads: 0,
    failedPreloads: 0,
    cacheHits: 0,
    averageLoadTime: 0,
    queueSize: 0,
    activePreloads: 0,
    memoryUsage: 0,
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(strategy: Partial<PreloadStrategy> = {}) {
    this.strategy = { ...DEFAULT_PRELOAD_STRATEGY, ...strategy };
    this.startCacheCleanup();
    
    // Monitor memory pressure if supported
    if (this.strategy.memoryManagement.enableCleanup && 'memory' in performance) {
      this.setupMemoryPressureHandler();
    }
  }

  /**
   * Preload a single image with priority and caching
   */
  async preload(request: PreloadRequest): Promise<PreloadResult> {
    const startTime = performance.now();
    this.metrics.totalRequests++;

    // Validate URL
    const validation = validateImageUrl(request.url);
    if (!validation.isValid) {
      const error = new Error(`Invalid URL: ${validation.error}`);
      this.metrics.failedPreloads++;
      throw error;
    }

    // Check cache first
    const cached = this.getCached(request.url);
    if (cached) {
      this.metrics.cacheHits++;
      cached.accessCount++;
      cached.lastAccessed = Date.now();
      
      return {
        image: cached.image,
        loadTime: performance.now() - startTime,
        success: true,
        fromCache: true,
      };
    }

    // Add to queue if we're at max concurrent
    if (this.activePreloads >= this.strategy.maxConcurrent) {
      return this.queuePreload(request);
    }

    // Execute immediately
    return this.executePreload(request, startTime);
  }

  /**
   * Preload multiple images with intelligent batching
   */
  async preloadBatch(requests: PreloadRequest[]): Promise<PreloadResult[]> {
    // Sort by priority
    const sortedRequests = [...requests].sort((a, b) => 
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    );

    const results: PreloadResult[] = [];
    
    // Process in batches
    for (let i = 0; i < sortedRequests.length; i += this.strategy.maxConcurrent) {
      const batch = sortedRequests.slice(i, i + this.strategy.maxConcurrent);
      
      // Execute batch concurrently
      const batchPromises = batch.map(request => this.preload(request));
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Collect results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Create error result
          results.push({
            image: new Image(),
            loadTime: 0,
            success: false,
            error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
            fromCache: false,
          });
        }
      }
      
      // Delay between batches if configured
      if (i + this.strategy.maxConcurrent < sortedRequests.length && this.strategy.batchDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.strategy.batchDelay));
      }
    }

    return results;
  }

  /**
   * Preload critical above-fold images
   */
  async preloadCritical(urls: string[], sizes?: string): Promise<PreloadResult[]> {
    const requests: PreloadRequest[] = urls.map(url => ({
      url,
      priority: 'critical',
      sizes,
      retryConfig: { ...DEFAULT_RETRY_CONFIG, maxRetries: 3 },
    }));

    return this.preloadBatch(requests);
  }

  /**
   * Preload featured product images
   */
  async preloadFeatured(products: Array<{ image: string; name: string }>): Promise<PreloadResult[]> {
    const requests: PreloadRequest[] = products.map(product => ({
      url: product.image,
      priority: 'high',
      sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
      onStart: () => console.log(`Preloading featured product: ${product.name}`),
    }));

    return this.preloadBatch(requests);
  }

  /**
   * Get preloader metrics
   */
  getMetrics(): PreloadMetrics {
    return {
      ...this.metrics,
      queueSize: this.queue.length,
      activePreloads: this.activePreloads,
      memoryUsage: this.cache.size,
    };
  }

  /**
   * Clear the cache manually
   */
  clearCache(): void {
    this.cache.clear();
    this.metrics.memoryUsage = 0;
  }

  /**
   * Pause preloading (useful for low bandwidth scenarios)
   */
  pause(): void {
    // Implementation would stop processing queue
    // For now, we'll just clear the queue
    this.queue = [];
  }

  /**
   * Resume preloading
   */
  resume(): void {
    // Implementation would restart queue processing
    this.processQueue();
  }

  /**
   * Dispose of the preloader and cleanup resources
   */
  dispose(): void {
    this.clearCache();
    this.queue = [];
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  /**
   * Queue a preload request
   */
  private queuePreload(request: PreloadRequest): Promise<PreloadResult> {
    return new Promise((resolve, reject) => {
      const queueItem: QueueItem = {
        request,
        resolve,
        reject,
        addedAt: Date.now(),
      };

      // Insert in priority order
      const insertIndex = this.queue.findIndex(
        item => PRIORITY_ORDER[item.request.priority] > PRIORITY_ORDER[request.priority]
      );

      if (insertIndex === -1) {
        this.queue.push(queueItem);
      } else {
        this.queue.splice(insertIndex, 0, queueItem);
      }

      this.metrics.queueSize = this.queue.length;
    });
  }

  /**
   * Execute a preload request
   */
  private async executePreload(request: PreloadRequest, startTime: number): Promise<PreloadResult> {
    this.activePreloads++;
    this.metrics.activePreloads = this.activePreloads;

    try {
      request.onStart?.();

      const result = await this.loadImage(request, startTime);
      
      // Cache successful loads
      if (result.success) {
        this.setCached(request.url, result.image);
        this.metrics.successfulPreloads++;
      } else {
        this.metrics.failedPreloads++;
      }

      // Update average load time
      const totalLoadTime = (this.metrics.averageLoadTime * (this.metrics.successfulPreloads - 1)) + result.loadTime;
      this.metrics.averageLoadTime = totalLoadTime / this.metrics.successfulPreloads;

      request.onComplete?.(result.success);
      
      return result;
    } finally {
      this.activePreloads--;
      this.metrics.activePreloads = this.activePreloads;
      
      // Process next item in queue
      this.processQueue();
    }
  }

  /**
   * Load an image with retry logic
   */
  private async loadImage(request: PreloadRequest, startTime: number): Promise<PreloadResult> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...request.retryConfig };
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const image = await this.createImageElement(request);
        
        return {
          image,
          loadTime: performance.now() - startTime,
          success: true,
          fromCache: false,
        };
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < retryConfig.maxRetries) {
          const delay = retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      image: new Image(),
      loadTime: performance.now() - startTime,
      success: false,
      error: lastError,
      fromCache: false,
    };
  }

  /**
   * Create image element with proper attributes
   */
  private createImageElement(request: PreloadRequest): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Set up progress tracking if supported
      if (request.onProgress && 'addEventListener' in img) {
        img.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            request.onProgress!(event.loaded, event.total);
          }
        });
      }

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${request.url}`));
      
      // Set attributes for optimization
      if (this.strategy.useHighPriority && request.priority === 'critical') {
        img.fetchPriority = 'high';
      }
      
      if (request.sizes) {
        img.sizes = request.sizes;
      }
      
      if (request.srcset) {
        img.srcset = request.srcset;
      }

      // Apply fetch options via custom headers if supported
      if (request.fetchOptions && 'crossOrigin' in img) {
        img.crossOrigin = request.fetchOptions.mode === 'cors' ? 'anonymous' : null;
      }

      img.src = request.url;
    });
  }

  /**
   * Process the next item in the queue
   */
  private processQueue(): void {
    if (this.queue.length === 0 || this.activePreloads >= this.strategy.maxConcurrent) {
      return;
    }

    const queueItem = this.queue.shift();
    if (queueItem) {
      this.metrics.queueSize = this.queue.length;
      
      this.executePreload(queueItem.request, performance.now())
        .then(queueItem.resolve)
        .catch(queueItem.reject);
    }
  }

  /**
   * Get cached image
   */
  private getCached(url: string): CacheEntry | undefined {
    const entry = this.cache.get(url);
    if (entry) {
      // Check if expired
      const age = Date.now() - entry.timestamp;
      if (age > this.strategy.memoryManagement.cacheTimeout) {
        this.cache.delete(url);
        return undefined;
      }
      return entry;
    }
    return undefined;
  }

  /**
   * Set cached image
   */
  private setCached(url: string, image: HTMLImageElement): void {
    // Check cache size limit
    if (this.cache.size >= this.strategy.memoryManagement.maxCachedImages) {
      this.evictOldestCacheEntry();
    }

    this.cache.set(url, {
      image,
      timestamp: Date.now(),
      url,
      accessCount: 1,
      lastAccessed: Date.now(),
    });

    this.metrics.memoryUsage = this.cache.size;
  }

  /**
   * Evict the oldest cache entry
   */
  private evictOldestCacheEntry(): void {
    let oldestEntry: { key: string; timestamp: number } | null = null;
    
    for (const [key, entry] of this.cache.entries()) {
      if (!oldestEntry || entry.timestamp < oldestEntry.timestamp) {
        oldestEntry = { key, timestamp: entry.timestamp };
      }
    }

    if (oldestEntry) {
      this.cache.delete(oldestEntry.key);
    }
  }

  /**
   * Start periodic cache cleanup
   */
  private startCacheCleanup(): void {
    if (!this.strategy.memoryManagement.enableCleanup) {
      return;
    }

    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const entriesToDelete: string[] = [];

      for (const [key, entry] of this.cache.entries()) {
        const age = now - entry.timestamp;
        if (age > this.strategy.memoryManagement.cacheTimeout) {
          entriesToDelete.push(key);
        }
      }

      for (const key of entriesToDelete) {
        this.cache.delete(key);
      }

      this.metrics.memoryUsage = this.cache.size;
    }, 60000); // Check every minute
  }

  /**
   * Setup memory pressure handler (if supported)
   */
  private setupMemoryPressureHandler(): void {
    // Modern browsers may support memory pressure events
    if ('memory' in performance && 'addEventListener' in performance) {
      try {
        // @ts-ignore - This is experimental API
        performance.addEventListener('memorypressure', () => {
          // Aggressively clean cache on memory pressure
          const cacheSize = this.cache.size;
          const keepCount = Math.floor(cacheSize * 0.3); // Keep 30%
          
          const entries = Array.from(this.cache.entries())
            .sort(([, a], [, b]) => b.lastAccessed - a.lastAccessed);
          
          this.cache.clear();
          
          // Keep most recently accessed entries
          for (let i = 0; i < Math.min(keepCount, entries.length); i++) {
            this.cache.set(entries[i][0], entries[i][1]);
          }
          
          this.metrics.memoryUsage = this.cache.size;
        });
      } catch (error: unknown) {
        // Memory pressure API not supported
        console.debug('Memory pressure API not supported:', handleError(error));
      }
    }
  }
}

/**
 * Singleton instance of the image preloader
 */
let globalPreloader: ImagePreloader | null = null;

/**
 * Get the global image preloader instance
 */
export function getImagePreloader(strategy?: Partial<PreloadStrategy>): ImagePreloader {
  if (!globalPreloader) {
    globalPreloader = new ImagePreloader(strategy);
  }
  return globalPreloader;
}

/**
 * Convenience function to preload critical images
 */
export async function preloadCriticalImages(urls: string[]): Promise<PreloadResult[]> {
  const preloader = getImagePreloader();
  return preloader.preloadCritical(urls);
}

/**
 * Convenience function to preload featured products
 */
export async function preloadFeaturedProducts(
  products: Array<{ image: string; name: string }>
): Promise<PreloadResult[]> {
  const preloader = getImagePreloader();
  return preloader.preloadFeatured(products);
}

/**
 * Preload images for product cards above the fold
 */
export async function preloadAboveFoldProducts(
  products: Array<{ image: string; name: string; featured?: boolean }>,
  maxCount: number = 6
): Promise<PreloadResult[]> {
  const preloader = getImagePreloader();
  
  // Prioritize featured products, then take first N products
  const prioritized = products
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .slice(0, maxCount);

  const requests: PreloadRequest[] = prioritized.map((product, index) => ({
    url: product.image,
    priority: index < 3 ? 'critical' : 'high', // First 3 are critical
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  }));

  return preloader.preloadBatch(requests);
}

/**
 * Hook for React components to use image preloader
 */
export function useImagePreloader() {
  const preloader = getImagePreloader();

  return {
    preload: (request: PreloadRequest) => preloader.preload(request),
    preloadBatch: (requests: PreloadRequest[]) => preloader.preloadBatch(requests),
    preloadCritical: (urls: string[]) => preloader.preloadCritical(urls),
    preloadFeatured: (products: Array<{ image: string; name: string }>) => 
      preloader.preloadFeatured(products),
    getMetrics: () => preloader.getMetrics(),
    clearCache: () => preloader.clearCache(),
    pause: () => preloader.pause(),
    resume: () => preloader.resume(),
  };
}