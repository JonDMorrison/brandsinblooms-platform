/**
 * Admin Sites Service
 * 
 * Provides comprehensive site management capabilities for platform administrators.
 * All functions require admin privileges and include proper error handling.
 */

import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/database/types'

// Type definitions for site templates
export interface SiteTemplate {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  preview_image_url: string | null
  template_config: any
  default_content: any | null
  default_products: any | null
  default_business_hours: any | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface SiteCreationRequest {
  template_slug: string
  site_name: string
  site_subdomain: string
  owner_email: string
  business_info?: {
    business_name?: string
    business_email?: string
    business_phone?: string
    business_address?: string
    primary_color?: string
    business_hours?: any
  }
}

export interface SiteCreationResult {
  site_id: string
  site_name: string
  subdomain: string
  template_used: string
  owner_email: string
  created_at: string
  content_created: number
  products_created: number
}

export interface SiteConfigurationUpdate {
  name?: string
  description?: string
  business_name?: string
  business_email?: string
  business_phone?: string
  business_address?: string
  business_hours?: any
  primary_color?: string
  logo_url?: string
  custom_domain?: string
  is_active?: boolean
  is_published?: boolean
  timezone?: string
  latitude?: number
  longitude?: number
  admin_notes?: string
}

// Type definitions for admin site operations
export interface SiteWithStats {
  id: string
  name: string
  subdomain: string
  custom_domain: string | null
  business_name: string | null
  business_email: string | null
  is_active: boolean | null
  is_published: boolean | null
  created_at: string
  updated_at: string
  last_activity_at: string | null
  admin_notes: string | null
  owner_count: number
  content_count: number
  product_count: number
  inquiry_count: number
  recent_inquiries: number
}

export interface SiteSearchFilters {
  search?: string
  status?: 'active' | 'inactive' | 'published' | 'draft'
  created_after?: string
  created_before?: string
  has_custom_domain?: boolean
  has_activity_since?: string
}

export interface SiteListResponse {
  sites: SiteWithStats[]
  total_count: number
  page: number
  limit: number
  has_more: boolean
}

export interface SiteStats {
  site_id: string
  total_content: number
  published_content: number
  draft_content: number
  featured_content: number
  total_products: number
  active_products: number
  featured_products: number
  out_of_stock_products: number
  total_inquiries: number
  recent_inquiries: number
  unread_inquiries: number
  site_owners: number
  total_members: number
  media_files: number
  import_batches: number
  last_content_update: string | null
  last_product_update: string | null
  last_inquiry: string | null
  generated_at: string
}

export interface SiteStatusUpdate {
  is_active?: boolean
  is_published?: boolean
  admin_notes?: string
}

/**
 * Error class for admin site operations
 */
export class AdminSiteError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AdminSiteError'
  }
}

/**
 * Get all sites with basic statistics and filtering support
 */
