import { supabase } from '@/src/lib/supabase/client'
import { Json } from '@/src/lib/database/types'

// Audit action types
export type AuditActionType = 
  | 'impersonation_start'
  | 'impersonation_end' 
  | 'impersonation_cleanup'
  | 'site_create'
  | 'site_update'
  | 'site_delete'
  | 'content_create'
  | 'content_update'
  | 'content_delete'
  | 'content_bulk_update'
  | 'product_create'
  | 'product_update'
  | 'product_delete'
  | 'product_bulk_update'
  | 'user_access_grant'
  | 'user_access_revoke'
  | 'template_create'
  | 'template_update'
  | 'template_delete'

// Target types for audit logging
export type AuditTargetType = 'site' | 'content' | 'product' | 'user' | 'template' | 'system'

// Admin audit log entry
export interface AdminAuditLogEntry {
  id: string
  admin_user_id: string
  admin_user_email: string
  admin_user_name: string
  site_id: string
  site_name: string
  action_type: AuditActionType
  target_type: AuditTargetType
  target_id?: string
  old_values?: Json
  new_values?: Json
  action_details?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Audit log query filters
export interface AuditLogFilters {
  siteId?: string
  adminUserId?: string
  actionType?: AuditActionType
  targetType?: AuditTargetType
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

// Audit log query result
export interface AuditLogResult {
  logs: AdminAuditLogEntry[]
  totalCount: number
}

/**
 * Log an admin action for audit purposes
 */
export async function logAdminAction(
  siteId: string,
  actionType: AuditActionType,
  targetType: AuditTargetType,
  targetId?: string,
  oldValues?: Json,
  newValues?: Json,
  details?: string
): Promise<string | null> {
  try {
    // Get client info
    const ipAddress = null // Will be populated server-side if available
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null

    const { data, error } = await supabase.rpc('log_admin_action', {
      admin_id: '', // Will be populated server-side with auth.uid()
      site_uuid: siteId,
      action_type_val: actionType,
      target_type_val: targetType,
      target_uuid: targetId || undefined,
      old_vals: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
      new_vals: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
      details: details || undefined,
      ip_addr: ipAddress,
      user_agent_val: userAgent || undefined
    })

    if (error) {
      console.error('Error logging admin action:', error)
      return null
    }

    return data as string
  } catch (err: unknown) {
    console.error('Unexpected error logging admin action:', err)
    return null
  }
}

/**
 * Get admin audit logs with filtering
 */
export async function getAdminAuditLogs(
  filters: AuditLogFilters = {}
): Promise<AuditLogResult | null> {
  try {
    const { data, error } = await supabase.rpc('get_admin_action_logs', {
      site_uuid: filters.siteId || undefined,
      admin_user_uuid: filters.adminUserId || undefined,
      action_type_filter: filters.actionType || undefined,
      target_type_filter: filters.targetType || undefined,
      start_date: filters.startDate?.toISOString() || undefined,
      end_date: filters.endDate?.toISOString() || undefined,
      limit_count: filters.limit || 50,
      offset_count: filters.offset || 0
    })

    if (error) {
      console.error('Error fetching admin audit logs:', error)
      return null
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { logs: [], totalCount: 0 }
    }
    
    const result = data as unknown as { logs: AdminAuditLogEntry[]; total_count: number }
    return {
      logs: result?.logs || [],
      totalCount: result?.total_count || 0
    }
  } catch (err: unknown) {
    console.error('Unexpected error fetching admin audit logs:', err)
    return null
  }
}

/**
 * Get impersonation audit logs specifically
 */
export async function getImpersonationAuditLogs(
  siteId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<AuditLogResult | null> {
  const impersonationActions: AuditActionType[] = [
    'impersonation_start',
    'impersonation_end',
    'impersonation_cleanup'
  ]

  try {
    // Get logs for all impersonation actions
    const allLogs: AdminAuditLogEntry[] = []
    let totalCount = 0

    for (const actionType of impersonationActions) {
      const result = await getAdminAuditLogs({
        siteId,
        actionType,
        limit: Math.ceil(limit / impersonationActions.length),
        offset: Math.floor(offset / impersonationActions.length)
      })

      if (result) {
        allLogs.push(...result.logs)
        totalCount += result.totalCount
      }
    }

    // Sort by created_at descending
    allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply limit and offset to combined results
    const startIndex = offset
    const endIndex = offset + limit
    const paginatedLogs = allLogs.slice(startIndex, endIndex)

    return {
      logs: paginatedLogs,
      totalCount
    }
  } catch (err: unknown) {
    console.error('Error fetching impersonation audit logs:', err)
    return null
  }
}

/**
 * Format action details for display
 */
export function formatActionDetails(
  actionType: AuditActionType,
  targetType: AuditTargetType,
  oldValues?: Json,
  newValues?: Json,
  details?: string
): string {
  if (details) return details

  switch (actionType) {
    case 'impersonation_start':
      const values1 = newValues as Record<string, unknown> | undefined
      const duration = values1?.duration_hours
      const purpose = values1?.purpose
      return `Started impersonation session${duration ? ` for ${duration} hours` : ''}${purpose ? ` (${purpose})` : ''}`

    case 'impersonation_end':
      const values2 = newValues as Record<string, unknown> | undefined
      const endReason = values2?.end_reason
      const sessionDuration = values2?.duration as number | undefined
      return `Ended impersonation session${endReason ? ` (${endReason})` : ''}${sessionDuration ? ` after ${sessionDuration.toFixed(1)} hours` : ''}`

    case 'site_create':
      const values3 = newValues as Record<string, unknown> | undefined
      return `Created site: ${values3?.name || 'Unnamed'}`

    case 'site_update':
      const oldSite = oldValues as Record<string, unknown> | undefined
      const newSite = newValues as Record<string, unknown> | undefined
      const changes = []
      if (oldSite?.name !== newSite?.name) {
        changes.push(`name: "${oldSite?.name}" → "${newSite?.name}"`)
      }
      if (oldSite?.is_published !== newSite?.is_published) {
        changes.push(`published: ${oldSite?.is_published} → ${newSite?.is_published}`)
      }
      return changes.length > 0 ? `Updated ${changes.join(', ')}` : 'Updated site settings'

    case 'content_update':
      const oldContent = oldValues as Record<string, unknown> | undefined
      const newContent = newValues as Record<string, unknown> | undefined
      const contentChanges = []
      if (oldContent?.title !== newContent?.title) {
        contentChanges.push(`title: "${oldContent?.title}" → "${newContent?.title}"`)
      }
      if (oldContent?.is_published !== newContent?.is_published) {
        contentChanges.push(`published: ${oldContent?.is_published} → ${newContent?.is_published}`)
      }
      return contentChanges.length > 0 ? `Updated ${contentChanges.join(', ')}` : 'Updated content'

    case 'product_update':
      const oldProduct = oldValues as Record<string, unknown> | undefined
      const newProduct = newValues as Record<string, unknown> | undefined
      const productChanges = []
      if (oldProduct?.name !== newProduct?.name) {
        productChanges.push(`name: "${oldProduct?.name}" → "${newProduct?.name}"`)
      }
      if (oldProduct?.price !== newProduct?.price) {
        productChanges.push(`price: $${oldProduct?.price} → $${newProduct?.price}`)
      }
      if (oldProduct?.is_active !== newProduct?.is_active) {
        productChanges.push(`active: ${oldProduct?.is_active} → ${newProduct?.is_active}`)
      }
      return productChanges.length > 0 ? `Updated ${productChanges.join(', ')}` : 'Updated product'

    default:
      const actionVerb = actionType.includes('create') ? 'Created' : 
                       actionType.includes('update') ? 'Updated' : 
                       actionType.includes('delete') ? 'Deleted' : 'Modified'
      return `${actionVerb} ${targetType}`
  }
}

/**
 * Get display-friendly action type name
 */
export function getActionTypeDisplay(actionType: AuditActionType): string {
  const actionMap: Record<AuditActionType, string> = {
    'impersonation_start': 'Started Impersonation',
    'impersonation_end': 'Ended Impersonation',
    'impersonation_cleanup': 'Cleaned Up Sessions',
    'site_create': 'Created Site',
    'site_update': 'Updated Site',
    'site_delete': 'Deleted Site',
    'content_create': 'Created Content',
    'content_update': 'Updated Content',
    'content_delete': 'Deleted Content',
    'content_bulk_update': 'Bulk Updated Content',
    'product_create': 'Created Product',
    'product_update': 'Updated Product',
    'product_delete': 'Deleted Product',
    'product_bulk_update': 'Bulk Updated Products',
    'user_access_grant': 'Granted User Access',
    'user_access_revoke': 'Revoked User Access',
    'template_create': 'Created Template',
    'template_update': 'Updated Template',
    'template_delete': 'Deleted Template',
  }

  return actionMap[actionType] || actionType
}

/**
 * Get action type color for UI display
 */
export function getActionTypeColor(actionType: AuditActionType): string {
  if (actionType.includes('create')) return 'text-green-600'
  if (actionType.includes('update')) return 'text-blue-600'
  if (actionType.includes('delete')) return 'text-red-600'
  if (actionType.includes('impersonation')) return 'text-orange-600'
  if (actionType.includes('access')) return 'text-purple-600'
  return 'text-gray-600'
}

/**
 * Validate audit log filters
 */
export function validateAuditLogFilters(filters: AuditLogFilters): string[] {
  const errors: string[] = []

  if (filters.limit && (filters.limit < 1 || filters.limit > 1000)) {
    errors.push('Limit must be between 1 and 1000')
  }

  if (filters.offset && filters.offset < 0) {
    errors.push('Offset must be non-negative')
  }

  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    errors.push('Start date must be before end date')
  }

  return errors
}