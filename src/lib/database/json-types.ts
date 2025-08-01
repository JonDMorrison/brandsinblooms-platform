import { Json } from './types'

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
  [key: string]: Json | undefined // Replace any with Json
}

export interface ProductFeatures {
  [key: string]: Json | undefined // Replace with Json type compatibility
}

// Additional JSON type definitions for common database JSON fields
export interface ThemeSettings {
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
    text?: string
  }
  typography?: {
    fontFamily?: string
    fontSize?: string
    lineHeight?: string
  }
  layout?: {
    header?: Json
    footer?: Json
    sidebar?: Json
  }
  [key: string]: Json | undefined
}

export interface BusinessHours {
  [day: string]: {
    open?: string
    close?: string
    closed?: boolean
  } | undefined
}

export interface ContactInformation {
  phone?: string
  email?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  social?: {
    [platform: string]: string | undefined
  }
  [key: string]: Json | undefined
}

export interface ProductAttributes {
  size?: string | string[]
  color?: string | string[]
  material?: string
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit?: string
  }
  [key: string]: Json | undefined
}

export interface ContentMetadata {
  excerpt?: string
  featured_image?: string
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
  }
  author?: {
    name?: string
    bio?: string
    avatar?: string
  }
  [key: string]: Json | undefined
}

// Type guard functions
export function isPerformanceMetricsData(data: unknown): data is PerformanceMetricsData {
  return typeof data === 'object' && data !== null
}

export function isProductFeatures(data: unknown): data is ProductFeatures {
  return typeof data === 'object' && data !== null
}