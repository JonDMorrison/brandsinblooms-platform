/**
 * Admin Audit Service
 * 
 * Provides comprehensive audit logging and retrieval capabilities for platform administrators.
 * All functions require admin privileges and include proper error handling.
 */

import { supabase } from '@/src/lib/supabase/client'
import type { Database } from '@/src/lib/database/types'

// Type definitions for audit logging
export interface AdminAction {
  id: string
  admin_user_id: string
  admin_user_email?: string
  admin_user_name?: string
  site_id: string
  site_name?: string
  action_type: string
  target_type: 'content' | 'product' | 'site' | 'user'
  target_id?: string
  old_values?: any
  new_values?: any
  action_details?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface AuditSearchFilters {
  site_id?: string
  admin_user_id?: string
  action_type?: string
  target_type?: 'content' | 'product' | 'site' | 'user'
  start_date?: string
  end_date?: string
  search?: string
}

export interface AuditLogResponse {
  logs: AdminAction[]
  total_count: number
  page: number
  limit: number
  has_more: boolean
}

export interface AuditSummary {
  total_actions: number
  actions_by_type: Record<string, number>
  actions_by_admin: Record<string, number>
  actions_by_target_type: Record<string, number>
  recent_activity: AdminAction[]
  most_active_admins: Array<{
    admin_id: string
    admin_name: string
    admin_email: string
    action_count: number
  }>
  most_affected_sites: Array<{
    site_id: string
    site_name: string
    action_count: number
  }>
}

/**
 * Error class for admin audit operations
 */
export class AdminAuditError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AdminAuditError'
  }
}

/**
 * Get admin action logs with filtering and pagination
 */
