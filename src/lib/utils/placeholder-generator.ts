/**
 * SVG placeholder generator utilities for the Brands in Blooms platform
 * Enhanced with memory-efficient caching and performance optimizations
 */

import {
  type PlaceholderParams,
  type GradientConfig,
  type PatternConfig,
  type IconConfig,
  DEFAULT_CONFIGS,
  SVG_ICONS,
  validateDimensions,
  PLACEHOLDER_CONSTRAINTS,
} from '@/src/lib/types/placeholder';
import { handleError } from '@/src/lib/types/error-handling';

/**
 * Cache configuration for placeholder generation
 */
export interface PlaceholderCacheConfig {
  /** Maximum number of cached placeholders */
  maxCacheSize: number;
  /** Time to live for cached items (ms) */
  ttl: number;
  /** Enable LRU eviction */
  enableLRU: boolean;
  /** Enable memory pressure cleanup */
  enableMemoryCleanup: boolean;
  /** Maximum memory usage estimate (MB) */
  maxMemoryUsage: number;
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: PlaceholderCacheConfig = {
  maxCacheSize: 100,
  ttl: 10 * 60 * 1000, // 10 minutes
  enableLRU: true,
  enableMemoryCleanup: true,
  maxMemoryUsage: 5, // 5MB
};

/**
 * Cache entry for generated placeholders
 */
interface CacheEntry {
  svg: string;
  dataUrl: string;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  memorySize: number; // Estimated size in bytes
}

/**
 * Performance metrics for placeholder generation
 */
export interface PlaceholderMetrics {
  cacheHits: number;
  cacheMisses: number;
  totalGenerations: number;
  averageGenerationTime: number;
  cacheSize: number;
  memoryUsage: number; // In bytes
  evictions: number;
}

/**
 * Memory-efficient placeholder cache with LRU eviction
 */
class PlaceholderCache {
  private cache = new Map<string, CacheEntry>();
  private config: PlaceholderCacheConfig;
  private metrics: PlaceholderMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    totalGenerations: 0,
    averageGenerationTime: 0,
    cacheSize: 0,
    memoryUsage: 0,
    evictions: 0,
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<PlaceholderCacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.startPeriodicCleanup();
    this.setupMemoryPressureHandler();
  }

  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.cacheMisses++;
      return undefined;
    }

    // Check TTL
    const age = Date.now() - entry.createdAt;
    if (age > this.config.ttl) {
      this.cache.delete(key);
      this.updateCacheMetrics();
      this.metrics.cacheMisses++;
      return undefined;
    }

    // Update access tracking for LRU
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.metrics.cacheHits++;
    
    return entry;
  }

  set(key: string, svg: string, dataUrl: string): void {
    // Estimate memory size
    const memorySize = this.estimateMemorySize(svg, dataUrl);
    
    // Check if we need to evict before adding
    this.ensureCapacity(memorySize);

    const entry: CacheEntry = {
      svg,
      dataUrl,
      createdAt: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      memorySize,
    };

    this.cache.set(key, entry);
    this.updateCacheMetrics();
  }

  clear(): void {
    this.cache.clear();
    this.updateCacheMetrics();
  }

  getMetrics(): PlaceholderMetrics {
    return { ...this.metrics };
  }

  dispose(): void {
    this.clear();
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  private estimateMemorySize(svg: string, dataUrl: string): number {
    // Rough estimate: characters * 2 bytes (UTF-16) + overhead
    return (svg.length + dataUrl.length) * 2 + 200; // 200 bytes overhead
  }

  private ensureCapacity(newItemSize: number): void {
    // Check memory limit
    const maxBytes = this.config.maxMemoryUsage * 1024 * 1024;
    
    while (this.metrics.memoryUsage + newItemSize > maxBytes ||
           this.cache.size >= this.config.maxCacheSize) {
      if (!this.evictLRUItem()) {
        break; // No more items to evict
      }
    }
  }

  private evictLRUItem(): boolean {
    if (this.cache.size === 0) {
      return false;
    }

    let lruKey: string | null = null;
    let oldestAccess = Date.now();

    // Find least recently used item
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.metrics.evictions++;
      this.updateCacheMetrics();
      return true;
    }

    return false;
  }

  private updateCacheMetrics(): void {
    this.metrics.cacheSize = this.cache.size;
    this.metrics.memoryUsage = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.memorySize, 0);
  }

  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Every minute
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.createdAt;
      if (age > this.config.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      this.updateCacheMetrics();
    }
  }

  private setupMemoryPressureHandler(): void {
    if (!this.config.enableMemoryCleanup) {
      return;
    }

    // Listen for memory pressure events if supported
    if (typeof window !== 'undefined' && 'memory' in performance) {
      try {
        // @ts-ignore - Experimental API
        performance.addEventListener('memorypressure', () => {
          this.handleMemoryPressure();
        });
      } catch (error: unknown) {
        // Memory pressure API not supported
        console.debug('Memory pressure API not supported:', handleError(error));
      }
    }
  }

  private handleMemoryPressure(): void {
    // Aggressively clean cache on memory pressure
    const targetSize = Math.floor(this.cache.size * 0.3); // Keep 30%
    
    while (this.cache.size > targetSize) {
      if (!this.evictLRUItem()) {
        break;
      }
    }
  }
}

