import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { isValidSubdomain, isValidCustomDomain } from '@/src/lib/site/resolution'
import { isSubdomainAvailable, isCustomDomainAvailable } from '@/src/lib/site/queries'
import { handleError } from '@/lib/types/error-handling'
import { getAppDomain } from '@/lib/env/app-domain'

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

    // Parse request body
    const body = await request.json() as DomainUpdateRequest
    const { subdomain, custom_domain } = body

    const errors: string[] = []
    const updates: { subdomain?: string; custom_domain?: string | null } = {}

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
      if (custom_domain === null || custom_domain === '') {
        // Allow clearing custom domain
        updates.custom_domain = null
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
              updates.custom_domain = validation.normalizedDomain
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

    return NextResponse.json({
      success: true,
      data: updatedSite
    })
  } catch (error: unknown) {
    const errorInfo = handleError(error)
    return NextResponse.json(
      { error: 'Failed to update domain settings', details: errorInfo.message },
      { status: 500 }
    )
  }
}
