/**
 * Type definitions for Supabase RPC function responses
 * This provides proper typing for JSON returns from RPC functions
 */

import { Json } from './types'

// Admin impersonation types
export interface ImpersonationSessionResponse {
  session_id: string
  session_token: string
  site_id: string
  admin_user_id: string
  impersonated_user_id?: string
  expires_at: string
  allowed_actions?: string[]
}

export interface ImpersonationContext {
  valid: boolean
  session_id: string
  admin_user_id: string
  admin_email: string
  admin_name?: string
  site_id: string
  site_name: string
  site_subdomain: string
  site_custom_domain?: string
  impersonated_user_id?: string
  expires_at: string
  is_active: boolean
}

export interface SessionCleanupResponse {
  success: boolean
  expired_sessions_count: number
  message?: string
}

export interface ContentAnalyticsResponse {
  total_content: number
  published_content: number
  draft_content: number
  content_by_type: Record<string, number>
  recent_content: Array<{
    id: string
    title: string
    content_type: string
    published_at?: string
    views?: number
  }>
}

export interface ProductAnalyticsResponse {
  total_products: number
  active_products: number
  featured_products: number
  out_of_stock_products: number
  products_by_category: Record<string, number>
  price_range: {
    min: number
    max: number
    average: number
  }
}

export interface SiteHealthResponse {
  site_id: string
  is_healthy: boolean
  last_check: string
  uptime_percentage: number
  response_time_avg: number
  ssl_status: 'valid' | 'expiring' | 'expired' | 'invalid'
  domain_status: 'active' | 'pending' | 'failed'
  issues: Array<{
    type: string
    severity: 'critical' | 'warning' | 'info'
    message: string
  }>
}

export interface PlatformAnalyticsSummary {
  total_sites: number
  active_sites: number
  total_users: number
  active_users_today: number
  total_products: number
  total_content: number
  total_orders: number
  revenue_today: number
  trends: {
    sites_growth: number
    users_growth: number
    revenue_growth: number
  }
}

export interface BulkUpdateResponse {
  success: boolean
  updated_count: number
  failed_count: number
  errors?: Array<{
    id: string
    error: string
  }>
}

// Type guards
export function isImpersonationSessionResponse(data: unknown): data is ImpersonationSessionResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'session_token' in data &&
    'session_id' in data &&
    'admin_user_id' in data
  )
}

export function isImpersonationContext(data: unknown): data is ImpersonationContext {
  return (
    typeof data === 'object' &&
    data !== null &&
    'valid' in data &&
    'session_id' in data &&
    'admin_user_id' in data
  )
}

export function isSessionCleanupResponse(data: unknown): data is SessionCleanupResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    'expired_sessions_count' in data
  )
}

// Type assertion helpers
export function assertImpersonationSessionResponse(data: Json): ImpersonationSessionResponse {
  if (!isImpersonationSessionResponse(data)) {
    throw new Error('Invalid impersonation session response')
  }
  return data
}

export function assertImpersonationContext(data: Json): ImpersonationContext {
  if (!isImpersonationContext(data)) {
    throw new Error('Invalid impersonation context')
  }
  return data
}

export function assertSessionCleanupResponse(data: Json): SessionCleanupResponse {
  if (!isSessionCleanupResponse(data)) {
    throw new Error('Invalid session cleanup response')
  }
  return data
}