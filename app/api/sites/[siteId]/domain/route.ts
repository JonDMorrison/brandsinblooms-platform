import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { isValidSubdomain, isValidCustomDomain } from '@/src/lib/site/resolution'
import { isSubdomainAvailable, isCustomDomainAvailable } from '@/src/lib/site/queries'
import { handleError } from '@/lib/types/error-handling'
import { getAppDomain } from '@/lib/env/app-domain'
import { CloudflareService } from '@/src/lib/cloudflare/service'
import type { Json } from '@/lib/database/types'

interface DomainUpdateRequest {
  subdomain?: string
  custom_domain?: string | null
}

/**
 * Validates and normalizes a custom domain
 * Handles:
 * - TLD (domain.ext)
 * - One level subdomain (sub.domain.ext)
 * - Store subdomain with platform subdomain (my-cool-store.sub.domain.ext)
 */
function validateAndNormalizeDomain(domain: string | undefined | null, appDomain: string): {
  isValid: boolean
  normalizedDomain: string | null
  errors: string[]
} {
  if (!domain || domain.trim().length === 0) {
    return { isValid: true, normalizedDomain: null, errors: [] }
  }

  const cleanDomain = domain.trim().toLowerCase()
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/^www\./, '') // Remove www
    .replace(/\/$/, '') // Remove trailing slash

  const errors: string[] = []

  // Basic domain format validation
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!domainRegex.test(cleanDomain)) {
    errors.push('Invalid domain format')
    return { isValid: false, normalizedDomain: null, errors }
  }

  // Split domain into parts
  const parts = cleanDomain.split('.')

  // Must have at least 2 parts (e.g., example.com)
  if (parts.length < 2) {
    errors.push('Domain must have at least two parts (e.g., example.com)')
    return { isValid: false, normalizedDomain: null, errors }
  }

  // Validate TLD
  const tld = parts[parts.length - 1]
  if (tld.length < 2 || tld.length > 63) {
    errors.push('Invalid top-level domain')
    return { isValid: false, normalizedDomain: null, errors }
  }

  // Check if this is a platform domain pattern (*.sub.domain.ext where sub.domain.ext is the app domain)
  const appDomainParts = appDomain.split('.')
  const appDomainWithoutPort = appDomainParts[0].split(':')[0] + '.' + appDomainParts.slice(1).join('.')

  // Check if the domain ends with the app domain (excluding the first part)
  // This handles cases like: my-store.blooms.cc where blooms.cc is the app domain
  if (parts.length >= 2) {
    const domainSuffix = parts.slice(-appDomainParts.length).join('.')
    const appDomainNormalized = appDomain.split(':')[0] // Remove port if present

    if (domainSuffix === appDomainNormalized) {
      errors.push('Cannot use platform domain as custom domain. Use the subdomain field instead.')
      return { isValid: false, normalizedDomain: null, errors }
    }
  }

  // Valid patterns:
  // - TLD: example.com (2 parts)
  // - One level subdomain: shop.example.com (3 parts)
  // - Multi-level: any.number.of.subdomains.example.com (3+ parts)

  // We allow all valid domain patterns except those that conflict with the platform domain
  if (parts.length > 10) {
    errors.push('Domain has too many levels (maximum 10)')
    return { isValid: false, normalizedDomain: null, errors }
  }

  // Reserved domains check
  const reservedDomains = ['localhost', 'blooms.cc', 'blooms.local']
  if (reservedDomains.includes(cleanDomain)) {
    errors.push('This domain is reserved and cannot be used')
    return { isValid: false, normalizedDomain: null, errors }
  }

  return {
    isValid: true,
    normalizedDomain: cleanDomain,
    errors: []
  }
}

