/**
 * Domain Analytics Tracking Service
 * Handles pageview tracking and analytics aggregation
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/src/lib/database/types'

export interface PageviewData {
    path: string
    referrer?: string
    userAgent?: string
    sessionId: string
    userId?: string
}

export interface DomainAnalytics {
    id: string
    domain_id: string
    site_id: string
    date: string
    pageviews: number
    unique_visitors: number
    sessions: number
    bounce_rate: number | null
    avg_session_duration: number | null
    created_at: string
    updated_at: string
}

/**
 * Track a pageview event
 */
export async function trackPageview(
    client: SupabaseClient<Database>,
    data: {
        domainId?: string
        siteId: string
        path: string
        referrer?: string
        userAgent?: string
        sessionId: string
        userId?: string
        ipAddress?: string
    }
): Promise<void> {
    try {
        await client
            .from('domain_events')
            .insert({
                domain_id: data.domainId || null,
                site_id: data.siteId,
                event_type: 'pageview',
                path: data.path,
                referrer: data.referrer,
                user_agent: data.userAgent,
                session_id: data.sessionId,
                user_id: data.userId || null,
                ip_address: data.ipAddress || null
            })
    } catch (error) {
        console.error('Failed to track pageview:', error)
        // Don't throw - tracking failures shouldn't break the app
    }
}

/**
 * Get analytics for a domain
 */
export async function getDomainAnalytics(
    client: SupabaseClient<Database>,
    domainId: string,
    options?: {
        startDate?: string
        endDate?: string
        limit?: number
    }
): Promise<DomainAnalytics[]> {
    let query = client
        .from('domain_analytics')
        .select('*')
        .eq('domain_id', domainId)
        .order('date', { ascending: false })

    if (options?.startDate) {
        query = query.gte('date', options.startDate)
    }

    if (options?.endDate) {
        query = query.lte('date', options.endDate)
    }

    if (options?.limit) {
        query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
        throw new Error(`Failed to fetch analytics: ${error.message}`)
    }

    return data as DomainAnalytics[]
}

/**
 * Get analytics for a site (all domains)
 */
export async function getSiteAnalytics(
    client: SupabaseClient<Database>,
    siteId: string,
    options?: {
        startDate?: string
        endDate?: string
        limit?: number
    }
): Promise<DomainAnalytics[]> {
    let query = client
        .from('domain_analytics')
        .select('*')
        .eq('site_id', siteId)
        .order('date', { ascending: false })

    if (options?.startDate) {
        query = query.gte('date', options.startDate)
    }

    if (options?.endDate) {
        query = query.lte('date', options.endDate)
    }

    if (options?.limit) {
        query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
        throw new Error(`Failed to fetch analytics: ${error.message}`)
    }

    return data as DomainAnalytics[]
}

/**
 * Get real-time stats for today
 */
export async function getTodayStats(
    client: SupabaseClient<Database>,
    domainId: string
): Promise<{
    pageviews: number
    uniqueVisitors: number
    sessions: number
}> {
    const today = new Date().toISOString().split('T')[0]

    // Get pageviews
    const { count: pageviews } = await client
        .from('domain_events')
        .select('*', { count: 'exact', head: true })
        .eq('domain_id', domainId)
        .gte('created_at', `${today}T00:00:00Z`)
        .eq('event_type', 'pageview')

    // Get unique sessions
    const { data: sessions } = await client
        .from('domain_events')
        .select('session_id')
        .eq('domain_id', domainId)
        .gte('created_at', `${today}T00:00:00Z`)
        .eq('event_type', 'pageview')

    const uniqueSessions = new Set(sessions?.map(s => s.session_id) || []).size

    return {
        pageviews: pageviews || 0,
        uniqueVisitors: uniqueSessions, // Approximation
        sessions: uniqueSessions
    }
}

/**
 * Helper to get date N days ago
 */
export function getDateDaysAgo(days: number): string {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
}

/**
 * Calculate average bounce rate
 */
export function calculateAvgBounceRate(analytics: DomainAnalytics[]): number {
    if (analytics.length === 0) return 0

    const validRates = analytics
        .filter(a => a.bounce_rate !== null)
        .map(a => a.bounce_rate as number)

    if (validRates.length === 0) return 0

    const sum = validRates.reduce((acc, rate) => acc + rate, 0)
    return Math.round(sum / validRates.length)
}

/**
 * Format analytics data for charts
 */
export function formatAnalyticsForChart(analytics: DomainAnalytics[]) {
    return analytics.map(a => ({
        date: a.date,
        pageviews: a.pageviews,
        visitors: a.unique_visitors,
        sessions: a.sessions
    })).reverse() // Oldest first for charts
}
