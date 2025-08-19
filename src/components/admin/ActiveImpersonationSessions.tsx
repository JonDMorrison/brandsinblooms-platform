'use client'

import React, { useEffect } from 'react'
import { 
  UserCheck, 
  Clock, 
  StopCircle, 
  Eye, 
  ExternalLink,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Separator } from '@/src/components/ui/separator'
import { 
  useImpersonationManager,
  type ActiveImpersonationSession
} from '@/src/contexts/AdminImpersonationContext'
import { toast } from 'sonner'

export function ActiveImpersonationSessions() {
  const { 
    activeSessions, 
    loading, 
    error, 
    refreshSessions, 
    endSession,
    clearError 
  } = useImpersonationManager()

  // Auto-refresh sessions on mount
  useEffect(() => {
    refreshSessions()
  }, [refreshSessions])

  const handleEndSession = async (sessionId: string, siteName: string) => {
    try {
      await endSession(sessionId)
      toast.success(`Ended impersonation session for ${siteName}`)
    } catch (err) {
      console.error('Failed to end session:', err)
      toast.error('Failed to end impersonation session')
    }
  }

  const openSite = (session: ActiveImpersonationSession) => {
    const siteUrl = `https://${session.site_subdomain}.brandsinblooms.com`
    window.open(siteUrl, '_blank')
  }

  const formatTimeRemaining = (expiresAt: string): string => {
    const expiryTime = new Date(expiresAt).getTime()
    const now = Date.now()
    const remaining = Math.max(0, expiryTime - now)
    
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const isExpiringSoon = (expiresAt: string): boolean => {
    const expiryTime = new Date(expiresAt).getTime()
    const now = Date.now()
    const remaining = expiryTime - now
    
    return remaining <= 10 * 60 * 1000 // 10 minutes
  }

  const getLastUsedText = (lastUsedAt: string): string => {
    const lastUsed = new Date(lastUsedAt).getTime()
    const now = Date.now()
    const diff = now - lastUsed
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ago`
    } else if (minutes > 0) {
      return `${minutes}m ago`
    } else {
      return 'Just now'
    }
  }

  if (loading && activeSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 ">
              <UserCheck className="h-5 w-5 text-orange-600 " />
            </div>
            <div>
              <CardTitle className="text-lg">Active Impersonation Sessions</CardTitle>
              <CardDescription>
                Monitor and manage ongoing admin impersonation sessions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading sessions...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 ">
              <UserCheck className="h-5 w-5 text-orange-600 " />
            </div>
            <div>
              <CardTitle className="text-lg">Active Impersonation Sessions</CardTitle>
              <CardDescription>
                Monitor and manage ongoing admin impersonation sessions
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {activeSessions.length} active
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshSessions}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Error Display */}
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50  ">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 ">
              {error}
              <Button
                variant="link"
                onClick={clearError}
                className="h-auto p-0 ml-2 text-red-800 "
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Sessions List */}
        {activeSessions.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No active impersonation sessions
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Start impersonation from individual site management pages
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-lg border ${
                  isExpiringSoon(session.expires_at)
                    ? 'border-amber-200 bg-amber-50  '
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Session Info */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">
                        {session.site_name}
                      </h4>
                      {isExpiringSoon(session.expires_at) && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>Admin:</span>
                        <span className="font-medium">
                          {session.admin_name || session.admin_email}
                        </span>
                      </div>
                      
                      {session.impersonated_user_email && (
                        <div className="flex items-center gap-2">
                          <span>Viewing as:</span>
                          <span className="font-medium">
                            {session.impersonated_user_name || session.impersonated_user_email}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeRemaining(session.expires_at)} remaining</span>
                        </div>
                        <div className="text-xs">
                          Last used: {getLastUsedText(session.last_used_at)}
                        </div>
                      </div>
                      
                      {session.purpose && (
                        <div className="flex items-start gap-2">
                          <span>Purpose:</span>
                          <span className="font-medium break-words">
                            {session.purpose}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSite(session)}
                      className="gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEndSession(session.id, session.site_name)}
                      disabled={loading}
                      className="gap-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <StopCircle className="h-3 w-3" />
                      End
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}