export async function PATCH(
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

    // Verify site ownership/management access
    const { data: membership, error: membershipError } = await supabase
      .from('site_memberships')
      .select('role')
      .eq('site_id', siteId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: Only site owners can update domain settings' },
        { status: 403 }
      )
    }

    // Get current site with Cloudflare configuration
    const { data: currentSite, error: siteError } = await supabase
      .from('sites')
      .select(`
        subdomain,
        custom_domain,
        custom_domain_status,
        cloudflare_hostname_id,
        cloudflare_route_id
      `)
      .eq('id', siteId)
      .single()

    if (siteError || !currentSite) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      )
    }

    // Type assertion for Cloudflare fields
    const siteWithCloudflare = currentSite as unknown as {
      subdomain: string
      custom_domain: string | null
      custom_domain_status: string | null
      cloudflare_hostname_id: string | null
      cloudflare_route_id: string | null
    }

    // Parse request body
    const body = await request.json() as DomainUpdateRequest
    const { subdomain, custom_domain } = body

    const errors: string[] = []
    const updates: Record<string, unknown> = {}
    let cloudflareResult: { dnsRecords?: unknown } | null = null

    // Get app domain for validation
    const appDomain = getAppDomain()

    // Validate and update subdomain if provided
    if (subdomain !== undefined) {
      if (!subdomain || subdomain.trim().length === 0) {
        errors.push('Subdomain cannot be empty')
      } else {
        const cleanSubdomain = subdomain.trim().toLowerCase()

        // Validate format
        if (!isValidSubdomain(cleanSubdomain)) {
          errors.push('Invalid subdomain format or reserved subdomain')
        } else {
          // Check availability
          const availabilityResult = await isSubdomainAvailable(cleanSubdomain, siteId)

          if (availabilityResult.error) {
            errors.push('Could not verify subdomain availability')
          } else if (availabilityResult.data === false) {
            errors.push('Subdomain is already taken')
          } else {
            updates.subdomain = cleanSubdomain
          }
        }
      }
    }

    // Validate and update custom domain if provided
    if (custom_domain !== undefined) {
      // Check if we're changing the custom domain
      const isChangingDomain = custom_domain !== siteWithCloudflare.custom_domain

      if (isChangingDomain) {
        // Handle removing old domain from Cloudflare
        if (siteWithCloudflare.custom_domain && siteWithCloudflare.cloudflare_hostname_id) {
          console.log(`[PATCH] Removing old custom domain from Cloudflare: ${siteWithCloudflare.custom_domain}`)

          // Remove old Cloudflare resources
          const removeSuccess = await CloudflareService.removeCustomDomain(
            siteWithCloudflare.cloudflare_hostname_id,
            siteWithCloudflare.cloudflare_route_id || undefined
          )

          if (!removeSuccess) {
            console.error('[PATCH] Warning: Failed to remove old Cloudflare resources')
            // Continue anyway, don't block the update
          }

          // Clear Cloudflare fields
          updates.cloudflare_hostname_id = null
          updates.cloudflare_route_id = null
          updates.cloudflare_txt_name = null
          updates.cloudflare_txt_value = null
          updates.cloudflare_cname_target = null
          updates.cloudflare_ssl_status = null
          updates.cloudflare_created_at = null
          updates.cloudflare_activated_at = null
        }

        // Handle setting up new domain
        if (custom_domain === null || custom_domain === '') {
          // Clearing custom domain
          updates.custom_domain = null
          updates.custom_domain_status = 'disconnected'
          updates.dns_provider = null
          updates.dns_records = null
          updates.custom_domain_error = null
          updates.custom_domain_verified_at = null
          updates.last_dns_check_at = null
        } else {
          const validation = validateAndNormalizeDomain(custom_domain, appDomain)

          if (!validation.isValid) {
            errors.push(...validation.errors)
          } else if (validation.normalizedDomain) {
            // Additional check using the library function
            if (!isValidCustomDomain(validation.normalizedDomain)) {
              errors.push('Invalid custom domain format')
            } else {
              // Check availability
              const availabilityResult = await isCustomDomainAvailable(
                validation.normalizedDomain,
                siteId
              )

              if (availabilityResult.error) {
                errors.push('Could not verify custom domain availability')
              } else if (availabilityResult.data === false) {
                errors.push('Custom domain is already in use by another site')
              } else {
                // Setup new domain with Cloudflare
                console.log(`[PATCH] Setting up new custom domain with Cloudflare: ${validation.normalizedDomain}`)
                const setupResult = await CloudflareService.setupCustomDomain(
                  validation.normalizedDomain,
                  siteId
                )

                if (!setupResult.success || !setupResult.data) {
                  errors.push(setupResult.error || 'Failed to setup custom domain with Cloudflare')
                } else {
                  // Update with new domain and Cloudflare configuration
                  updates.custom_domain = validation.normalizedDomain
                  updates.custom_domain_status = 'pending_dns'
                  updates.dns_records = setupResult.data.dnsRecords as unknown as Json
                  updates.custom_domain_error = null
                  updates.custom_domain_verified_at = null
                  updates.last_dns_check_at = null

                  // Cloudflare fields
                  updates.cloudflare_hostname_id = setupResult.data.hostname.hostnameId
                  updates.cloudflare_route_id = setupResult.data.workerRoute.routeId
                  updates.cloudflare_txt_name = setupResult.data.hostname.txtName
                  updates.cloudflare_txt_value = setupResult.data.hostname.txtValue
                  updates.cloudflare_cname_target = setupResult.data.hostname.cnameTarget
                  updates.cloudflare_ssl_status = setupResult.data.hostname.sslStatus
                  updates.cloudflare_created_at = new Date().toISOString()

                  // Store result for response
                  cloudflareResult = setupResult.data
                }
              }
            }
          }
        }
      }
    }

    // Return validation errors if any
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    // If no updates, return early
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No domain updates provided' },
        { status: 400 }
      )
    }

    // Update the site
    const { data: updatedSite, error: updateError } = await supabase
      .from('sites')
      .update(updates)
      .eq('id', siteId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Prepare response
    const response: Record<string, unknown> = {
      success: true,
      data: updatedSite
    }

    // Include DNS records if we just set up a new custom domain
    if (cloudflareResult && cloudflareResult.dnsRecords) {
      response.dnsRecords = cloudflareResult.dnsRecords
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    const errorInfo = handleError(error)
    return NextResponse.json(
      { error: 'Failed to update domain settings', details: errorInfo.message },
      { status: 500 }
    )
  }
}

