/**
 * Database queries for site operations
 * Handles site retrieval, validation, and user membership checks
 */

import { supabase as browserSupabase } from '@/lib/supabase/client'
import { Site, SiteWithMemberships, SiteMembership, SiteMembershipRole } from '@/lib/database/aliases'

export interface SiteQueryError {
  code: string
  message: string
  details?: unknown
}

export interface SiteQueryResult<T> {
  data: T | null
  error: SiteQueryError | null
}

export interface UserSiteAccess {
  site: Site
  membership: SiteMembership
  role: SiteMembershipRole
  canEdit: boolean
  canManage: boolean
}

/**
 * Gets a site by its subdomain
 */
export async function getSiteBySubdomain(
  subdomain: string,
  useServer = false
): Promise<SiteQueryResult<Site>> {
  try {
    const supabase = browserSupabase
    
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          data: null,
          error: {
            code: 'SITE_NOT_FOUND',
            message: `Site with subdomain '${subdomain}' not found`
          }
        }
      }

      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          details: error
        }
      }
    }

    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'QUERY_FAILED',
        message: 'Failed to query site by subdomain',
        details: err
      }
    }
  }
}

/**
 * Gets a site by its custom domain
 */
export async function getSiteByCustomDomain(
  domain: string,
  useServer = false
): Promise<SiteQueryResult<Site>> {
  try {
    const supabase = browserSupabase
    
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('custom_domain', domain)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          data: null,
          error: {
            code: 'SITE_NOT_FOUND',
            message: `Site with custom domain '${domain}' not found`
          }
        }
      }

      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          details: error
        }
      }
    }

    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'QUERY_FAILED',
        message: 'Failed to query site by custom domain',
        details: err
      }
    }
  }
}

/**
 * Gets a site by either subdomain or custom domain
 * This is a convenience function that tries both resolution methods
 */
export async function getSite(
  identifier: string,
  type: 'subdomain' | 'custom_domain',
  useServer = false
): Promise<SiteQueryResult<Site>> {
  if (type === 'subdomain') {
    return getSiteBySubdomain(identifier, useServer)
  } else {
    return getSiteByCustomDomain(identifier, useServer)
  }
}

/**
 * Gets a site with its memberships included
 */
export async function getSiteWithMemberships(
  siteId: string,
  useServer = false
): Promise<SiteQueryResult<SiteWithMemberships>> {
  try {
    const supabase = browserSupabase
    
    const { data, error } = await supabase
      .from('sites')
      .select(`
        *,
        site_memberships(
          id,
          user_id,
          site_id,
          role,
          is_active,
          created_at
        )
      `)
      .eq('id', siteId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          data: null,
          error: {
            code: 'SITE_NOT_FOUND',
            message: `Site with ID '${siteId}' not found`
          }
        }
      }

      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          details: error
        }
      }
    }

    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'QUERY_FAILED',
        message: 'Failed to query site with memberships',
        details: err
      }
    }
  }
}

/**
 * Gets all sites that a user has access to
 */
export async function getUserSites(
  userId: string,
  useServer = false
): Promise<SiteQueryResult<UserSiteAccess[]>> {
  try {
    const supabase = browserSupabase
    
    const { data, error } = await supabase
      .from('site_memberships')
      .select(`
        id,
        user_id,
        site_id,
        role,
        is_active,
        created_at
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          details: error
        }
      }
    }

    // Now fetch the sites for each membership
    const siteIds = (data || []).map(m => m.site_id)
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .in('id', siteIds)
      .eq('is_active', true)
    
    if (sitesError) {
      return {
        data: null,
        error: {
          code: sitesError.code,
          message: sitesError.message,
          details: sitesError
        }
      }
    }
    
    // Transform the data to match UserSiteAccess interface
    const userSites: UserSiteAccess[] = (data || [])
      .map((membership: { site_id: string; role: string; is_active: boolean | null; created_at: string; id: string; user_id: string }) => {
        const site = sites?.find(s => s.id === membership.site_id)
        if (!site) return null
        
        return {
          site: site as Site,
          membership: {
            id: membership.id,
            user_id: membership.user_id,
            site_id: membership.site_id,
            role: membership.role,
            is_active: membership.is_active ?? false,
            created_at: membership.created_at
          } as SiteMembership,
          role: membership.role as SiteMembershipRole,
          canEdit: ['owner', 'editor'].includes(membership.role),
          canManage: membership.role === 'owner'
        }
      })
      .filter(Boolean) as UserSiteAccess[]

    return { data: userSites, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'QUERY_FAILED',
        message: 'Failed to query user sites',
        details: err
      }
    }
  }
}

/**
 * Checks if a user has access to a specific site
 */
export async function checkUserSiteAccess(
  userId: string,
  siteId: string,
  useServer = false
): Promise<SiteQueryResult<UserSiteAccess>> {
  try {
    const supabase = browserSupabase
    
    const { data, error } = await supabase
      .from('site_memberships')
      .select(`
        id,
        user_id,
        site_id,
        role,
        is_active,
        created_at
      `)
      .eq('user_id', userId)
      .eq('site_id', siteId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          data: null,
          error: {
            code: 'ACCESS_DENIED',
            message: 'User does not have access to this site'
          }
        }
      }

      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          details: error
        }
      }
    }

    // Now fetch the site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', data.site_id)
      .eq('is_active', true)
      .single()
      
    if (siteError || !site) {
      return {
        data: null,
        error: {
          code: 'SITE_NOT_FOUND',
          message: 'Associated site not found'
        }
      }
    }

    const userSiteAccess: UserSiteAccess = {
      site: site as Site,
      membership: {
        id: data.id,
        user_id: data.user_id,
        site_id: data.site_id,
        role: data.role,
        is_active: data.is_active,
        created_at: data.created_at
      } as SiteMembership,
      role: data.role as SiteMembershipRole,
      canEdit: ['owner', 'editor'].includes(data.role),
      canManage: data.role === 'owner'
    }

    return { data: userSiteAccess, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'QUERY_FAILED',
        message: 'Failed to check user site access',
        details: err
      }
    }
  }
}

/**
 * Validates if a subdomain is available for use
 */
export async function isSubdomainAvailable(
  subdomain: string,
  excludeSiteId?: string,
  useServer = false
): Promise<SiteQueryResult<boolean>> {
  try {
    const supabase = browserSupabase
    
    let query = supabase
      .from('sites')
      .select('id')
      .eq('subdomain', subdomain)

    if (excludeSiteId) {
      query = query.neq('id', excludeSiteId)
    }

    const { data, error } = await query

    if (error) {
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          details: error
        }
      }
    }

    const isAvailable = !data || data.length === 0

    return { data: isAvailable, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'QUERY_FAILED',
        message: 'Failed to check subdomain availability',
        details: err
      }
    }
  }
}

/**
 * Validates if a custom domain is available for use
 */
export async function isCustomDomainAvailable(
  domain: string,
  excludeSiteId?: string,
  useServer = false
): Promise<SiteQueryResult<boolean>> {
  try {
    const supabase = browserSupabase
    
    let query = supabase
      .from('sites')
      .select('id')
      .eq('custom_domain', domain)

    if (excludeSiteId) {
      query = query.neq('id', excludeSiteId)
    }

    const { data, error } = await query

    if (error) {
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          details: error
        }
      }
    }

    const isAvailable = !data || data.length === 0

    return { data: isAvailable, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'QUERY_FAILED',
        message: 'Failed to check custom domain availability',
        details: err
      }
    }
  }
}