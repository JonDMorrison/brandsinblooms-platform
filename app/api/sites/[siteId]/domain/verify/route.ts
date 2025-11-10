/**
 * Verify custom domain DNS configuration
 * Checks CNAME and TXT records with rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { handleError } from '@/lib/types/error-handling'
import {
  verifyDnsRecords,
  canCheckDns,
  registerWithCloudflare
} from '@/src/lib/dns/utils'
import {
  DNS_CHECK_RATE_LIMIT_SECONDS,
  type DomainVerificationResult,
  type DnsRecords
} from '@/src/lib/dns/types'
import type { Json } from '@/src/lib/database/types'

export async function POST(
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

    // Verify site ownership
    const { data: membership, error: membershipError } = await supabase
      .from('site_memberships')
      .select('role')
      .eq('site_id', siteId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: Only site owners can verify domains' },
        { status: 403 }
      )
    }

    // Get site with domain configuration
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('custom_domain, custom_domain_status, dns_verification_token, last_dns_check_at, dns_records')
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
      dns_verification_token: string | null
      last_dns_check_at: string | null
      dns_records: Json | null
    }

    // Check if domain initialization is required first
    if (!siteWithCustomFields.custom_domain || siteWithCustomFields.custom_domain_status === 'not_started') {
      return NextResponse.json(
        { error: 'Domain configuration not initialized. Please initialize first.' },
        { status: 400 }
      )
    }

    if (!siteWithCustomFields.dns_verification_token) {
      return NextResponse.json(
        { error: 'Verification token not found. Please re-initialize domain.' },
        { status: 400 }
      )
    }

    // Check if already verified
    if (siteWithCustomFields.custom_domain_status === 'verified') {
      return NextResponse.json({
        verified: true,
        cnameValid: true,
        txtValid: true,
        errors: [],
        message: 'Domain already verified'
      })
    }

    // Check rate limiting
    const rateLimit = canCheckDns(
      siteWithCustomFields.last_dns_check_at ? new Date(siteWithCustomFields.last_dns_check_at) : null,
      DNS_CHECK_RATE_LIMIT_SECONDS
    )

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limited. Please wait before checking again.',
          secondsRemaining: rateLimit.secondsRemaining
        },
        { status: 429 }
      )
    }

    // Perform DNS verification
    const verificationResult = await verifyDnsRecords(
      siteWithCustomFields.custom_domain,
      siteWithCustomFields.dns_verification_token
    )

    // Update last check time
    const updateData: Record<string, unknown> = {
      last_dns_check_at: new Date().toISOString()
    }

    // If verification successful, update status and register with Cloudflare
    if (verificationResult.verified) {
      updateData.custom_domain_status = 'verified'
      updateData.custom_domain_verified_at = new Date().toISOString()
      updateData.custom_domain_error = null

      // Register with Cloudflare (placeholder)
      const cloudflareResult = await registerWithCloudflare(siteWithCustomFields.custom_domain)
      if (!cloudflareResult.success) {
        // Log error but don't fail the verification
        console.error('Failed to register with Cloudflare:', cloudflareResult.error)
      }
    } else {
      // Update with error details
      updateData.custom_domain_status = 'failed'
      updateData.custom_domain_error = verificationResult.errors.join('; ')
    }

    // Update site with verification results
    const { error: updateError } = await supabase
      .from('sites')
      .update(updateData)
      .eq('id', siteId)

    if (updateError) {
      throw updateError
    }

    // Return verification result
    return NextResponse.json(verificationResult)
  } catch (error: unknown) {
    const errorInfo = handleError(error)
    return NextResponse.json(
      {
        error: 'Failed to verify domain',
        details: errorInfo.message
      },
      { status: 500 }
    )
  }
}