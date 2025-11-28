/**
 * Domain query functions
 * Handles all database operations for custom domains
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables } from '@/src/lib/database/types'
import { Domain, CreateDomainInput, UpdateDomainInput, normalizeHostname } from './types'

type Site = Tables<'sites'>

/**
 * Get all domains for a site
 */
export async function getDomainsForSite(
    client: SupabaseClient<Database>,
    siteId: string
): Promise<Domain[]> {
    const { data, error } = await client
        .from('domains')
        .select('*')
        .eq('site_id', siteId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch domains: ${error.message}`)
    }

    return data as Domain[]
}

/**
 * Get a single domain by ID
 */
export async function getDomainById(
    client: SupabaseClient<Database>,
    domainId: string
): Promise<Domain | null> {
    const { data, error } = await client
        .from('domains')
        .select('*')
        .eq('id', domainId)
        .single()

    if (error) {
        return null
    }

    return data as Domain
}

/**
 * Create a new domain
 */
export async function createDomain(
    client: SupabaseClient<Database>,
    input: CreateDomainInput
): Promise<Domain> {
    const hostname = normalizeHostname(input.hostname)

    // Check if hostname already exists
    const { data: existing } = await client
        .from('domains')
        .select('id')
        .eq('hostname', hostname)
        .single()

    if (existing) {
        throw new Error('This domain is already in use')
    }

    const { data, error } = await client
        .from('domains')
        .insert({
            site_id: input.site_id,
            hostname,
            is_primary: input.is_primary || false,
            status: 'pending'
        })
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create domain: ${error.message}`)
    }

    return data as Domain
}

/**
 * Update a domain
 */
export async function updateDomain(
    client: SupabaseClient<Database>,
    domainId: string,
    input: UpdateDomainInput
): Promise<Domain> {
    const updateData: any = {
        updated_at: new Date().toISOString()
    }

    if (input.hostname !== undefined) {
        updateData.hostname = normalizeHostname(input.hostname)
    }

    if (input.is_primary !== undefined) {
        updateData.is_primary = input.is_primary
    }

    if (input.status !== undefined) {
        updateData.status = input.status

        // Set verified_at when status changes to verified or active
        if ((input.status === 'verified' || input.status === 'active')) {
            const { data: current } = await client
                .from('domains')
                .select('verified_at')
                .eq('id', domainId)
                .single()

            if (current && !current.verified_at) {
                updateData.verified_at = new Date().toISOString()
            }
        }
    }

    const { data, error } = await client
        .from('domains')
        .update(updateData)
        .eq('id', domainId)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to update domain: ${error.message}`)
    }

    return data as Domain
}

/**
 * Set a domain as primary (unsets all other primary domains for the site)
 */
export async function setPrimaryDomain(
    client: SupabaseClient<Database>,
    domainId: string
): Promise<void> {
    // Get the domain to find its site_id
    const domain = await getDomainById(client, domainId)
    if (!domain) {
        throw new Error('Domain not found')
    }

    // Unset all primary domains for this site
    await client
        .from('domains')
        .update({ is_primary: false })
        .eq('site_id', domain.site_id)

    // Set this domain as primary
    await client
        .from('domains')
        .update({ is_primary: true })
        .eq('id', domainId)
}

/**
 * Delete a domain
 */
export async function deleteDomain(
    client: SupabaseClient<Database>,
    domainId: string
): Promise<void> {
    const { error } = await client
        .from('domains')
        .delete()
        .eq('id', domainId)

    if (error) {
        throw new Error(`Failed to delete domain: ${error.message}`)
    }
}

/**
 * Get site by hostname (for public routing)
 * Checks domains table first, then falls back to sites.custom_domain and subdomain
 */
export async function getSiteByHostname(
    client: SupabaseClient<Database>,
    hostname: string
): Promise<Site | null> {
    const normalizedHostname = normalizeHostname(hostname)

    // 1. Try domains table first (multi-domain support)
    const { data: domainData } = await client
        .from('domains')
        .select('site_id, sites!inner(*)')
        .eq('hostname', normalizedHostname)
        .eq('status', 'active')
        .single()

    if (domainData?.sites) {
        return domainData.sites as unknown as Site
    }

    // 2. Fallback to sites.custom_domain (legacy single domain)
    const { data: siteByCustom } = await client
        .from('sites')
        .select('*')
        .eq('custom_domain', normalizedHostname)
        .single()

    if (siteByCustom) {
        return siteByCustom as Site
    }

    // 3. Try subdomain pattern (e.g., "mysite.platform.com")
    // Extract first part of hostname as potential subdomain
    const parts = normalizedHostname.split('.')
    if (parts.length > 1) {
        const subdomain = parts[0]

        const { data: siteBySubdomain } = await client
            .from('sites')
            .select('*')
            .eq('subdomain', subdomain)
            .single()

        if (siteBySubdomain) {
            return siteBySubdomain as Site
        }
    }

    return null
}

/**
 * Check if hostname is available
 */
export async function isHostnameAvailable(
    client: SupabaseClient<Database>,
    hostname: string,
    excludeDomainId?: string
): Promise<boolean> {
    const normalizedHostname = normalizeHostname(hostname)

    let query = client
        .from('domains')
        .select('id')
        .eq('hostname', normalizedHostname)

    if (excludeDomainId) {
        query = query.neq('id', excludeDomainId)
    }

    const { data } = await query.single()

    return !data
}

/**
 * Get primary domain for a site
 */
export async function getPrimaryDomain(
    client: SupabaseClient<Database>,
    siteId: string
): Promise<Domain | null> {
    const { data, error } = await client
        .from('domains')
        .select('*')
        .eq('site_id', siteId)
        .eq('is_primary', true)
        .single()

    if (error || !data) {
        return null
    }

    return data as Domain
}