/**
 * Disconnect custom domain from site
 * Removes custom domain configuration and cleans up Cloudflare settings
 */
export async function DELETE(
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
        { error: 'Forbidden: Only site owners can disconnect custom domains' },
        { status: 403 }
      )
    }

    // Get current domain and Cloudflare configuration
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select(`
        custom_domain,
        custom_domain_status,
        cloudflare_hostname_id,
        cloudflare_route_id
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
      cloudflare_hostname_id: string | null
      cloudflare_route_id: string | null
    }

    if (!siteWithCustomFields.custom_domain) {
      return NextResponse.json(
        { error: 'No custom domain configured' },
        { status: 400 }
      )
    }

    // Remove from Cloudflare if configured
    if (siteWithCustomFields.cloudflare_hostname_id) {
      console.log(`[DELETE] Removing custom domain from Cloudflare: ${siteWithCustomFields.custom_domain}`)

      const removeSuccess = await CloudflareService.removeCustomDomain(
        siteWithCustomFields.cloudflare_hostname_id,
        siteWithCustomFields.cloudflare_route_id || undefined
      )

      if (!removeSuccess) {
        console.error('[DELETE] Warning: Failed to remove from Cloudflare, continuing with disconnection')
        // Continue with disconnection even if Cloudflare fails
      }
    }

    // Clear all custom domain and Cloudflare fields
    const { data: updatedSite, error: updateError } = await supabase
      .from('sites')
      .update({
        custom_domain: null,
        custom_domain_status: 'disconnected',
        dns_provider: null,
        dns_records: null,
        custom_domain_error: null,
        custom_domain_verified_at: null,
        last_dns_check_at: null,
        // Clear Cloudflare fields
        cloudflare_hostname_id: null,
        cloudflare_route_id: null,
        cloudflare_txt_name: null,
        cloudflare_txt_value: null,
        cloudflare_cname_target: null,
        cloudflare_ssl_status: null,
        cloudflare_created_at: null,
        cloudflare_activated_at: null
      })
      .eq('id', siteId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Custom domain disconnected successfully',
      data: {
        subdomain: updatedSite.subdomain
      }
    })
  } catch (error: unknown) {
    const errorInfo = handleError(error)
    return NextResponse.json(
      { error: 'Failed to disconnect custom domain', details: errorInfo.message },
      { status: 500 }
    )
  }
}