// Global cache instance
let globalCache: PlaceholderCache | null = null;

/**
 * Get the global placeholder cache instance
 */
function getCache(): PlaceholderCache {
  if (!globalCache) {
    globalCache = new PlaceholderCache();
  }
  return globalCache;
}

/**
 * Generates a gradient SVG placeholder
 */
export function generateGradientSVG(
  width: number,
  height: number,
  config: Partial<GradientConfig> = {}
): string {
  const validation = validateDimensions(width, height);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const finalConfig = {
    ...DEFAULT_CONFIGS.gradient,
    ...config,
  } as GradientConfig;

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  let x1 = '0%', y1 = '0%', x2 = '100%', y2 = '100%';
  
  switch (finalConfig.direction) {
    case 'horizontal':
      x1 = '0%'; y1 = '0%'; x2 = '100%'; y2 = '0%';
      break;
    case 'vertical':
      x1 = '0%'; y1 = '0%'; x2 = '0%'; y2 = '100%';
      break;
    case 'diagonal':
    default:
      x1 = '0%'; y1 = '0%'; x2 = '100%'; y2 = '100%';
      break;
  }

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${gradientId}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
        <stop offset="0%" stop-color="${finalConfig.colors[0]}" />
        <stop offset="100%" stop-color="${finalConfig.colors[1]}" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#${gradientId})" />
  </svg>`;
}

/**
 * Generates a pattern SVG placeholder
 */
export function generatePatternSVG(
  width: number,
  height: number,
  config: Partial<PatternConfig> = {}
): string {
  const validation = validateDimensions(width, height);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const finalConfig = {
    ...DEFAULT_CONFIGS.pattern,
    ...config,
  } as PatternConfig;

  const patternId = `pattern-${Math.random().toString(36).substr(2, 9)}`;
  const scale = finalConfig.scale || 1;

  let patternElement = '';

  switch (finalConfig.pattern) {
    case 'dots':
      patternElement = `
        <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${20 * scale}" height="${20 * scale}">
          <rect width="100%" height="100%" fill="${finalConfig.primaryColor}" />
          <circle cx="${10 * scale}" cy="${10 * scale}" r="${3 * scale}" fill="${finalConfig.secondaryColor}" />
        </pattern>
      `;
      break;
    case 'grid':
      patternElement = `
        <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${20 * scale}" height="${20 * scale}">
          <rect width="100%" height="100%" fill="${finalConfig.primaryColor}" />
          <path d="M ${20 * scale} 0 L 0 0 0 ${20 * scale}" fill="none" stroke="${finalConfig.secondaryColor}" stroke-width="${1 * scale}" />
        </pattern>
      `;
      break;
    case 'waves':
      patternElement = `
        <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${40 * scale}" height="${20 * scale}">
          <rect width="100%" height="100%" fill="${finalConfig.primaryColor}" />
          <path d="M0,${10 * scale} Q${10 * scale},0 ${20 * scale},${10 * scale} T${40 * scale},${10 * scale}" 
                fill="none" stroke="${finalConfig.secondaryColor}" stroke-width="${2 * scale}" />
        </pattern>
      `;
      break;
    case 'stripes':
      patternElement = `
        <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${20 * scale}" height="${20 * scale}">
          <rect width="100%" height="100%" fill="${finalConfig.primaryColor}" />
          <rect x="0" y="0" width="${10 * scale}" height="${20 * scale}" fill="${finalConfig.secondaryColor}" />
        </pattern>
      `;
      break;
    default:
      patternElement = `
        <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${20 * scale}" height="${20 * scale}">
          <rect width="100%" height="100%" fill="${finalConfig.primaryColor}" />
        </pattern>
      `;
  }

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${patternElement}
    </defs>
    <rect width="100%" height="100%" fill="url(#${patternId})" />
  </svg>`;
}

/**
 * Generates an icon SVG placeholder
 */
