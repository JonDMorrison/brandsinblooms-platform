/**
 * Domain types for multi-domain support
 */

export type DomainStatus = 'pending' | 'verified' | 'active' | 'failed'

export interface Domain {
    id: string
    site_id: string
    hostname: string
    is_primary: boolean
    status: DomainStatus
    verified_at: string | null
    created_at: string
    updated_at: string
}

export interface CreateDomainInput {
    site_id: string
    hostname: string
    is_primary?: boolean
}

export interface UpdateDomainInput {
    hostname?: string
    is_primary?: boolean
    status?: DomainStatus
}

/**
 * Validate hostname format
 */
export function isValidHostname(hostname: string): boolean {
    // Basic hostname validation
    const hostnameRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i
    return hostnameRegex.test(hostname)
}

/**
 * Normalize hostname (lowercase, remove protocol, trailing slash)
 */
export function normalizeHostname(hostname: string): string {
    return hostname
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .trim()
}

/**
 * Get domain status badge variant
 */
export function getDomainStatusVariant(status: DomainStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'active':
            return 'default'
        case 'verified':
            return 'secondary'
        case 'pending':
            return 'outline'
        case 'failed':
            return 'destructive'
        default:
            return 'outline'
    }
}
