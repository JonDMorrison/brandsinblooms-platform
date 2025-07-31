'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { 
  Globe, 
  ExternalLink, 
  Eye, 
  Monitor, 
  Smartphone, 
  Tablet,
  RefreshCw,
  Settings,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  AlertCircle,
  Play
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/src/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Separator } from '@/src/components/ui/separator'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { 
  useCurrentImpersonation,
  useImpersonationManager
} from '@/src/contexts/AdminImpersonationContext'
import { toast } from 'sonner'

interface SiteAccessPortalProps {
  siteId: string
  siteName: string
  siteSubdomain: string
  siteCustomDomain?: string
  siteIsPublished: boolean
  siteOwnerId?: string
  siteOwnerEmail?: string
  siteOwnerName?: string
}

interface PreviewDevice {
  name: string
  width: number
  height: number
  icon: React.ComponentType<any>
}

const previewDevices: PreviewDevice[] = [
  { name: 'Desktop', width: 1200, height: 800, icon: Monitor },
  { name: 'Tablet', width: 768, height: 1024, icon: Tablet },
  { name: 'Mobile', width: 375, height: 667, icon: Smartphone },
]

export function SiteAccessPortal({
  siteId,
  siteName,
  siteSubdomain,
  siteCustomDomain,
  siteIsPublished,
  siteOwnerId,
  siteOwnerEmail,
  siteOwnerName
}: SiteAccessPortalProps) {
  const [selectedDevice, setSelectedDevice] = useState<PreviewDevice>(previewDevices[0])
  const [iframeKey, setIframeKey] = useState(0)
  const [iframeLoading, setIframeLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const { session, isActive } = useCurrentImpersonation()
  const { startImpersonation, loading, error } = useImpersonationManager()

  // Get site URLs
  const siteUrl = siteCustomDomain 
    ? `https://${siteCustomDomain}`
    : `https://${siteSubdomain}.brandsinblooms.com`

  const impersonatedUrl = session 
    ? `${siteUrl}?admin_impersonation=${encodeURIComponent(session.session_token)}`
    : siteUrl

  // Check if we're impersonating this specific site
  const isImpersonatingThisSite = isActive && session?.site_id === siteId

  const handleStartQuickImpersonation = useCallback(async () => {
    try {
      const newSession = await startImpersonation({
        siteId,
        impersonatedUserId: siteOwnerId,
        purpose: 'Site preview and testing',
        durationHours: 2,
        allowedActions: ['read', 'navigate', 'preview']
      })

      if (newSession) {
        toast.success('Quick impersonation started')
        setShowPreview(true)
      }
    } catch (err) {
      console.error('Failed to start quick impersonation:', err)
      toast.error('Failed to start impersonation session')
    }
  }, [startImpersonation, siteId, siteOwnerId])

  const refreshPreview = useCallback(() => {
    setIframeLoading(true)
    setIframeKey(prev => prev + 1)
  }, [])

  const openInNewTab = useCallback(() => {
    const urlToOpen = isImpersonatingThisSite ? impersonatedUrl : siteUrl
    window.open(urlToOpen, '_blank')
  }, [isImpersonatingThisSite, impersonatedUrl, siteUrl])

  const copyUrl = useCallback(async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      toast.success(`${label} copied to clipboard`)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
      toast.error('Failed to copy URL')
    }
  }, [])

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false)
  }, [])

  // Clear copied state after timeout
  useEffect(() => {
    if (copiedUrl) {
      const timeout = setTimeout(() => setCopiedUrl(null), 2000)
      return () => clearTimeout(timeout)
    }
  }, [copiedUrl])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
              <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Site Access Portal</CardTitle>
              <CardDescription>
                Preview and access {siteName} with admin privileges
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={siteIsPublished ? "default" : "secondary"}>
              {siteIsPublished ? "Published" : "Draft"}
            </Badge>
            {isImpersonatingThisSite && (
              <Badge variant="outline" className="gap-1">
                <Eye className="h-3 w-3" />
                Impersonating
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="access" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="access">Quick Access</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Quick Access Tab */}
          <TabsContent value="access" className="space-y-4">
            {/* Site URLs */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Site URLs</Label>
              </div>
              
              {/* Primary URL */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">Primary URL</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {siteUrl}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyUrl(siteUrl, 'Site URL')}
                  className="shrink-0"
                >
                  {copiedUrl === siteUrl ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Impersonated URL (if active) */}
              {isImpersonatingThisSite && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-orange-900 dark:text-orange-100">
                      Impersonated URL
                    </div>
                    <div className="text-xs text-orange-700 dark:text-orange-300 font-mono truncate">
                      {impersonatedUrl}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyUrl(impersonatedUrl, 'Impersonated URL')}
                    className="shrink-0 text-orange-700 hover:text-orange-900 dark:text-orange-300 dark:hover:text-orange-100"
                  >
                    {copiedUrl === impersonatedUrl ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Error Display */}
            {error && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Access Actions */}
            <div className="grid gap-3 md:grid-cols-2">
              {/* Quick impersonation */}
              {!isImpersonatingThisSite && (
                <Button 
                  onClick={handleStartQuickImpersonation}
                  disabled={loading}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  {loading ? 'Starting...' : 'Quick Access'}
                </Button>
              )}

              {/* Open in new tab */}
              <Button 
                variant="outline" 
                onClick={openInNewTab}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Site
              </Button>
            </div>

            {/* Site Information */}
            <div className="grid gap-2 text-sm bg-muted/50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subdomain:</span>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  {siteSubdomain}
                </code>
              </div>
              
              {siteCustomDomain && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custom Domain:</span>
                  <code className="text-xs bg-background px-2 py-1 rounded">
                    {siteCustomDomain}
                  </code>
                </div>
              )}
              
              {siteOwnerEmail && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Owner:</span>
                  <span className="font-medium">
                    {siteOwnerName || siteOwnerEmail}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-medium ${siteIsPublished ? 'text-green-600' : 'text-amber-600'}`}>
                  {siteIsPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            {/* Device Selection */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Device Preview</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Select
                  value={selectedDevice.name}
                  onValueChange={(name) => {
                    const device = previewDevices.find(d => d.name === name)
                    if (device) setSelectedDevice(device)
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {previewDevices.map((device) => {
                      const Icon = device.icon
                      return (
                        <SelectItem key={device.name} value={device.name}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {device.name}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshPreview}
                  disabled={iframeLoading}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${iframeLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Preview Actions */}
            {!isImpersonatingThisSite && !showPreview && (
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Start an impersonation session to preview the site with admin access.
                  <Button 
                    variant="link" 
                    onClick={handleStartQuickImpersonation}
                    disabled={loading}
                    className="h-auto p-0 ml-2"
                  >
                    {loading ? 'Starting...' : 'Start Preview'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Preview Frame */}
            {(isImpersonatingThisSite || showPreview) && (
              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <div 
                    className="border border-border rounded-lg overflow-hidden shadow-lg bg-background"
                    style={{
                      width: Math.min(selectedDevice.width, 800),
                      height: Math.min(selectedDevice.height, 600),
                      maxWidth: '100%'
                    }}
                  >
                    {iframeLoading && (
                      <div className="flex items-center justify-center h-full">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Loading preview...
                        </div>
                      </div>
                    )}
                    
                    <iframe
                      key={iframeKey}
                      src={impersonatedUrl}
                      className={`w-full h-full ${iframeLoading ? 'hidden' : 'block'}`}
                      onLoad={handleIframeLoad}
                      title={`${siteName} Preview`}
                      sandbox="allow-same-origin allow-scripts allow-forms allow-navigation"
                    />
                  </div>
                </div>
                
                <div className="text-center text-xs text-muted-foreground">
                  Preview: {selectedDevice.width} × {selectedDevice.height}px
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}