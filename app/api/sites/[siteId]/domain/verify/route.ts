/**
 * Verify custom domain DNS configuration
 * Checks CNAME and TXT records with rate limiting and Cloudflare SSL status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { handleError } from '@/lib/types/error-handling'
import { canCheckDns } from '@/src/lib/dns/utils'
import { CloudflareService } from '@/src/lib/cloudflare/service'
import {
  DNS_CHECK_RATE_LIMIT_SECONDS,
  type DomainVerificationResult,
  type DnsRecords
} from '@/src/lib/dns/types'
import type { Json } from '@/src/lib/database/types'
import { promises as dns } from 'dns'

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

    // Get site with domain configuration and Cloudflare fields
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select(`
        custom_domain,
        custom_domain_status,
        last_dns_check_at,
        dns_records,
        cloudflare_hostname_id,
        cloudflare_txt_name,
        cloudflare_txt_value,
        cloudflare_cname_target,
        cloudflare_ssl_status
      `)
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      )
    }

    // Type assertion for fields
    const siteWithCustomFields = site as unknown as {
      custom_domain: string | null
      custom_domain_status: string | null
      last_dns_check_at: string | null
      dns_records: Json | null
      cloudflare_hostname_id: string | null
      cloudflare_txt_name: string | null
      cloudflare_txt_value: string | null
      cloudflare_cname_target: string | null
      cloudflare_ssl_status: string | null
    }

    // Check if domain initialization is required first
    if (!siteWithCustomFields.custom_domain || siteWithCustomFields.custom_domain_status === 'not_started') {
      return NextResponse.json(
        { error: 'Domain configuration not initialized. Please initialize first.' },
        { status: 400 }
      )
    }

    // Check if we have Cloudflare configuration
    if (!siteWithCustomFields.cloudflare_hostname_id || !siteWithCustomFields.cloudflare_txt_value) {
      return NextResponse.json(
        { error: 'Cloudflare configuration not found. Please re-initialize domain.' },
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

    // Perform real DNS verification using Node.js dns module
    console.log(`[Verify] Checking DNS records for domain: ${siteWithCustomFields.custom_domain}`)

    let cnameValid = false
    let txtValid = false
    const errors: string[] = []
    const details: DomainVerificationResult['details'] = {}

    // Check CNAME record
    try {
      const cnameRecords = await dns.resolveCname(siteWithCustomFields.custom_domain)
      console.log(`[Verify] CNAME records found:`, cnameRecords)

      // Check if CNAME points to our proxy
      const expectedCname = siteWithCustomFields.cloudflare_cname_target || ''
      details.expectedCname = expectedCname
      details.actualCname = cnameRecords[0]

      if (cnameRecords.some(record =>
        record.toLowerCase() === expectedCname.toLowerCase() ||
        record.toLowerCase().includes(expectedCname.toLowerCase())
      )) {
        cnameValid = true
      } else {
        errors.push(`CNAME record does not point to ${expectedCname}`)
      }
    } catch (error) {
      console.error('[Verify] CNAME lookup error:', error)
      errors.push('CNAME record not found or could not be resolved')
      details.actualCname = 'Not found'
    }

    // Check TXT record for verification
    try {
      // TXT records need to be checked at the specific subdomain
      const txtDomain = siteWithCustomFields.cloudflare_txt_name || `_cf-custom-hostname.${siteWithCustomFields.custom_domain}`
      const txtRecords = await dns.resolveTxt(txtDomain)
      console.log(`[Verify] TXT records found for ${txtDomain}:`, txtRecords)

      // TXT records come as arrays of chunks, flatten them
      const flatTxtRecords = txtRecords.map(chunks => chunks.join(''))

      const expectedTxt = siteWithCustomFields.cloudflare_txt_value || ''
      details.expectedTxt = expectedTxt
      details.actualTxt = flatTxtRecords.join(', ')

      if (flatTxtRecords.some(record => record === expectedTxt)) {
        txtValid = true
      } else {
        errors.push(`TXT verification record not found or incorrect`)
      }
    } catch (error) {
      console.error('[Verify] TXT lookup error:', error)
      errors.push('TXT verification record not found')
      details.actualTxt = 'Not found'
    }

    // Check Cloudflare SSL status if DNS records are valid
    let sslStatus = siteWithCustomFields.cloudflare_ssl_status
    let domainVerified = false

    if (cnameValid && txtValid) {
      console.log('[Verify] DNS records valid, checking SSL status with Cloudflare')
      const sslResult = await CloudflareService.checkSslStatus(siteWithCustomFields.cloudflare_hostname_id)

      if (sslResult.success && sslResult.data) {
        sslStatus = sslResult.data
        console.log(`[Verify] SSL status from Cloudflare: ${sslStatus}`)

        // Domain is considered verified when SSL is active
        domainVerified = sslStatus === 'active'

        if (!domainVerified) {
          errors.push(`SSL certificate status: ${sslStatus}. Waiting for SSL activation.`)
        }
      } else {
        console.error('[Verify] Failed to check SSL status:', sslResult.error)
        errors.push('Could not verify SSL certificate status')
      }
    }

    // Prepare verification result
    const verificationResult: DomainVerificationResult = {
      verified: domainVerified,
      cnameValid,
      txtValid,
      errors,
      details
    }

    // Update database with results
    const updateData: Record<string, unknown> = {
      last_dns_check_at: new Date().toISOString(),
      cloudflare_ssl_status: sslStatus
    }

    if (domainVerified) {
      updateData.custom_domain_status = 'verified'
      updateData.custom_domain_verified_at = new Date().toISOString()
      updateData.custom_domain_error = null
      updateData.cloudflare_activated_at = new Date().toISOString()
    } else if (cnameValid && txtValid) {
      // DNS is correct but SSL not active yet
      updateData.custom_domain_status = 'pending_ssl'
      updateData.custom_domain_error = `SSL certificate ${sslStatus || 'pending'}`
    } else {
      // DNS verification failed
      updateData.custom_domain_status = 'pending_dns'
      updateData.custom_domain_error = errors.join('; ')
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