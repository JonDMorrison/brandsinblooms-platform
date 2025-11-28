/**
 * DNS Verification Service
 * Checks DNS records for domain verification
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/src/lib/database/types'
import { Domain } from './types'
import { getDomainById } from './queries'

export interface DNSCheckResult {
    success: boolean
    records: {
        a?: string[]
        aaaa?: string[]
        cname?: string[]
        mx?: string[]
        txt?: string[]
    }
    errors?: string[]
    pointsToUs?: boolean
}

/**
 * Verify DNS records for a hostname
 * Note: This is a server-side only function
 */
export async function verifyDNS(hostname: string, expectedIPs?: string[]): Promise<DNSCheckResult> {
    try {
        // Use fetch to call our API endpoint that does DNS resolution
        const response = await fetch(`/api/dns/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hostname, expectedIPs })
        })

        if (!response.ok) {
            throw new Error('DNS verification failed')
        }

        return await response.json()
    } catch (error: any) {
        return {
            success: false,
            records: {},
            errors: [error.message || 'DNS verification failed'],
            pointsToUs: false
        }
    }
}

/**
 * Verify domain DNS and update database
 */
export async function verifyDomainDNS(
    client: SupabaseClient<Database>,
    domainId: string
): Promise<DNSCheckResult> {
    const domain = await getDomainById(client, domainId)
    if (!domain) {
        throw new Error('Domain not found')
    }

    // Perform DNS check
    const result = await verifyDNS(domain.hostname)

    // Update domain with verification results
    const newStatus = result.success && result.pointsToUs ? 'verified' :
        result.success ? 'pending' : 'failed'

    await client
        .from('domains')
        .update({
            dns_checked_at: new Date().toISOString(),
            dns_records: result.records,
            verification_errors: result.errors || [],
            status: newStatus,
            updated_at: new Date().toISOString()
        })
        .eq('id', domainId)

    // Log verification attempt
    await client
        .from('domain_verification_log')
        .insert({
            domain_id: domainId,
            check_type: 'dns',
            status: result.success ? 'success' : 'failed',
            details: result
        })

    return result
}

/**
 * Check if DNS records point to our platform
 */
export function checkDNSPointsToUs(records: DNSCheckResult['records'], expectedIPs: string[]): boolean {
    const aRecords = records.a || []
    const aaaaRecords = records.aaaa || []

    // Check if any A or AAAA record matches our IPs
    const allIPs = [...aRecords, ...aaaaRecords]
    return allIPs.some(ip => expectedIPs.includes(ip))
}

/**
 * Get expected IP addresses for the platform
 */
export function getExpectedIPs(): string[] {
    const ips = process.env.PLATFORM_IPS?.split(',') || []
    return ips.map(ip => ip.trim()).filter(Boolean)
}
