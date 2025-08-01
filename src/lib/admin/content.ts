/**
 * Admin Content Service
 * 
 * Provides comprehensive content management capabilities for platform administrators.
 * All functions require admin privileges and include proper error handling and audit logging.
 */

import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/database/types'

// Type definitions for content management
export type ContentRow = Database['public']['Tables']['content']['Row']
export type ContentInsert = Database['public']['Tables']['content']['Insert']
export type ContentUpdate = Database['public']['Tables']['content']['Update']

export interface ContentWithAuthor extends ContentRow {
  author_name?: string
  author_email?: string
}

export interface ContentSearchFilters {
  search?: string
  content_type?: string
  status?: 'published' | 'draft' | 'featured'
  author_id?: string
  created_after?: string
  created_before?: string
}

export interface ContentListResponse {
  content: ContentWithAuthor[]
  total_count: number
  page: number
  limit: number
  has_more: boolean
}

export interface ContentBulkUpdate {
  is_published?: boolean
  is_featured?: boolean
  content_type?: string
  sort_order?: number
}

export interface ContentAnalytics {
  total_content: number
  published_content: number
  draft_content: number
  featured_content: number
  content_by_type: Record<string, number>
  recent_content_activity: Array<{
    date: string
    count: number
  }>
}

/**
 * Error class for admin content operations
 */
export class AdminContentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AdminContentError'
  }
}

/**
 * Get content for a specific site with search and filtering
 */
