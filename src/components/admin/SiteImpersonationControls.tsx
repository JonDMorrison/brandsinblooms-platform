'use client'

import React, { useState, useCallback } from 'react'
import { 
  UserCheck, 
  Eye, 
  Clock, 
  ExternalLink, 
  StopCircle,
  Play,
  AlertTriangle,
  Settings,
  User
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/src/components/ui/card'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Badge } from '@/src/components/ui/badge'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Separator } from '@/src/components/ui/separator'
import { 
  useAdminImpersonation, 
  useCurrentImpersonation,
  useImpersonationManager,
  type ActiveImpersonationSession
} from '@/src/contexts/AdminImpersonationContext'
import { toast } from 'sonner'

interface SiteImpersonationControlsProps {
  siteId: string
  siteName: string
  siteSubdomain: string
  siteCustomDomain?: string
  siteOwnerId?: string
  siteOwnerEmail?: string
  siteOwnerName?: string
}

export function SiteImpersonationControls({
  siteId,
  siteName,
  siteSubdomain,
  siteCustomDomain,
  siteOwnerId,
  siteOwnerEmail,
  siteOwnerName
}: SiteImpersonationControlsProps) {
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [purpose, setPurpose] = useState('')
  const [durationHours, setDurationHours] = useState('2')
  const [impersonateOwner, setImpersonateOwner] = useState(false)

  const { session, isActive } = useCurrentImpersonation()
  const { startImpersonation, endCurrentImpersonation, loading, error } = useImpersonationManager()

  // Check if we're currently impersonating this specific site
  const isImpersonatingThisSite = isActive && session?.site_id === siteId

  const handleStartImpersonation = useCallback(async () => {
    try {
      const session = await startImpersonation({
        siteId,
        impersonatedUserId: impersonateOwner ? siteOwnerId : undefined,
        purpose: purpose.trim() || undefined,
        durationHours: parseInt(durationHours),
        allowedActions: ['read', 'navigate', 'preview'] // Basic actions for site preview
      })

      if (session) {
        toast.success(`Impersonation session started: You are now viewing ${siteName} as an admin${impersonateOwner ? ` (as ${siteOwnerName || siteOwnerEmail})` : ''}`)
        setShowStartDialog(false)
        setPurpose('')
        setImpersonateOwner(false)
      }
    } catch (err) {
      console.error('Failed to start impersonation:', err)
      toast.error('Failed to start impersonation session')
    }
  }, [
    startImpersonation, 
    siteId, 
    impersonateOwner, 
    siteOwnerId, 
    purpose, 
    durationHours,
    siteName,
    siteOwnerName,
    siteOwnerEmail
  ])

  const handleEndImpersonation = useCallback(async () => {
    try {
      await endCurrentImpersonation()
      toast.success('Impersonation session ended')
    } catch (err) {
      console.error('Failed to end impersonation:', err)
      toast.error('Failed to end impersonation session')
    }
  }, [endCurrentImpersonation])

  const openSiteInNewTab = useCallback(() => {
    if (!session) return

    const siteUrl = siteCustomDomain 
      ? `https://${siteCustomDomain}`
      : `https://${siteSubdomain}.brandsinblooms.com`
    
    // Add impersonation token to URL for initial access
    const urlWithToken = `${siteUrl}?admin_impersonation=${encodeURIComponent(session.session_token)}`
    
    window.open(urlWithToken, '_blank')
  }, [session, siteCustomDomain, siteSubdomain])

  const getTimeRemainingText = useCallback(() => {
    if (!session) return ''

    const expiryTime = new Date(session.expires_at).getTime()
    const now = Date.now()
    const remaining = Math.max(0, expiryTime - now)
    
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else {
      return `${minutes}m remaining`
    }
  }, [session])

  if (isImpersonatingThisSite) {
    return (
      <Card className="border-orange-200 bg-orange-50  ">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 ">
              <UserCheck className="h-5 w-5 text-orange-600 " />
            </div>
            <div>
              <CardTitle className="text-lg text-orange-900 ">
                Active Impersonation
              </CardTitle>
              <CardDescription className="text-orange-700 ">
                You are currently viewing this site as an admin
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Session Details */}
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Session ID:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {session?.session_id.slice(0, 8)}...
                </code>
              </div>
              
              {session?.impersonated_user_email && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Viewing as:</span>
                  <span className="font-medium">
                    {session.impersonated_user_name || session.impersonated_user_email}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-500">Time remaining:</span>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {getTimeRemainingText()}
                </Badge>
              </div>

              {session?.purpose && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Purpose:</span>
                  <span className="font-medium max-w-48 truncate" title={session.purpose}>
                    {session.purpose}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={openSiteInNewTab}
                className="flex-1 gap-2"
                variant="default"
              >
                <ExternalLink className="h-4 w-4" />
                Open Site
              </Button>
              
              <Button 
                onClick={handleEndImpersonation}
                variant="outline"
                className="gap-2"
                disabled={loading}
              >
                <StopCircle className="h-4 w-4" />
                End Session
              </Button>
            </div>

            {/* Warning for expiring session */}
            {session && new Date(session.expires_at).getTime() - Date.now() < 10 * 60 * 1000 && (
              <Alert className="border-amber-200 bg-amber-50  ">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 ">
                  This impersonation session will expire soon. You may need to start a new session to continue.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 ">
            <Eye className="h-5 w-5 text-blue-600 " />
          </div>
          <div>
            <CardTitle className="text-lg">Site Impersonation</CardTitle>
            <CardDescription>
              Access this site as an admin for support and troubleshooting
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Site Information */}
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Site URL:</span>
              <span className="font-mono text-xs">
                {siteCustomDomain 
                  ? `${siteCustomDomain}` 
                  : `${siteSubdomain}.brandsinblooms.com`
                }
              </span>
            </div>
            
            {siteOwnerEmail && (
              <div className="flex justify-between">
                <span className="text-gray-500">Owner:</span>
                <span className="font-medium">
                  {siteOwnerName || siteOwnerEmail}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50  ">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 ">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Start Impersonation Button */}
          <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2" disabled={loading}>
                <Play className="h-4 w-4" />
                Start Impersonation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Start Site Impersonation</DialogTitle>
                <DialogDescription>
                  Configure impersonation settings for {siteName}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Duration Selection */}
                <div className="space-y-2">
                  <Label htmlFor="duration">Session Duration</Label>
                  <Select value={durationHours} onValueChange={setDurationHours}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Owner Impersonation Toggle */}
                {siteOwnerId && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="impersonate-owner"
                        checked={impersonateOwner}
                        onChange={(e) => setImpersonateOwner(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="impersonate-owner" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Impersonate site owner
                      </Label>
                    </div>
                    {impersonateOwner && (
                      <p className="text-sm text-gray-500">
                        You will see the site as {siteOwnerName || siteOwnerEmail} would see it
                      </p>
                    )}
                  </div>
                )}

                {/* Purpose Input */}
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose (optional)</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Reason for impersonation (e.g., customer support, troubleshooting)"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>

                {/* Security Notice */}
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    This session will be logged for security audit purposes. Only use for legitimate administrative needs.
                  </AlertDescription>
                </Alert>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => setShowStartDialog(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStartImpersonation}
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Starting...' : 'Start Session'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}