'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  Filter, 
  Download,
  RefreshCw,
  AlertCircle,
  Calendar,
  User,
  Activity,
  FileText,
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Badge } from '@/src/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { toast } from 'sonner'
import { 
  getAdminAuditLogs,
  getImpersonationAuditLogs,
  formatActionDetails,
  getActionTypeDisplay,
  getActionTypeColor,
  validateAuditLogFilters,
  type AdminAuditLogEntry,
  type AuditLogFilters,
  type AuditLogResult,
  type AuditActionType,
  type AuditTargetType
} from '@/src/lib/admin/audit-logging'

interface AdminActionLogProps {
  siteId?: string
  siteName?: string
  adminUserId?: string
  adminUserName?: string
  showFilters?: boolean
  showSummary?: boolean
  limit?: number
}

export function AdminActionLog({ 
  siteId, 
  siteName, 
  adminUserId, 
  adminUserName,
  showFilters = true,
  showSummary = true,
  limit = 50 
}: AdminActionLogProps) {
  const [logs, setLogs] = useState<AdminAuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AuditLogFilters>({
    siteId: siteId,
    adminUserId: adminUserId,
    limit: limit
  })
  const [totalCount, setTotalCount] = useState(0)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Load audit logs
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Validate filters
      const validationErrors = validateAuditLogFilters(filters)
      if (validationErrors.length > 0) {
        setError(validationErrors[0])
        return
      }

      const result = await getAdminAuditLogs(filters)

      if (result) {
        setLogs(result.logs)
        setTotalCount(result.totalCount)
      } else {
        setError('Failed to load audit logs')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audit logs'
      setError(errorMessage)
      toast.error(`Error loading audit logs: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Initial load and filter changes
  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<AuditLogFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Handle export (simplified)
  const handleExport = async () => {
    toast.info('Export functionality coming soon')
  }

  // Toggle row expansion
  const toggleRowExpansion = (logId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedRows(newExpanded)
  }

  const getActionTypeBadge = (actionType: AuditActionType) => {
    const displayName = getActionTypeDisplay(actionType)
    const colorClass = getActionTypeColor(actionType)
    
    if (actionType.includes('create')) {
      return <Badge variant="default" className="bg-gray-1000 hover:bg-green-600">{displayName}</Badge>
    }
    if (actionType.includes('update')) {
      return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">{displayName}</Badge>
    }
    if (actionType.includes('delete')) {
      return <Badge variant="destructive">{displayName}</Badge>
    }
    if (actionType.includes('impersonation')) {
      return <Badge variant="default" className="bg-gray-100 hover:bg-orange-600">{displayName}</Badge>
    }
    
    return <Badge variant="secondary">{displayName}</Badge>
  }

  const getTargetTypeBadge = (targetType: AuditTargetType) => {
    const colors = {
      content: 'bg-blue-500 hover:bg-blue-600',
      product: 'bg-gray-1000 hover:bg-green-600',
      site: 'bg-gray-100 hover:bg-orange-600',
      user: 'bg-purple-500 hover:bg-purple-600',
      template: 'bg-indigo-500 hover:bg-indigo-600',
      system: 'bg-gray-500 hover:bg-gray-600'
    }
    
    return (
      <Badge variant="default" className={colors[targetType] || 'bg-gray-500'}>
        {targetType}
      </Badge>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {siteId ? `Activity Log - ${siteName}` : 'Admin Activity Log'}
          </h2>
          <p className="text-gray-500">
            {adminUserId 
              ? `Actions by ${adminUserName || 'Admin User'}`
              : 'Track all administrative actions and changes'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => loadLogs()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>


      {/* Search and Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Action Type</Label>
                <Select
                  value={filters.actionType || ''}
                  onValueChange={(value) => handleFilterChange({ 
                    actionType: (value || undefined) as AuditActionType
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All action types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All action types</SelectItem>
                    <SelectItem value="impersonation_start">Started Impersonation</SelectItem>
                    <SelectItem value="impersonation_end">Ended Impersonation</SelectItem>
                    <SelectItem value="site_create">Created Site</SelectItem>
                    <SelectItem value="site_update">Updated Site</SelectItem>
                    <SelectItem value="content_update">Updated Content</SelectItem>
                    <SelectItem value="product_update">Updated Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Target Type</Label>
                <Select
                  value={filters.targetType || ''}
                  onValueChange={(value) => handleFilterChange({ 
                    targetType: (value || undefined) as AuditTargetType
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All target types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All target types</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({ 
                      siteId: siteId, 
                      adminUserId: adminUserId,
                      limit: limit 
                    })
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={filters.startDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleFilterChange({ 
                    startDate: e.target.value ? new Date(e.target.value) : undefined 
                  })}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={filters.endDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleFilterChange({ 
                    endDate: e.target.value ? new Date(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => loadLogs()}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No activity logs found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    {!siteId && <TableHead>Site</TableHead>}
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const { date, time } = formatTimestamp(log.created_at)
                    const isExpanded = expandedRows.has(log.id)
                    
                    return (
                      <React.Fragment key={log.id}>
                        <TableRow className="cursor-pointer hover:bg-gradient-primary-50/50">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(log.id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {(log.admin_user_name || log.admin_user_email || 'U')
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">
                                  {log.admin_user_name || 'Unknown Admin'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {log.admin_user_email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getActionTypeBadge(log.action_type)}
                              <div className="text-xs text-gray-500">
                                {formatActionDetails(
                                  log.action_type,
                                  log.target_type,
                                  log.old_values,
                                  log.new_values,
                                  log.action_details
                                ).slice(0, 50)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getTargetTypeBadge(log.target_type)}
                              {log.target_id && (
                                <div className="text-xs text-gray-500 font-mono">
                                  {log.target_id.slice(0, 8)}...
                                </div>
                              )}
                            </div>
                          </TableCell>
                          {!siteId && (
                            <TableCell>
                              <div className="text-sm">{log.site_name || 'Unknown Site'}</div>
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="text-sm">
                              <div>{date}</div>
                              <div className="text-xs text-gray-500">{time}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={siteId ? 5 : 6} className="p-0">
                              <div className="px-4 py-3 bg-muted/20 border-t">
                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-xs font-medium">Action Details</Label>
                                    <p className="text-sm mt-1">
                                      {formatActionDetails(
                                        log.action_type,
                                        log.target_type,
                                        log.old_values,
                                        log.new_values,
                                        log.action_details
                                      )}
                                    </p>
                                  </div>
                                  
                                  <div className="grid gap-3 md:grid-cols-2">
                                    {log.old_values && (
                                      <div>
                                        <Label className="text-xs font-medium">Previous Values</Label>
                                        <pre className="text-xs mt-1 p-2 bg-white rounded border overflow-auto max-h-32">
                                          {JSON.stringify(log.old_values, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                    
                                    {log.new_values && (
                                      <div>
                                        <Label className="text-xs font-medium">New Values</Label>
                                        <pre className="text-xs mt-1 p-2 bg-white rounded border overflow-auto max-h-32">
                                          {JSON.stringify(log.new_values, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="grid gap-3 md:grid-cols-2 text-xs text-gray-500">
                                    {log.ip_address && (
                                      <div>
                                        <span className="font-medium">IP Address:</span> {log.ip_address}
                                      </div>
                                    )}
                                    {log.user_agent && (
                                      <div>
                                        <span className="font-medium">User Agent:</span> {log.user_agent.slice(0, 50)}...
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}