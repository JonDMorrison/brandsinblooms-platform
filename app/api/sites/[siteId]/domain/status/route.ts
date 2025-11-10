/**
 * Get current custom domain configuration status
 * Returns domain status, DNS records, and next check availability
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { handleError } from '@/lib/types/error-handling'
import type { Json } from '@/lib/database/types'
import { canCheckDns } from '@/src/lib/dns/utils'
import {
  DNS_CHECK_RATE_LIMIT_SECONDS,
  type DomainStatusResult,
  type DnsRecords
} from '@/src/lib/dns/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { siteId } = params

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify site access (owner or member can view status)
    const { data: membership, error: membershipError } = await supabase
      .from('site_memberships')
      .select('role')
      .eq('site_id', siteId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this site' },
        { status: 403 }
      )
    }

    // Get site with domain configuration
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select(`
        custom_domain,
        custom_domain_status,
        dns_provider,
        dns_records,
        last_dns_check_at,
        custom_domain_verified_at,
        custom_domain_error
      `)
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      )
    }

    // Type assertion for new fields until database types are regenerated
    const siteWithCustomFields = site as unknown as {
      custom_domain: string | null
      custom_domain_status: string | null
      dns_provider: string | null
      dns_records: Json | null
      last_dns_check_at: string | null
      custom_domain_verified_at: string | null
      custom_domain_error: string | null
    }

    // Calculate next check availability if not verified
    let nextCheckAvailable: string | undefined
    if (siteWithCustomFields.custom_domain_status !== 'verified' && siteWithCustomFields.last_dns_check_at) {
      const rateLimit = canCheckDns(
        new Date(siteWithCustomFields.last_dns_check_at),
        DNS_CHECK_RATE_LIMIT_SECONDS
      )

      if (!rateLimit.allowed && rateLimit.secondsRemaining) {
        const nextCheckTime = new Date(Date.now() + (rateLimit.secondsRemaining * 1000))
        nextCheckAvailable = nextCheckTime.toISOString()
      }
    }

    // Prepare response
    const result: DomainStatusResult = {
      domain: siteWithCustomFields.custom_domain,
      status: (siteWithCustomFields.custom_domain_status as DomainStatusResult['status']) || 'not_started',
      provider: siteWithCustomFields.dns_provider,
      lastCheckAt: siteWithCustomFields.last_dns_check_at,
      verifiedAt: siteWithCustomFields.custom_domain_verified_at,
      nextCheckAvailable,
      dnsRecords: siteWithCustomFields.dns_records as DnsRecords | null,
      error: siteWithCustomFields.custom_domain_error
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    const errorInfo = handleError(error)
    return NextResponse.json(
      {
        error: 'Failed to get domain status',
        details: errorInfo.message
      },
      { status: 500 }
    )
  }
}