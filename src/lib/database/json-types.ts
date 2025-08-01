// Define specific types for Json columns
export interface PerformanceMetricsData {
  performance?: {
    score: number
    change: number
    trend: 'up' | 'down' | 'neutral'
  }
  page_load?: {
    score: number
    change: number
    trend: 'up' | 'down' | 'neutral'
  }
  seo?: {
    score: number
    change: number
    trend: 'up' | 'down' | 'neutral'
  }
  mobile?: {
    score: number
    change: number
    trend: 'up' | 'down' | 'neutral'
  }
  security?: {
    score: number
    change: number
    trend: 'up' | 'down' | 'neutral'
  }
  accessibility?: {
    score: number
    change: number
    trend: 'up' | 'down' | 'neutral'
  }
  [key: string]: any // Add index signature for Json compatibility
}

export interface ProductFeatures {
  [key: string]: string | boolean | number
}

// Type guard functions
export function isPerformanceMetricsData(data: unknown): data is PerformanceMetricsData {
  return typeof data === 'object' && data !== null
}

export function isProductFeatures(data: unknown): data is ProductFeatures {
  return typeof data === 'object' && data !== null
}