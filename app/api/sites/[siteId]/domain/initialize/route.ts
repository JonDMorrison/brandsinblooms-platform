/**
 * Initialize custom domain configuration
 * Validates domain, detects DNS provider, generates verification token and DNS records
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { handleError } from '@/lib/types/error-handling'
import { isValidCustomDomain } from '@/src/lib/site/resolution'
import { isCustomDomainAvailable } from '@/src/lib/site/queries'
import {
  generateVerificationToken,
  generateDnsRecords,
  detectDnsProvider
} from '@/src/lib/dns/utils'
import type { DomainInitializationResult } from '@/src/lib/dns/types'
import type { Json } from '@/src/lib/database/types'

interface InitializeRequest {
  domain: string
}

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
        { error: 'Forbidden: Only site owners can configure custom domains' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json() as InitializeRequest
    const { domain } = body

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    // Clean and normalize domain
    const cleanDomain = domain.trim().toLowerCase()
      .replace(/^https?:\/\//, '') // Remove protocol
      .replace(/^www\./, '') // Remove www
      .replace(/\/$/, '') // Remove trailing slash

    // Validate domain format
    if (!isValidCustomDomain(cleanDomain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      )
    }

    // Check if domain is available
    const availabilityResult = await isCustomDomainAvailable(cleanDomain, siteId)
    if (availabilityResult.error) {
      return NextResponse.json(
        { error: 'Could not verify domain availability' },
        { status: 500 }
      )
    }

    if (availabilityResult.data === false) {
      return NextResponse.json(
        { error: 'Domain is already in use by another site' },
        { status: 409 }
      )
    }

    // Get current site data to check if already has a custom domain
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('custom_domain, custom_domain_status')
      .eq('id', siteId)
      .single()

    if (siteError) {
      throw siteError
    }

    // Type assertion for new fields until database types are regenerated
    const siteWithCustomFields = site as unknown as {
      custom_domain: string | null
      custom_domain_status: string | null
    }

    // If site already has a verified custom domain, require disconnection first
    if (siteWithCustomFields.custom_domain && siteWithCustomFields.custom_domain_status === 'verified') {
      return NextResponse.json(
        { error: 'Site already has a verified custom domain. Please disconnect it first.' },
        { status: 409 }
      )
    }

    // Detect DNS provider
    const dnsProvider = await detectDnsProvider(cleanDomain)

    // Generate verification token and DNS records
    const verificationToken = generateVerificationToken(siteId, cleanDomain)
    const dnsRecords = generateDnsRecords(cleanDomain, verificationToken)

    // Update site with domain configuration
    const { data: updatedSite, error: updateError } = await supabase
      .from('sites')
      .update({
        custom_domain: cleanDomain,
        custom_domain_status: 'pending_verification',
        dns_provider: dnsProvider,
        dns_verification_token: verificationToken,
        dns_records: dnsRecords as unknown as Json,
        custom_domain_error: null,
        custom_domain_verified_at: null,
        last_dns_check_at: null
      })
      .eq('id', siteId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Prepare response
    const result: DomainInitializationResult = {
      success: true,
      domain: cleanDomain,
      status: 'pending_verification',
      provider: dnsProvider || undefined,
      verificationToken,
      dnsRecords
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    const errorInfo = handleError(error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize custom domain',
        details: errorInfo.message
      },
      { status: 500 }
    )
  }
}