export function generateIconSVG(
  width: number,
  height: number,
  config: Partial<IconConfig> = {}
): string {
  const validation = validateDimensions(width, height);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const finalConfig = {
    ...DEFAULT_CONFIGS.icon,
    ...config,
  } as IconConfig;

  const iconPath = SVG_ICONS[finalConfig.icon] || SVG_ICONS.image;
  const iconSize = (finalConfig.size || 50) / 100;
  const iconDimension = Math.min(width, height) * iconSize;
  const iconX = (width - iconDimension) / 2;
  const iconY = (height - iconDimension) / 2;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${finalConfig.backgroundColor}" />
    <g transform="translate(${iconX}, ${iconY})">
      <svg width="${iconDimension}" height="${iconDimension}" viewBox="0 0 24 24" fill="none">
        <path d="${iconPath}" stroke="${finalConfig.iconColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </g>
  </svg>`;
}

/**
 * Main function to generate placeholder SVG based on parameters
 */
export function generatePlaceholderSVG(params: PlaceholderParams): string {
  const { width, height, type, config = {} } = params;

  // Apply defaults for dimensions if not provided
  const finalWidth = width || PLACEHOLDER_CONSTRAINTS.DEFAULT_WIDTH;
  const finalHeight = height || PLACEHOLDER_CONSTRAINTS.DEFAULT_HEIGHT;

  switch (type) {
    case 'gradient':
      return generateGradientSVG(finalWidth, finalHeight, config as Partial<GradientConfig>);
    case 'pattern':
      return generatePatternSVG(finalWidth, finalHeight, config as Partial<PatternConfig>);
    case 'icon':
      return generateIconSVG(finalWidth, finalHeight, config as Partial<IconConfig>);
    default:
      throw new Error(`Unknown placeholder type: ${type}`);
  }
}

/**
 * Generates cache-friendly headers for immutable placeholders
 */
export function getPlaceholderHeaders(): Record<string, string> {
  return {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache
    'ETag': `"${Date.now()}"`,
    'Last-Modified': new Date().toUTCString(),
  };
}

/**
 * Parses URL parameters into placeholder parameters
 */
export function parseUrlParams(params: string[]): PlaceholderParams {
  // Expected format: [width, height, type, ...configParams]
  if (params.length < 3) {
    throw new Error('Invalid parameters. Expected: width/height/type[/config...]');
  }

  const width = parseInt(params[0], 10);
  const height = parseInt(params[1], 10);
  const type = params[2];

  if (isNaN(width) || isNaN(height)) {
    throw new Error('Width and height must be valid numbers');
  }

  if (!['gradient', 'pattern', 'icon'].includes(type)) {
    throw new Error(`Invalid type: ${type}. Must be 'gradient', 'pattern', or 'icon'`);
  }

  // Parse additional config parameters
  let config = {};
  
  if (params.length > 3) {
    try {
      // Join remaining params and decode URI component
      const configString = params.slice(3).join('/');
      const decodedConfig = decodeURIComponent(configString);
      config = JSON.parse(decodedConfig);
    } catch (error: unknown) {
      // If config parsing fails, use defaults
      console.warn('Failed to parse config parameters, using defaults:', error);
    }
  }

  return {
    width,
    height,
    type: type as 'gradient' | 'pattern' | 'icon',
    config,
  };
}

/**
 * Creates a deterministic cache key for placeholder parameters
 */
export function createCacheKey(params: PlaceholderParams): string {
  const { width, height, type, config } = params;
  // Sort config keys to ensure consistent cache keys
  const sortedConfig = config ? 
    Object.keys(config).sort().reduce((sorted: Record<string, unknown>, key) => {
      sorted[key] = config[key as keyof typeof config];
      return sorted;
    }, {}) : {};
  
  const configString = JSON.stringify(sortedConfig);
  
  // Use a more efficient hashing approach for larger configs
  if (typeof window !== 'undefined') {
    return `placeholder-${width}x${height}-${type}-${btoa(configString).replace(/[+/=]/g, '')}`;
  } else {
    return `placeholder-${width}x${height}-${type}-${Buffer.from(configString).toString('base64').replace(/[+/=]/g, '')}`;
  }
}

/**
 * Enhanced placeholder generation with caching
 */
export function generatePlaceholderSVGCached(params: PlaceholderParams): {
  svg: string;
  dataUrl: string;
  fromCache: boolean;
  generationTime: number;
} {
  const startTime = performance.now();
  const cache = getCache();
  const cacheKey = createCacheKey(params);
  
  // Try to get from cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return {
      svg: cached.svg,
      dataUrl: cached.dataUrl,
      fromCache: true,
      generationTime: performance.now() - startTime,
    };
  }

  // Generate new placeholder
  const svg = generatePlaceholderSVG(params);
  
  // Convert to data URL
  let dataUrl: string;
  if (typeof window !== 'undefined') {
    dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
  } else {
    dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  // Cache the result
  cache.set(cacheKey, svg, dataUrl);
  
  const generationTime = performance.now() - startTime;
  
  // Update metrics
  const metrics = cache.getMetrics();
  cache['metrics'].totalGenerations++;
  const totalTime = (metrics.averageGenerationTime * (metrics.totalGenerations - 1)) + generationTime;
  cache['metrics'].averageGenerationTime = totalTime / metrics.totalGenerations;

  return {
    svg,
    dataUrl,
    fromCache: false,
    generationTime,
  };
}

/**
 * Get placeholder cache metrics
 */
export function getPlaceholderCacheMetrics(): PlaceholderMetrics {
  return getCache().getMetrics();
}

/**
 * Clear placeholder cache
 */
export function clearPlaceholderCache(): void {
  getCache().clear();
}

/**
 * Configure placeholder cache
 */
export function configurePlaceholderCache(config: Partial<PlaceholderCacheConfig>): void {
  if (globalCache) {
    globalCache.dispose();
  }
  globalCache = new PlaceholderCache(config);
}