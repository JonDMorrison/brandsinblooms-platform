/**
 * Custom domain field type extensions for the sites table
 * These types extend the auto-generated database types
 */

import type { Json } from './types'

export interface SiteCustomDomainFields {
  custom_domain_status: 'not_started' | 'pending_verification' | 'verified' | 'failed' | 'disconnected' | null
  dns_provider: string | null
  dns_verification_token: string | null
  dns_records: Json | null
  last_dns_check_at: string | null
  custom_domain_verified_at: string | null
  custom_domain_error: string | null
}

// Type guard to check if a site has custom domain fields
export function hasCustomDomainFields(site: unknown): site is SiteCustomDomainFields {
  if (typeof site !== 'object' || site === null) {
    return false
  }

  const s = site as Record<string, unknown>
  return 'custom_domain_status' in s
}

// Helper to get typed DNS records
export function getDnsRecords(site: SiteCustomDomainFields): DnsRecordsJson | null {
  if (!site.dns_records) return null
  return site.dns_records as DnsRecordsJson
}

interface DnsRecordsJson {
  cname: {
    type: 'CNAME'
    name: string
    value: string
    ttl: number
  }
  txt: {
    type: 'TXT'
    name: string
    value: string
    ttl: number
  }
}