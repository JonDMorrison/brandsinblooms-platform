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
 * Get all sites for a user
 */
export async function getUserSites(
  supabase: SupabaseClient<Database>,
  userId: string,
  options?: { active?: boolean }
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

  const response = await query.order('created_at', { ascending: false });
  const memberships = await handleQueryResponse(response);

  // Transform the data to include membership info
  return memberships.map((item: any) => ({
    ...item.sites,
    membership: {
      id: `${userId}-${item.site_id}`, // Generate a composite ID since it's not returned
      user_id: userId,
      site_id: item.site_id,
      role: item.role,
      is_active: item.is_active,
      created_at: item.created_at,
    },
  }));
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
 * Delete a site (soft delete by setting is_active to false)
 */
export async function deleteSite(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<void> {
  const response = await supabase
    .from('sites')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', siteId);

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
  activeCustomers: number;
  monthlyRevenue: number;
}> {
  const [products, content] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact' }).eq('site_id', siteId),
    supabase.from('content').select('id', { count: 'exact' }).eq('site_id', siteId)
  ]);

  return {
    totalProducts: products.count || 0,
    totalContent: content.count || 0,
    activeCustomers: 0, // TODO: Implement when customer table exists
    monthlyRevenue: 0, // TODO: Implement when orders table exists
  };
}

/**
 * Get dashboard metrics
 */
export async function getDashboardMetrics(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<{
  totalOrders: number;
  newOrdersToday: number;
  totalViews: number;
  viewsGrowth: number;
  contentGrowth: number;
  productGrowth: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Get total views from site_metrics
  const { data: viewsData } = await supabase
    .from('site_metrics')
    .select('page_views')
    .eq('site_id', siteId)
    .gte('metric_date', lastWeek);

  const totalViews = viewsData?.reduce((sum, item) => sum + (item.page_views || 0), 0) || 0;

  // Get views growth by comparing last week to previous week
  const { data: previousWeekViews } = await supabase
    .from('site_metrics')
    .select('page_views')
    .eq('site_id', siteId)
    .gte('metric_date', twoWeeksAgo)
    .lt('metric_date', lastWeek);

  const previousTotal = previousWeekViews?.reduce((sum, item) => sum + (item.page_views || 0), 0) || 0;
  const viewsGrowth = previousTotal > 0 ? Math.round(((totalViews - previousTotal) / previousTotal) * 100) : 0;

  // Get content and product growth
  const { data: latestMetrics } = await supabase
    .from('site_metrics')
    .select('content_count, product_count')
    .eq('site_id', siteId)
    .order('metric_date', { ascending: false })
    .limit(1)
    .single();

  const { data: weekAgoMetrics } = await supabase
    .from('site_metrics')
    .select('content_count, product_count')
    .eq('site_id', siteId)
    .lte('metric_date', lastWeek)
    .order('metric_date', { ascending: false })
    .limit(1)
    .single();

  const contentGrowth = weekAgoMetrics?.content_count 
    ? Math.round(((latestMetrics?.content_count || 0) - weekAgoMetrics.content_count) / weekAgoMetrics.content_count * 100)
    : 0;

  const productGrowth = weekAgoMetrics?.product_count
    ? Math.round(((latestMetrics?.product_count || 0) - weekAgoMetrics.product_count) / weekAgoMetrics.product_count * 100)
    : 0;

  // For now, return 0 for orders until we have order data
  return {
    totalOrders: 0,
    newOrdersToday: 0,
    totalViews,
    viewsGrowth,
    contentGrowth,
    productGrowth,
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