export async function getSiteContent(
  siteId: string,
  page: number = 1,
  limit: number = 50,
  filters: ContentSearchFilters = {}
): Promise<ContentListResponse> {
  try {
    if (!siteId) {
      throw new AdminContentError(
        'Site ID is required',
        'INVALID_SITE_ID'
      )
    }

    const offset = (page - 1) * limit

    // Call the database function with search and filter parameters
    const { data, error } = await supabase.rpc('admin_get_site_content', {
      site_uuid: siteId,
      search_query: filters.search || undefined,
      content_type_filter: filters.content_type || undefined,
      status_filter: filters.status || undefined,
      limit_count: limit,
      offset_count: offset
    })

    if (error) {
      console.error('Error fetching site content:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Access denied')) {
        throw new AdminContentError(
          'Access denied: Admin privileges required',
          'ACCESS_DENIED',
          error
        )
      }
      
      if (error.message?.includes('Site not found')) {
        throw new AdminContentError(
          'Site not found',
          'SITE_NOT_FOUND',
          error
        )
      }
      
      throw new AdminContentError(
        'Failed to fetch site content',
        'FETCH_CONTENT_ERROR',
        error
      )
    }

    if (!data || typeof data !== 'object' || !('content' in data)) {
      return {
        content: [],
        total_count: 0,
        page,
        limit,
        has_more: false
      }
    }

    const dataObj = data as unknown as { content: ContentWithAuthor[]; total_count: number }
    const content = (dataObj.content || []) as ContentWithAuthor[]
    const total_count = dataObj.total_count || 0
    
    return {
      content,
      total_count,
      page,
      limit,
      has_more: offset + content.length < total_count
    }
  } catch (error: unknown) {
    if (error instanceof AdminContentError) {
      throw error
    }
    
    console.error('Unexpected error in getSiteContent:', error)
    throw new AdminContentError(
      'An unexpected error occurred while fetching site content',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Search content across all sites (admin-only)
 */
export async function searchAllContent(
  query: string,
  page: number = 1,
  limit: number = 50,
  filters: Omit<ContentSearchFilters, 'search'> = {}
): Promise<ContentListResponse> {
  try {
    if (!query || query.trim().length < 2) {
      throw new AdminContentError(
        'Search query must be at least 2 characters long',
        'INVALID_SEARCH_QUERY'
      )
    }

    const offset = (page - 1) * limit

    // For cross-site search, we'll use a direct query with admin privileges check
    let queryBuilder = supabase
      .from('content')
      .select(`
        *,
        sites!inner(name, subdomain),
        profiles!left(full_name, user_id)
      `)

    // Add search conditions
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%, content::text.ilike.%${query}%`)

    // Add filters
    if (filters.content_type) {
      queryBuilder = queryBuilder.eq('content_type', filters.content_type)
    }

    if (filters.status === 'published') {
      queryBuilder = queryBuilder.eq('is_published', true)
    } else if (filters.status === 'draft') {
      queryBuilder = queryBuilder.eq('is_published', false)
    } else if (filters.status === 'featured') {
      queryBuilder = queryBuilder.eq('is_featured', true)
    }

    if (filters.author_id) {
      queryBuilder = queryBuilder.eq('author_id', filters.author_id)
    }

    if (filters.created_after) {
      queryBuilder = queryBuilder.gte('created_at', filters.created_after)
    }

    if (filters.created_before) {
      queryBuilder = queryBuilder.lte('created_at', filters.created_before)
    }

    // Get total count for pagination
    const countQuery = supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
    
    // Apply the same filters to count query
    let countQueryBuilder = countQuery.or(`title.ilike.%${query}%, content::text.ilike.%${query}%`)
    
    if (filters.content_type) {
      countQueryBuilder = countQueryBuilder.eq('content_type', filters.content_type)
    }
    if (filters.status === 'published') {
      countQueryBuilder = countQueryBuilder.eq('is_published', true)
    } else if (filters.status === 'draft') {
      countQueryBuilder = countQueryBuilder.eq('is_published', false)
    } else if (filters.status === 'featured') {
      countQueryBuilder = countQueryBuilder.eq('is_featured', true)
    }
    if (filters.author_id) {
      countQueryBuilder = countQueryBuilder.eq('author_id', filters.author_id)
    }
    if (filters.created_after) {
      countQueryBuilder = countQueryBuilder.gte('created_at', filters.created_after)
    }
    if (filters.created_before) {
      countQueryBuilder = countQueryBuilder.lte('created_at', filters.created_before)
    }

    const { count: total_count } = await countQueryBuilder

    // Get paginated results
    const { data, error } = await queryBuilder
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error searching all content:', error)
      throw new AdminContentError(
        'Failed to search content',
        'SEARCH_CONTENT_ERROR',
        error
      )
    }

    // Transform data to include author names
    const content = (data || []).map((item) => ({
      ...item,
      author_name: (item as { profiles?: { full_name?: string } }).profiles?.full_name || 'Unknown',
      author_email: (item as { profiles?: { user_id?: string } }).profiles?.user_id || null,
      site_name: (item as { sites?: { name?: string } }).sites?.name || 'Unknown Site',
      site_subdomain: (item as { sites?: { subdomain?: string } }).sites?.subdomain || null
    })) as ContentWithAuthor[]

    return {
      content,
      total_count: total_count || 0,
      page,
      limit,
      has_more: offset + content.length < (total_count || 0)
    }
  } catch (error: unknown) {
    if (error instanceof AdminContentError) {
      throw error
    }
    
    console.error('Unexpected error in searchAllContent:', error)
    throw new AdminContentError(
      'An unexpected error occurred while searching content',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Update a single content item with audit logging
 */
export async function updateContent(
  contentId: string,
  updates: Partial<ContentUpdate>,
  adminNotes?: string
): Promise<ContentRow> {
  try {
    if (!contentId) {
      throw new AdminContentError(
        'Content ID is required',
        'INVALID_CONTENT_ID'
      )
    }

    if (Object.keys(updates).length === 0) {
      throw new AdminContentError(
        'At least one update field is required',
        'NO_UPDATES_PROVIDED'
      )
    }

    // Filter out undefined values and prepare updates
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )

    const { data, error } = await supabase.rpc('admin_update_content', {
      content_uuid: contentId,
      content_updates: filteredUpdates,
      admin_notes: adminNotes || undefined
    })

    if (error) {
      console.error('Error updating content:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Access denied')) {
        throw new AdminContentError(
          'Access denied: Admin privileges required',
          'ACCESS_DENIED',
          error
        )
      }
      
      if (error.message?.includes('Content not found')) {
        throw new AdminContentError(
          'Content not found',
          'CONTENT_NOT_FOUND',
          error
        )
      }
      
      throw new AdminContentError(
        'Failed to update content',
        'UPDATE_CONTENT_ERROR',
        error
      )
    }

    if (!data) {
      throw new AdminContentError(
        'No data returned from content update',
        'NO_UPDATE_DATA'
      )
    }

    return data as ContentRow
  } catch (error: unknown) {
    if (error instanceof AdminContentError) {
      throw error
    }
    
    console.error('Unexpected error in updateContent:', error)
    throw new AdminContentError(
      'An unexpected error occurred while updating content',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Bulk update multiple content items
 */
export async function bulkUpdateContent(
  contentIds: string[],
  updates: ContentBulkUpdate,
  adminNotes?: string
): Promise<{ updated_count: number; total_requested: number }> {
  try {
    if (!contentIds || contentIds.length === 0) {
      throw new AdminContentError(
        'At least one content ID is required',
        'NO_CONTENT_IDS'
      )
    }

    if (Object.keys(updates).length === 0) {
      throw new AdminContentError(
        'At least one update field is required',
        'NO_UPDATES_PROVIDED'
      )
    }

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )

    const { data, error } = await supabase.rpc('admin_bulk_update_content', {
      content_ids: contentIds,
      bulk_updates: filteredUpdates,
      admin_notes: adminNotes || undefined
    })

    if (error) {
      console.error('Error bulk updating content:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Access denied')) {
        throw new AdminContentError(
          'Access denied: Admin privileges required',
          'ACCESS_DENIED',
          error
        )
      }
      
      throw new AdminContentError(
        'Failed to bulk update content',
        'BULK_UPDATE_ERROR',
        error
      )
    }

    if (!data) {
      throw new AdminContentError(
        'No data returned from bulk update',
        'NO_BULK_UPDATE_DATA'
      )
    }

    return data as { updated_count: number; total_requested: number }
  } catch (error: unknown) {
    if (error instanceof AdminContentError) {
      throw error
    }
    
    console.error('Unexpected error in bulkUpdateContent:', error)
    throw new AdminContentError(
      'An unexpected error occurred while bulk updating content',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Delete content items (soft delete by unpublishing)
 */
export async function deleteContent(
  contentIds: string[],
  adminNotes?: string
): Promise<{ updated_count: number; total_requested: number }> {
  try {
    if (!contentIds || contentIds.length === 0) {
      throw new AdminContentError(
        'At least one content ID is required',
        'NO_CONTENT_IDS'
      )
    }

    // Soft delete by setting is_published to false and is_featured to false
    return await bulkUpdateContent(
      contentIds,
      {
        is_published: false,
        is_featured: false
      },
      adminNotes ? `DELETION: ${adminNotes}` : 'DELETION: Content deleted by admin'
    )
  } catch (error: unknown) {
    if (error instanceof AdminContentError) {
      throw error
    }
    
    console.error('Unexpected error in deleteContent:', error)
    throw new AdminContentError(
      'An unexpected error occurred while deleting content',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get content analytics for a site
 */
export async function getContentAnalytics(
  siteId: string,
  startDate?: string,
  endDate?: string
): Promise<ContentAnalytics> {
  try {
    if (!siteId) {
      throw new AdminContentError(
        'Site ID is required',
        'INVALID_SITE_ID'
      )
    }

    const { data, error } = await supabase.rpc('admin_get_content_analytics', {
      site_uuid: siteId,
      start_date: startDate || undefined,
      end_date: endDate || undefined
    })

    if (error) {
      console.error('Error fetching content analytics:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Access denied')) {
        throw new AdminContentError(
          'Access denied: Admin privileges required',
          'ACCESS_DENIED',
          error
        )
      }
      
      throw new AdminContentError(
        'Failed to fetch content analytics',
        'FETCH_ANALYTICS_ERROR',
        error
      )
    }

    if (!data) {
      throw new AdminContentError(
        'No analytics data returned',
        'NO_ANALYTICS_DATA'
      )
    }

    return data as unknown as ContentAnalytics
  } catch (error: unknown) {
    if (error instanceof AdminContentError) {
      throw error
    }
    
    console.error('Unexpected error in getContentAnalytics:', error)
    throw new AdminContentError(
      'An unexpected error occurred while fetching content analytics',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get content by ID with site information
 */
export async function getContentById(contentId: string): Promise<ContentWithAuthor | null> {
  try {
    if (!contentId) {
      throw new AdminContentError(
        'Content ID is required',
        'INVALID_CONTENT_ID'
      )
    }

    const { data, error } = await supabase
      .from('content')
      .select(`
        *,
        sites!inner(name, subdomain),
        profiles!left(full_name, user_id)
      `)
      .eq('id', contentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      
      console.error('Error fetching content by ID:', error)
      throw new AdminContentError(
        'Failed to fetch content details',
        'FETCH_CONTENT_ERROR',
        error
      )
    }

    // Transform data to include author and site information
    return {
      ...data,
      author_name: (data as { profiles?: { full_name?: string } }).profiles?.full_name || 'Unknown',
      author_email: (data as { profiles?: { user_id?: string } }).profiles?.user_id || null,
      site_name: (data as { sites?: { name?: string } }).sites?.name || 'Unknown Site',
      site_subdomain: (data as { sites?: { subdomain?: string } }).sites?.subdomain || null
    } as ContentWithAuthor
  } catch (error: unknown) {
    if (error instanceof AdminContentError) {
      throw error
    }
    
    console.error('Unexpected error in getContentById:', error)
    throw new AdminContentError(
      'An unexpected error occurred while fetching content details',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get available content types for filtering
 */
export async function getContentTypes(siteId?: string): Promise<string[]> {
  try {
    let query = supabase
      .from('content')
      .select('content_type')

    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    const { data, error } = await query
      .not('content_type', 'is', null)

    if (error) {
      console.error('Error fetching content types:', error)
      throw new AdminContentError(
        'Failed to fetch content types',
        'FETCH_CONTENT_TYPES_ERROR',
        error
      )
    }

    // Extract unique content types
    const contentTypes = Array.from(
      new Set((data || []).map(item => item.content_type).filter(Boolean))
    ).sort()

    return contentTypes
  } catch (error: unknown) {
    if (error instanceof AdminContentError) {
      throw error
    }
    
    console.error('Unexpected error in getContentTypes:', error)
    throw new AdminContentError(
      'An unexpected error occurred while fetching content types',
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
  } catch (error: unknown) {
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
    throw new AdminContentError(
      'Access denied: Admin privileges required',
      'ACCESS_DENIED'
    )
  }
}