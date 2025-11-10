/**
 * Site-related query functions
 * Handles all database operations for sites and site memberships
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Tables, TablesInsert, TablesUpdate } from '@/lib/database/types';
import { 
  handleQueryResponse, 
  handleSingleResponse,
  filterUndefined,
  RowType,
  InsertType,
  UpdateType
} from '../base';
import { SupabaseError } from '../errors';

type Site = Tables<'sites'>;
type SiteMembership = Tables<'site_memberships'>;
type InsertSite = TablesInsert<'sites'>;
type UpdateSite = TablesUpdate<'sites'>;
type InsertSiteMembership = TablesInsert<'site_memberships'>;

export interface SiteWithMembership extends Site {
  membership?: SiteMembership;
}

/**
 * Get the current user's primary site
 */
export async function getCurrentUserSite(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<SiteWithMembership | null> {
  const sites = await getUserSites(supabase, userId, { active: true });
  return sites.length > 0 ? sites[0] : null;
}

/**
 * Get all sites for a user (excludes deleted sites by default)
 */
export async function getUserSites(
  supabase: SupabaseClient<Database>,
  userId: string,
  options?: { active?: boolean; includeDeleted?: boolean }
): Promise<SiteWithMembership[]> {
  let query = supabase
    .from('site_memberships')
    .select(`
      site_id,
      role,
      is_active,
      created_at,
      sites!inner(*)
    `)
    .eq('user_id', userId);

  if (options?.active !== undefined) {
    query = query.eq('is_active', options.active);
  }

  // Exclude deleted sites by default
  if (!options?.includeDeleted) {
    query = query.is('sites.deleted_at', null);
  }

  const response = await query.order('created_at', { ascending: false });
  const memberships = await handleQueryResponse(response);

  // Transform the data to include membership info
  interface MembershipWithSite {
    site_id: string;
    role: string;
    is_active: boolean | null;
    created_at: string;
    sites: Record<string, unknown>;
  }

  return memberships.map((item: MembershipWithSite) => ({
    ...item.sites,
    membership: {
      id: `${userId}-${item.site_id}`, // Generate a composite ID since it's not returned
      user_id: userId,
      site_id: item.site_id,
      role: item.role,
      is_active: item.is_active ?? false,
      created_at: item.created_at,
    },
  })) as SiteWithMembership[];
}

/**
 * Get a single site by ID
 */
export async function getSiteById(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<Site> {
  const response = await supabase
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .single();

  return handleSingleResponse(response);
}

/**
 * Get a site by subdomain
 */
export async function getSiteBySubdomain(
  supabase: SupabaseClient<Database>,
  subdomain: string
): Promise<Site> {
  const response = await supabase
    .from('sites')
    .select('*')
    .eq('subdomain', subdomain)
    .single();

  return handleSingleResponse(response);
}

/**
 * Get a site by custom domain
 */
export async function getSiteByCustomDomain(
  supabase: SupabaseClient<Database>,
  customDomain: string
): Promise<Site> {
  const response = await supabase
    .from('sites')
    .select('*')
    .eq('custom_domain', customDomain)
    .single();

  return handleSingleResponse(response);
}

/**
 * Check if user has access to a site
 */
export async function checkSiteAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  siteId: string,
  requiredRole?: 'owner' | 'editor' | 'viewer'
): Promise<boolean> {
  const query = supabase
    .from('site_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .eq('is_active', true);

  if (requiredRole) {
    const roleHierarchy = { owner: 3, editor: 2, viewer: 1 };
    
    const response = await query.single();
    try {
      const membership = await handleSingleResponse(response);
      const userRoleLevel = roleHierarchy[membership.role as keyof typeof roleHierarchy] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
      
      return userRoleLevel >= requiredRoleLevel;
    } catch {
      return false;
    }
  }

  const memberships = await handleQueryResponse(await query);
  return memberships.length > 0;
}

/**
 * Create a new site
 */
export async function createSite(
  supabase: SupabaseClient<Database>,
  data: InsertSite,
  ownerId: string
): Promise<Site> {
  // Start a transaction to create site and membership
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .insert(data)
    .select()
    .single();

  if (siteError) {
    throw SupabaseError.fromPostgrestError(siteError);
  }

  // Create owner membership
  const membershipData: InsertSiteMembership = {
    user_id: ownerId,
    site_id: site.id,
    role: 'owner',
    is_active: true,
  };

  const { error: membershipError } = await supabase
    .from('site_memberships')
    .insert(membershipData);

  if (membershipError) {
    // Attempt to clean up the site if membership creation fails
    await supabase.from('sites').delete().eq('id', site.id);
    throw new SupabaseError(
      'Failed to create site membership',
      membershipError.code,
      membershipError.details
    );
  }

  return site;
}

/**
 * Update a site
 */
export async function updateSite(
  supabase: SupabaseClient<Database>,
  siteId: string,
  data: UpdateSite
): Promise<Site> {
  const filteredData = filterUndefined(data);
  
  const response = await supabase
    .from('sites')
    .update({
      ...filteredData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', siteId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Soft-delete a site (sets deleted_at timestamp)
 * Site and related content can be recovered for 30 days
 */
export async function deleteSite(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<void> {
  const response = await supabase
    .from('sites')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', siteId)
    .is('deleted_at', null); // Prevent double-deletion

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }
}

/**
 * Restore a soft-deleted site
 */
export async function restoreSite(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<Site> {
  const response = await supabase
    .from('sites')
    .update({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', siteId)
    .not('deleted_at', 'is', null) // Only restore deleted sites
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Get all deleted sites for a user (for recovery)
 */
export async function getDeletedSites(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<SiteWithMembership[]> {
  const response = await supabase
    .from('site_memberships')
    .select(`
      site_id,
      role,
      is_active,
      created_at,
      sites!inner(*)
    `)
    .eq('user_id', userId)
    .not('sites.deleted_at', 'is', null)
    .order('sites.deleted_at', { ascending: false });

  const memberships = await handleQueryResponse(response);

  interface MembershipWithSite {
    site_id: string;
    role: string;
    is_active: boolean | null;
    created_at: string;
    sites: Record<string, unknown>;
  }

  return memberships.map((item: MembershipWithSite) => ({
    ...item.sites,
    membership: {
      id: `${userId}-${item.site_id}`,
      user_id: userId,
      site_id: item.site_id,
      role: item.role,
      is_active: item.is_active ?? false,
      created_at: item.created_at,
    },
  })) as SiteWithMembership[];
}

/**
 * Permanently delete a site (cannot be recovered)
 * Only allowed for sites that are already soft-deleted
 */
export async function permanentlyDeleteSite(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<void> {
  const response = await supabase
    .from('sites')
    .delete()
    .eq('id', siteId)
    .not('deleted_at', 'is', null); // Only hard-delete soft-deleted sites

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }
}

/**
 * Get site members
 */
export async function getSiteMembers(
  supabase: SupabaseClient<Database>,
  siteId: string,
  options?: { active?: boolean }
): Promise<Array<SiteMembership & { profile?: Tables<'profiles'> }>> {
  let query = supabase
    .from('site_memberships')
    .select(`
      *,
      profiles!inner(
        id,
        full_name,
        username,
        avatar_url,
        user_id
      )
    `)
    .eq('site_id', siteId);

  if (options?.active !== undefined) {
    query = query.eq('is_active', options.active);
  }

  const response = await query.order('created_at', { ascending: false });
  return handleQueryResponse(response);
}

/**
 * Add a member to a site
 */
export async function addSiteMember(
  supabase: SupabaseClient<Database>,
  data: InsertSiteMembership
): Promise<SiteMembership> {
  const response = await supabase
    .from('site_memberships')
    .insert(data)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Update a site membership
 */
export async function updateSiteMembership(
  supabase: SupabaseClient<Database>,
  membershipId: string,
  data: { role?: string; is_active?: boolean }
): Promise<SiteMembership> {
  const response = await supabase
    .from('site_memberships')
    .update(data)
    .eq('id', membershipId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Remove a member from a site (soft delete)
 */
export async function removeSiteMember(
  supabase: SupabaseClient<Database>,
  userId: string,
  siteId: string
): Promise<void> {
  const response = await supabase
    .from('site_memberships')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('site_id', siteId);

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }
}

/**
 * Check subdomain availability
 */
export async function checkSubdomainAvailability(
  supabase: SupabaseClient<Database>,
  subdomain: string
): Promise<boolean> {
  const response = await supabase
    .from('sites')
    .select('id')
    .eq('subdomain', subdomain)
    .maybeSingle();

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }

  return response.data === null;
}

/**
 * Get site statistics
 */
export async function getSiteStatistics(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<{
  totalProducts: number;
  totalContent: number;
  totalCategories: number;
  featuredProducts: number;
  totalEvents: number;
  activeCustomers: number;
  monthlyRevenue: number;
}> {
  const [products, content, categories, featuredProducts, events] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact' }).eq('site_id', siteId),
    supabase.from('content').select('id', { count: 'exact' }).eq('site_id', siteId),
    supabase.from('product_categories').select('id', { count: 'exact' }).eq('site_id', siteId),
    supabase.from('products').select('id', { count: 'exact' }).eq('site_id', siteId).eq('is_featured', true),
    supabase.from('events').select('id', { count: 'exact' }).eq('site_id', siteId).is('deleted_at', null)
  ]);

  return {
    totalProducts: products.count || 0,
    totalContent: content.count || 0,
    totalCategories: categories.count || 0,
    featuredProducts: featuredProducts.count || 0,
    totalEvents: events.count || 0,
    activeCustomers: 0, // TODO: Implement when customer table exists
    monthlyRevenue: 0, // TODO: Implement when orders table exists
  };
}

/**
 * Get revenue analytics
 */
export async function getRevenueAnalytics(
  supabase: SupabaseClient<Database>,
  siteId: string,
  period: 'day' | 'week' | 'month' | 'year'
): Promise<{ total: number; growth: number; chart: unknown[] }> {
  // TODO: Implement when orders table exists
  return {
    total: 0,
    growth: 0,
    chart: []
  };
}

/**
 * Get content analytics
 */
export async function getContentAnalytics(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<{ total: number; byType: Record<string, number> }> {
  const stats = await supabase
    .from('content')
    .select('content_type', { count: 'exact' })
    .eq('site_id', siteId);

  return {
    total: stats.count || 0,
    byType: {}
  };
}

/**
 * Get product analytics
 */
export async function getProductAnalytics(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<{ total: number; byCategory: Record<string, number> }> {
  const stats = await supabase
    .from('products')
    .select('category', { count: 'exact' })
    .eq('site_id', siteId);

  return {
    total: stats.count || 0,
    byCategory: {}
  };
}

/**
 * Get customer analytics
 */
export async function getCustomerAnalytics(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<{ total: number; newThisMonth: number; retention: number }> {
  // TODO: Implement when customer table exists
  return {
    total: 0,
    newThisMonth: 0,
    retention: 0
  };
}

/**
 * Get site statistics
 */
export async function getSiteStats(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<{
  contentCount: number;
  productCount: number;
  memberCount: number;
  inquiryCount: number;
}> {
  const [content, products, members, inquiries] = await Promise.all([
    supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('is_active', true),
    supabase
      .from('site_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('is_active', true),
    supabase
      .from('contact_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('status', 'new'),
  ]);

  return {
    contentCount: content.count || 0,
    productCount: products.count || 0,
    memberCount: members.count || 0,
    inquiryCount: inquiries.count || 0,
  };
}