export async function getAdminActionLogs(
  page: number = 1,
  limit: number = 50,
  filters: AuditSearchFilters = {}
): Promise<AuditLogResponse> {
  try {
    const offset = (page - 1) * limit

    // Call the database function with filter parameters
    const { data, error } = await supabase.rpc('get_admin_action_logs', {
      site_uuid: filters.site_id || null,
      admin_user_uuid: filters.admin_user_id || null,
      action_type_filter: filters.action_type || null,
      target_type_filter: filters.target_type || null,
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      limit_count: limit,
      offset_count: offset
    })

    if (error) {
      console.error('Error fetching admin action logs:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Access denied')) {
        throw new AdminAuditError(
          'Access denied: Admin privileges required',
          'ACCESS_DENIED',
          error
        )
      }
      
      throw new AdminAuditError(
        'Failed to fetch admin action logs',
        'FETCH_LOGS_ERROR',
        error
      )
    }

    if (!data || typeof data !== 'object' || !('logs' in data)) {
      return {
        logs: [],
        total_count: 0,
        page,
        limit,
        has_more: false
      }
    }

    const dataObj = data as any
    const logs = (dataObj.logs || []) as AdminAction[]
    const total_count = dataObj.total_count || 0

    // Apply client-side search filtering if needed
    let filteredLogs = logs
    if (filters.search && filters.search.trim().length > 0) {
      const searchTerm = filters.search.toLowerCase()
      filteredLogs = logs.filter(log =>
        log.action_type.toLowerCase().includes(searchTerm) ||
        log.action_details?.toLowerCase().includes(searchTerm) ||
        log.admin_user_email?.toLowerCase().includes(searchTerm) ||
        log.admin_user_name?.toLowerCase().includes(searchTerm) ||
        log.site_name?.toLowerCase().includes(searchTerm)
      )
    }
    
    return {
      logs: filteredLogs,
      total_count,
      page,
      limit,
      has_more: offset + logs.length < total_count
    }
  } catch (error) {
    if (error instanceof AdminAuditError) {
      throw error
    }
    
    console.error('Unexpected error in getAdminActionLogs:', error)
    throw new AdminAuditError(
      'An unexpected error occurred while fetching admin action logs',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get audit logs for a specific site
 */
export async function getSiteAuditLogs(
  siteId: string,
  page: number = 1,
  limit: number = 50,
  filters: Omit<AuditSearchFilters, 'site_id'> = {}
): Promise<AuditLogResponse> {
  try {
    if (!siteId) {
      throw new AdminAuditError(
        'Site ID is required',
        'INVALID_SITE_ID'
      )
    }

    return await getAdminActionLogs(page, limit, {
      ...filters,
      site_id: siteId
    })
  } catch (error) {
    if (error instanceof AdminAuditError) {
      throw error
    }
    
    console.error('Unexpected error in getSiteAuditLogs:', error)
    throw new AdminAuditError(
      'An unexpected error occurred while fetching site audit logs',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get audit logs for a specific admin user
 */
export async function getAdminUserAuditLogs(
  adminUserId: string,
  page: number = 1,
  limit: number = 50,
  filters: Omit<AuditSearchFilters, 'admin_user_id'> = {}
): Promise<AuditLogResponse> {
  try {
    if (!adminUserId) {
      throw new AdminAuditError(
        'Admin user ID is required',
        'INVALID_ADMIN_USER_ID'
      )
    }

    return await getAdminActionLogs(page, limit, {
      ...filters,
      admin_user_id: adminUserId
    })
  } catch (error) {
    if (error instanceof AdminAuditError) {
      throw error
    }
    
    console.error('Unexpected error in getAdminUserAuditLogs:', error)
    throw new AdminAuditError(
      'An unexpected error occurred while fetching admin user audit logs',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get audit summary and statistics
 */
export async function getAuditSummary(
  startDate?: string,
  endDate?: string,
  siteId?: string
): Promise<AuditSummary> {
  try {
    // Get all logs within the date range (up to a reasonable limit)
    const response = await getAdminActionLogs(1, 1000, {
      start_date: startDate,
      end_date: endDate,
      site_id: siteId
    })

    const logs = response.logs

    // Calculate summary statistics
    const total_actions = logs.length
    const actions_by_type: Record<string, number> = {}
    const actions_by_admin: Record<string, number> = {}
    const actions_by_target_type: Record<string, number> = {}
    const admin_stats: Record<string, { name: string; email: string; count: number }> = {}
    const site_stats: Record<string, { name: string; count: number }> = {}

    logs.forEach(log => {
      // Count by action type
      actions_by_type[log.action_type] = (actions_by_type[log.action_type] || 0) + 1

      // Count by admin user
      const adminKey = log.admin_user_name || log.admin_user_email || log.admin_user_id
      actions_by_admin[adminKey] = (actions_by_admin[adminKey] || 0) + 1

      // Count by target type
      actions_by_target_type[log.target_type] = (actions_by_target_type[log.target_type] || 0) + 1

      // Track admin statistics
      if (log.admin_user_id) {
        if (!admin_stats[log.admin_user_id]) {
          admin_stats[log.admin_user_id] = {
            name: log.admin_user_name || 'Unknown',
            email: log.admin_user_email || 'Unknown',
            count: 0
          }
        }
        admin_stats[log.admin_user_id].count++
      }

      // Track site statistics
      if (log.site_id && log.site_name) {
        if (!site_stats[log.site_id]) {
          site_stats[log.site_id] = {
            name: log.site_name,
            count: 0
          }
        }
        site_stats[log.site_id].count++
      }
    })

    // Get recent activity (last 10 actions)
    const recent_activity = logs.slice(0, 10)

    // Get most active admins (top 5)
    const most_active_admins = Object.entries(admin_stats)
      .map(([admin_id, stats]) => ({
        admin_id,
        admin_name: stats.name,
        admin_email: stats.email,
        action_count: stats.count
      }))
      .sort((a, b) => b.action_count - a.action_count)
      .slice(0, 5)

    // Get most affected sites (top 5)
    const most_affected_sites = Object.entries(site_stats)
      .map(([site_id, stats]) => ({
        site_id,
        site_name: stats.name,
        action_count: stats.count
      }))
      .sort((a, b) => b.action_count - a.action_count)
      .slice(0, 5)

    return {
      total_actions,
      actions_by_type,
      actions_by_admin,
      actions_by_target_type,
      recent_activity,
      most_active_admins,
      most_affected_sites
    }
  } catch (error) {
    if (error instanceof AdminAuditError) {
      throw error
    }
    
    console.error('Unexpected error in getAuditSummary:', error)
    throw new AdminAuditError(
      'An unexpected error occurred while generating audit summary',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get audit log entry by ID
 */
export async function getAuditLogById(logId: string): Promise<AdminAction | null> {
  try {
    if (!logId) {
      throw new AdminAuditError(
        'Log ID is required',
        'INVALID_LOG_ID'
      )
    }

    const { data, error } = await supabase
      .from('admin_actions')
      .select(`
        *,
        profiles!left(full_name, user_id),
        sites!left(name)
      `)
      .eq('id', logId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      
      console.error('Error fetching audit log by ID:', error)
      throw new AdminAuditError(
        'Failed to fetch audit log details',
        'FETCH_LOG_ERROR',
        error
      )
    }

    // Transform data to include admin and site information
    return {
      ...data,
      admin_user_name: (data as any).profiles?.full_name || 'Unknown',
      admin_user_email: (data as any).profiles?.user_id || null,
      site_name: (data as any).sites?.name || 'Unknown Site'
    } as AdminAction
  } catch (error) {
    if (error instanceof AdminAuditError) {
      throw error
    }
    
    console.error('Unexpected error in getAuditLogById:', error)
    throw new AdminAuditError(
      'An unexpected error occurred while fetching audit log details',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Get available action types for filtering
 */
export async function getActionTypes(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('admin_actions')
      .select('action_type')
      .not('action_type', 'is', null)

    if (error) {
      console.error('Error fetching action types:', error)
      throw new AdminAuditError(
        'Failed to fetch action types',
        'FETCH_ACTION_TYPES_ERROR',
        error
      )
    }

    // Extract unique action types
    const actionTypes = Array.from(
      new Set((data || []).map(item => item.action_type).filter(Boolean))
    ).sort()

    return actionTypes
  } catch (error) {
    if (error instanceof AdminAuditError) {
      throw error
    }
    
    console.error('Unexpected error in getActionTypes:', error)
    throw new AdminAuditError(
      'An unexpected error occurred while fetching action types',
      'UNEXPECTED_ERROR',
      error
    )
  }
}

/**
 * Export audit logs to CSV format
 */
export async function exportAuditLogsToCSV(
  filters: AuditSearchFilters = {}
): Promise<string> {
  try {
    // Get all logs matching the filters (no pagination)
    const response = await getAdminActionLogs(1, 10000, filters)
    const logs = response.logs

    if (logs.length === 0) {
      return 'No audit logs found matching the specified criteria.'
    }

    // Define CSV headers
    const headers = [
      'ID', 'Admin User Email', 'Admin User Name', 'Site Name', 'Action Type',
      'Target Type', 'Target ID', 'Action Details', 'IP Address', 'User Agent', 'Created At'
    ]

    // Convert logs to CSV rows
    const csvRows = logs.map(log => [
      log.id,
      log.admin_user_email || '',
      log.admin_user_name || '',
      log.site_name || '',
      log.action_type,
      log.target_type,
      log.target_id || '',
      log.action_details || '',
      log.ip_address || '',
      log.user_agent || '',
      log.created_at
    ])

    // Combine headers and rows into CSV format
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return csvContent
  } catch (error) {
    if (error instanceof AdminAuditError) {
      throw error
    }
    
    console.error('Unexpected error in exportAuditLogsToCSV:', error)
    throw new AdminAuditError(
      'An unexpected error occurred while exporting audit logs',
      'EXPORT_ERROR',
      error
    )
  }
}

/**
 * Search audit logs across all fields
 */
export async function searchAuditLogs(
  query: string,
  page: number = 1,
  limit: number = 50,
  filters: Omit<AuditSearchFilters, 'search'> = {}
): Promise<AuditLogResponse> {
  try {
    if (!query || query.trim().length < 2) {
      throw new AdminAuditError(
        'Search query must be at least 2 characters long',
        'INVALID_SEARCH_QUERY'
      )
    }

    return await getAdminActionLogs(page, limit, {
      ...filters,
      search: query
    })
  } catch (error) {
    if (error instanceof AdminAuditError) {
      throw error
    }
    
    console.error('Unexpected error in searchAuditLogs:', error)
    throw new AdminAuditError(
      'An unexpected error occurred while searching audit logs',
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
    throw new AdminAuditError(
      'Access denied: Admin privileges required',
      'ACCESS_DENIED'
    )
  }
}