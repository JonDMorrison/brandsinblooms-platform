/**
 * Debug version of getUserSites to troubleshoot staging issues
 */

import { supabase as browserSupabase } from '@/lib/supabase/client'
import { Site, SiteMembership, SiteMembershipRole } from '@/lib/database/aliases'

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

export async function getUserSitesDebug(
  userId: string,
  _useServer = false
): Promise<SiteQueryResult<UserSiteAccess[]>> {
  console.log('[getUserSitesDebug] Starting query for user:', userId);
  
  // IMPORTANT: Check if this is the test user ID
  if (userId === '22222222-2222-2222-2222-222222222222') {
    console.log('[getUserSitesDebug] ⚠️ This is the seed data user ID!');
  }
  
  try {
    const supabase = browserSupabase
    
    // Check auth status
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[getUserSitesDebug] Auth user:', user?.id);
    
    // Query memberships
    console.log('[getUserSitesDebug] Querying site_memberships...');
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

    console.log('[getUserSitesDebug] Memberships result:', {
      count: data?.length || 0,
      error: error,
      data: data
    });

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
    console.log('[getUserSitesDebug] Fetching sites for IDs:', siteIds);
    
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .in('id', siteIds)
      .eq('is_active', true)
    
    console.log('[getUserSitesDebug] Sites result:', {
      count: sites?.length || 0,
      error: sitesError,
      sites: sites?.map(s => ({ id: s.id, name: s.name, is_active: s.is_active, is_published: s.is_published }))
    });
    
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
        if (!site) {
          console.log('[getUserSitesDebug] No site found for membership:', membership.site_id);
          return null
        }
        
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

    console.log('[getUserSitesDebug] Final userSites count:', userSites.length);
    return { data: userSites, error: null }
  } catch (err) {
    console.error('[getUserSitesDebug] Unexpected error:', err);
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