// Performance utilities and optimizations

/**
 * Debounce function to limit the rate at which a function can fire
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function to ensure a function is called at most once in a specified period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * RequestIdleCallback polyfill for browsers that don't support it
 */
export const requestIdleCallback =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? window.requestIdleCallback
    : (callback: IdleRequestCallback) => {
        const start = Date.now()
        return setTimeout(() => {
          callback({
            didTimeout: false,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
          } as IdleDeadline)
        }, 1)
      }

/**
 * Cancel idle callback
 */
export const cancelIdleCallback =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? window.cancelIdleCallback
    : clearTimeout

/**
 * Defer non-critical work to idle time
 */
export function deferToIdle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  return function executedFunction(...args: Parameters<T>) {
    requestIdleCallback(() => func(...args))
  }
}

/**
 * Memoize expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = func(...args)
    cache.set(key, result)
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      if (firstKey !== undefined) {
        cache.delete(firstKey)
      }
    }

    return result
  }) as T
}

/**
 * Web Vitals thresholds based on Google's recommendations
 */
const WEB_VITALS_THRESHOLDS = {
  // First Contentful Paint (FCP) - milliseconds
  FCP: { good: 1800, poor: 3000 },
  // Largest Contentful Paint (LCP) - milliseconds
  LCP: { good: 2500, poor: 4000 },
  // First Input Delay (FID) - milliseconds
  FID: { good: 100, poor: 300 },
  // Cumulative Layout Shift (CLS) - score
  CLS: { good: 0.1, poor: 0.25 },
  // Interaction to Next Paint (INP) - milliseconds
  INP: { good: 200, poor: 500 },
  // Time to First Byte (TTFB) - milliseconds
  TTFB: { good: 800, poor: 1800 },
} as const

type MetricName = keyof typeof WEB_VITALS_THRESHOLDS
type Rating = 'good' | 'needs-improvement' | 'poor'

/**
 * Get performance rating based on metric value and thresholds
 */
export function getRating(metricName: string, value: number): Rating {
  const metric = metricName.toUpperCase() as MetricName
  const thresholds = WEB_VITALS_THRESHOLDS[metric]
  
  if (!thresholds) {
    return 'needs-improvement'
  }

  if (value <= thresholds.good) {
    return 'good'
  } else if (value <= thresholds.poor) {
    return 'needs-improvement'
  } else {
    return 'poor'
  }
}

/**
 * Format metric values for display with appropriate units and precision
 */
export function formatMetricValue(metricName: string, value: number): string {
  const metric = metricName.toUpperCase() as MetricName

  switch (metric) {
    case 'CLS':
      // CLS is a unitless score, show with 3 decimal places
      return value.toFixed(3)
    
    case 'FCP':
    case 'LCP':
    case 'FID':
    case 'INP':
    case 'TTFB':
      // Time-based metrics in milliseconds
      if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}s`
      } else {
        return `${Math.round(value)}ms`
      }
    
    default:
      // Fallback for unknown metrics
      if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}s`
      } else {
        return `${Math.round(value)}ms`
      }
  }
}