export async function getAllSites(
  page: number = 1,
  limit: number = 50,
  filters: SiteSearchFilters = {}
): Promise<SiteListResponse> {
  try {
    const offset = (page - 1) * limit
    
    // Call the database function with search and filter parameters
    const { data, error } = await supabase.rpc('get_all_sites_with_stats', {
      search_query: filters.search || undefined,
      status_filter: filters.status || undefined,
      limit_count: limit,
      offset_count: offset
    })

    if (error) {
      console.error('Error fetching sites:', error)
      throw new AdminSiteError(
        'Failed to fetch sites',
        'FETCH_SITES_ERROR',
        error
      )
    }

    if (!data || typeof data !== 'object' || !('sites' in data)) {
      return {
        sites: [],
        total_count: 0,
        page,
        limit,
        has_more: false
      }
    }

    const dataObj = data as any
    const sites = (dataObj.sites || []) as SiteWithStats[]
    const total_count = dataObj.total_count || 0
    
    return {
      sites,
      total_count,
      page,
      limit,
      has_more: offset + sites.length < total_count
    }
  } catch (error) {
    if (error instanceof AdminSiteError) {
      throw error
    }
    
    console.error('Unexpected error in getAllSites:', error)
    throw new AdminSiteError(
      'An unexpected error occurred while fetching sites',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Search sites with advanced filtering capabilities
 */
export async function searchSites(
  query: string,
  filters: SiteSearchFilters = {},
  page: number = 1,
  limit: number = 50
): Promise<SiteListResponse> {
  try {
    // Use the same function as getAllSites but with search query
    return await getAllSites(page, limit, {
      ...filters,
      search: query
    })
  } catch (error) {
    if (error instanceof AdminSiteError) {
      throw error
    }
    
    console.error('Unexpected error in searchSites:', error)
    throw new AdminSiteError(
      'An unexpected error occurred while searching sites',
      'SEARCH_ERROR',
      error
    )
  }
}

/**
 * Get comprehensive statistics for a specific site
 */
export async function getSiteStats(siteId: string): Promise<SiteStats> {
  try {
    if (!siteId) {
      throw new AdminSiteError(
        'Site ID is required',
        'INVALID_SITE_ID'
      )
    }

    const { data, error } = await supabase.rpc('get_site_summary_stats', {
      site_uuid: siteId
    })

    if (error) {
      console.error('Error fetching site stats:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Access denied')) {
        throw new AdminSiteError(
          'Access denied: Admin privileges required',
          'ACCESS_DENIED',
          error
        )
      }
      
      if (error.message?.includes('Site not found')) {
        throw new AdminSiteError(
          'Site not found',
          'SITE_NOT_FOUND',
          error
        )
      }
      
      throw new AdminSiteError(
        'Failed to fetch site statistics',
        'FETCH_STATS_ERROR',
        error
      )
    }

    if (!data) {
      throw new AdminSiteError(
        'No statistics data returned for site',
        'NO_STATS_DATA'
      )
    }

    return data as unknown as SiteStats
  } catch (error) {
    if (error instanceof AdminSiteError) {
      throw error
    }
    
    console.error('Unexpected error in getSiteStats:', error)
    throw new AdminSiteError(
      'An unexpected error occurred while fetching site statistics',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Update site status and admin notes
 */
export async function updateSiteStatus(
  siteId: string,
  updates: SiteStatusUpdate
): Promise<boolean> {
  try {
    if (!siteId) {
      throw new AdminSiteError(
        'Site ID is required',
        'INVALID_SITE_ID'
      )
    }

    if (Object.keys(updates).length === 0) {
      throw new AdminSiteError(
        'At least one update field is required',
        'NO_UPDATES_PROVIDED'
      )
    }

    const { data, error } = await supabase.rpc('admin_update_site_status', {
      site_uuid: siteId,
      new_is_active: updates.is_active,
      new_is_published: updates.is_published,
      notes: updates.admin_notes
    })

    if (error) {
      console.error('Error updating site status:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Access denied')) {
        throw new AdminSiteError(
          'Access denied: Admin privileges required',
          'ACCESS_DENIED',
          error
        )
      }
      
      if (error.message?.includes('Site not found')) {
        throw new AdminSiteError(
          'Site not found',
          'SITE_NOT_FOUND',
          error
        )
      }
      
      throw new AdminSiteError(
        'Failed to update site status',
        'UPDATE_STATUS_ERROR',
        error
      )
    }

    return data === true
  } catch (error) {
    if (error instanceof AdminSiteError) {
      throw error
    }
    
    console.error('Unexpected error in updateSiteStatus:', error)
    throw new AdminSiteError(
      'An unexpected error occurred while updating site status',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get site details by ID (basic site information)
 */
export async function getSiteById(siteId: string): Promise<Database['public']['Tables']['sites']['Row'] | null> {
  try {
    if (!siteId) {
      throw new AdminSiteError(
        'Site ID is required',
        'INVALID_SITE_ID'
      )
    }

    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      
      console.error('Error fetching site by ID:', error)
      throw new AdminSiteError(
        'Failed to fetch site details',
        'FETCH_SITE_ERROR',
        error
      )
    }

    return data
  } catch (error) {
    if (error instanceof AdminSiteError) {
      throw error
    }
    
    console.error('Unexpected error in getSiteById:', error)
    throw new AdminSiteError(
      'An unexpected error occurred while fetching site details',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get site metrics for a specific date range
 */
export async function getSiteMetrics(
  siteId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 30
): Promise<Database['public']['Tables']['site_metrics']['Row'][]> {
  try {
    if (!siteId) {
      throw new AdminSiteError(
        'Site ID is required',
        'INVALID_SITE_ID'
      )
    }

    let query = supabase
      .from('site_metrics')
      .select('*')
      .eq('site_id', siteId)
      .order('metric_date', { ascending: false })
      .limit(limit)

    if (startDate) {
      query = query.gte('metric_date', startDate)
    }

    if (endDate) {
      query = query.lte('metric_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching site metrics:', error)
      throw new AdminSiteError(
        'Failed to fetch site metrics',
        'FETCH_METRICS_ERROR',
        error
      )
    }

    return data || []
  } catch (error) {
    if (error instanceof AdminSiteError) {
      throw error
    }
    
    console.error('Unexpected error in getSiteMetrics:', error)
    throw new AdminSiteError(
      'An unexpected error occurred while fetching site metrics',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Check if the current user has admin privileges
 */
export async function checkAdminAccess(): Promise<boolean> {
  try {
    const { data: user, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user.user) {
      return false
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.user.id)
      .single()

    if (error || !data) {
      return false
    }

    return data.role === 'admin'
  } catch (error) {
    console.error('Error checking admin access:', error)
    return false
  }
}

/**
 * Utility function to validate admin access and throw error if not authorized
 */
export async function requireAdminAccess(): Promise<void> {
  const hasAccess = await checkAdminAccess()
  if (!hasAccess) {
    throw new AdminSiteError(
      'Access denied: Admin privileges required',
      'ACCESS_DENIED'
    )
  }
}

/**
 * Get sites with recent activity (for admin dashboard)
 */
export async function getRecentActivity(limit: number = 10): Promise<SiteWithStats[]> {
  try {
    await requireAdminAccess()

    const response = await getAllSites(1, limit, {})
    return response.sites.filter(site => site.last_activity_at)
      .sort((a, b) => new Date(b.last_activity_at!).getTime() - new Date(a.last_activity_at!).getTime())
  } catch (error) {
    if (error instanceof AdminSiteError) {
      throw error
    }
    
    console.error('Unexpected error in getRecentActivity:', error)
    throw new AdminSiteError(
      'An unexpected error occurred while fetching recent activity',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get sites that need attention (inactive, no content, etc.)
 */
export async function getSitesNeedingAttention(): Promise<SiteWithStats[]> {
  try {
    await requireAdminAccess()

    const response = await getAllSites(1, 100, {})
    
    return response.sites.filter(site => {
      // Sites that need attention:
      // 1. Inactive sites
      // 2. Sites with no content
      // 3. Sites with no products
      // 4. Sites with no recent activity (30+ days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      return (
        !site.is_active ||
        site.content_count === 0 ||
        site.product_count === 0 ||
        !site.last_activity_at ||
        new Date(site.last_activity_at) < thirtyDaysAgo
      )
    })
  } catch (error) {
    if (error instanceof AdminSiteError) {
      throw error
    }
    
    console.error('Unexpected error in getSitesNeedingAttention:', error)
    throw new AdminSiteError(
      'An unexpected error occurred while fetching sites needing attention',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

// =====================================================
// TEMPLATE MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Get all available site templates
 */
export async function getSiteTemplates(
  category?: string,
  activeOnly: boolean = true
): Promise<SiteTemplate[]> {
  try {
    const { data, error } = await supabase.rpc('get_site_templates', {
      category_filter: category || undefined,
      active_only: activeOnly
    })

    if (error) {
      console.error('Error fetching site templates:', error)
      throw new AdminSiteError(
        'Failed to fetch site templates',
        'FETCH_TEMPLATES_ERROR',
        error
      )
    }

    if (!data || typeof data !== 'object' || !('templates' in data)) {
      return []
    }

    return (data as any).templates || []
  } catch (error) {
    if (error instanceof AdminSiteError) {
      throw error
    }
    
    console.error('Unexpected error in getSiteTemplates:', error)
    throw new AdminSiteError(
      'An unexpected error occurred while fetching site templates',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get a specific template by slug
 */
export async function getTemplateBySlug(slug: string): Promise<SiteTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('site_templates')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      
      console.error('Error fetching template by slug:', error)
      throw new AdminSiteError(
        'Failed to fetch template',
        'FETCH_TEMPLATE_ERROR',
        error
      )
    }

    return data as unknown as SiteTemplate
  } catch (error) {
    if (error instanceof AdminSiteError) {
      throw error
    }
    
    console.error('Unexpected error in getTemplateBySlug:', error)
    throw new AdminSiteError(
      'An unexpected error occurred while fetching template',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Check if a subdomain is available
 */
export async function checkSubdomainAvailability(subdomain: string): Promise<boolean> {
  try {
    if (!subdomain || subdomain.length < 3) {
      throw new AdminSiteError(
        'Subdomain must be at least 3 characters long',
        'INVALID_SUBDOMAIN'
      )
    }

    // Basic validation
    const subdomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/
    if (!subdomainRegex.test(subdomain)) {
      throw new AdminSiteError(
        'Subdomain can only contain letters, numbers, and hyphens',
        'INVALID_SUBDOMAIN'
      )
    }

    const { data, error } = await supabase.rpc('check_subdomain_availability', {
      subdomain_to_check: subdomain.toLowerCase()
    })

    if (error) {
      console.error('Error checking subdomain availability:', error)
      throw new AdminSiteError(
        'Failed to check subdomain availability',
        'SUBDOMAIN_CHECK_ERROR',
        error
      )
    }

    return data === true
  } catch (error) {
    if (error instanceof AdminSiteError) {
      throw error
    }
    
    console.error('Unexpected error in checkSubdomainAvailability:', error)
    throw new AdminSiteError(
      'An unexpected error occurred while checking subdomain availability',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Create a new site using a template
 */
export async function createSiteWithTemplate(
  request: SiteCreationRequest
): Promise<SiteCreationResult> {
  try {
    await requireAdminAccess()

    // Validate request
    if (!request.template_slug || !request.site_name || !request.site_subdomain || !request.owner_email) {
      throw new AdminSiteError(
        'Missing required fields: template_slug, site_name, site_subdomain, owner_email',
        'INVALID_REQUEST'
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(request.owner_email)) {
      throw new AdminSiteError(
        'Invalid email format',
        'INVALID_EMAIL'
      )
    }

    // Check subdomain availability first
    const isAvailable = await checkSubdomainAvailability(request.site_subdomain)
    if (!isAvailable) {
      throw new AdminSiteError(
        `Subdomain "${request.site_subdomain}" is already taken`,
        'SUBDOMAIN_TAKEN'
      )
    }

    // Call the database function to create the site
    const { data, error } = await supabase.rpc('create_site_with_template', {
      template_slug: request.template_slug,
      site_name: request.site_name,
      site_subdomain: request.site_subdomain.toLowerCase(),
      owner_email: request.owner_email.toLowerCase(),
      business_info: request.business_info || null
    })

    if (error) {
      console.error('Error creating site with template:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Template not found')) {
        throw new AdminSiteError(
          'Selected template is not available',
          'TEMPLATE_NOT_FOUND',
          error
        )
      }
      
      if (error.message?.includes('Owner email not found')) {
        throw new AdminSiteError(
          'Owner email address is not registered in the system',
          'OWNER_NOT_FOUND',
          error
        )
      }
      
      if (error.message?.includes('Subdomain already exists')) {
        throw new AdminSiteError(
          'Subdomain is already taken',
          'SUBDOMAIN_TAKEN',
          error
        )
      }
      
      throw new AdminSiteError(
        'Failed to create site with template',
        'SITE_CREATION_ERROR',
        error
      )
    }

    if (!data) {
      throw new AdminSiteError(
        'No data returned from site creation',
        'NO_CREATION_DATA'
      )
    }

    return data as unknown as SiteCreationResult
  } catch (error) {
    if (error instanceof AdminSiteError) {
      throw error
    }
    
    console.error('Unexpected error in createSiteWithTemplate:', error)
    throw new AdminSiteError(
      'An unexpected error occurred while creating site',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Update site configuration
 */
export async function updateSiteConfiguration(
  siteId: string,
  updates: SiteConfigurationUpdate
): Promise<boolean> {
  try {
    await requireAdminAccess()

    if (!siteId) {
      throw new AdminSiteError(
        'Site ID is required',
        'INVALID_SITE_ID'
      )
    }

    if (Object.keys(updates).length === 0) {
      throw new AdminSiteError(
        'At least one update field is required',
        'NO_UPDATES_PROVIDED'
      )
    }

    // Prepare the update object, filtering out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )

    // Add updated_at timestamp
    filteredUpdates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('sites')
      .update(filteredUpdates)
      .eq('id', siteId)
      .select()

    if (error) {
      console.error('Error updating site configuration:', error)
      throw new AdminSiteError(
        'Failed to update site configuration',
        'UPDATE_CONFIG_ERROR',
        error
      )
    }

    if (!data || data.length === 0) {
      throw new AdminSiteError(
        'Site not found or no changes made',
        'SITE_NOT_FOUND'
      )
    }

    return true
  } catch (error) {
    if (error instanceof AdminSiteError) {
      throw error
    }
    
    console.error('Unexpected error in updateSiteConfiguration:', error)
    throw new AdminSiteError(
      'An unexpected error occurred while updating site configuration',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get comprehensive site details including configuration
 */
export async function getSiteConfiguration(siteId: string): Promise<Database['public']['Tables']['sites']['Row'] | null> {
  try {
    await requireAdminAccess()

    return await getSiteById(siteId)
  } catch (error) {
    if (error instanceof AdminSiteError) {
      throw error
    }
    
    console.error('Unexpected error in getSiteConfiguration:', error)
    throw new AdminSiteError(
      'An unexpected error occurred while fetching site configuration',
      'UNEXPECTED_ERROR',
      error
    )
  }
}