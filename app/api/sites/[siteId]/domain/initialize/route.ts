/**
 * Initialize custom domain configuration
 * Validates domain, detects DNS provider, creates Cloudflare resources and returns DNS records
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { handleError } from '@/lib/types/error-handling'
import { isValidCustomDomain } from '@/src/lib/site/resolution'
import { isCustomDomainAvailable } from '@/src/lib/site/queries'
import { detectDnsProvider } from '@/src/lib/dns/utils'
import { CloudflareService } from '@/src/lib/cloudflare/service'
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

    // Setup custom domain with Cloudflare
    console.log(`[Initialize] Setting up custom domain with Cloudflare for: ${cleanDomain}`)
    const cloudflareResult = await CloudflareService.setupCustomDomain(cleanDomain, siteId)

    if (!cloudflareResult.success || !cloudflareResult.data) {
      // Log detailed error for debugging
      console.error('[Initialize] Cloudflare setup failed:', cloudflareResult.error)

      // Return a user-friendly error
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to initialize custom domain',
          details: cloudflareResult.error || 'Could not create Cloudflare resources'
        },
        { status: 500 }
      )
    }

    const { hostname, workerRoute, dnsRecords } = cloudflareResult.data

    // Update site with domain configuration and Cloudflare IDs
    const { data: updatedSite, error: updateError } = await supabase
      .from('sites')
      .update({
        custom_domain: cleanDomain,
        custom_domain_status: 'pending_dns',
        dns_provider: dnsProvider,
        dns_records: dnsRecords as unknown as Json,
        custom_domain_error: null,
        custom_domain_verified_at: null,
        last_dns_check_at: null,
        // Cloudflare-specific fields (already set by CloudflareService but ensuring consistency)
        cloudflare_hostname_id: hostname.hostnameId,
        cloudflare_route_id: workerRoute.routeId,
        cloudflare_txt_name: hostname.txtName,
        cloudflare_txt_value: hostname.txtValue,
        cloudflare_cname_target: hostname.cnameTarget,
        cloudflare_ssl_status: hostname.sslStatus,
        cloudflare_created_at: new Date().toISOString()
      })
      .eq('id', siteId)
      .select()
      .single()

    if (updateError) {
      // If database update fails, attempt to rollback Cloudflare resources
      console.error('[Initialize] Database update failed, rolling back Cloudflare:', updateError)
      await CloudflareService.removeCustomDomain(hostname.hostnameId, workerRoute.routeId)
      throw updateError
    }

    // Prepare response with real DNS records from Cloudflare
    const result: DomainInitializationResult = {
      success: true,
      domain: cleanDomain,
      status: 'pending_verification',
      provider: dnsProvider || undefined,
      verificationToken: hostname.txtValue, // Use Cloudflare's TXT value as verification token
      dnsRecords: {
        cname: dnsRecords.cname,
        txt: dnsRecords.txt
      }
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