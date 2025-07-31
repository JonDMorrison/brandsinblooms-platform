'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/src/components/ui/tabs'
import {
  Eye,
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Share2,
  Settings,
  AlertTriangle,
  Check,
  X,
  Globe,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCurrentSite } from '@/src/hooks/useSite'
import { testDomainConnectivity, getDomainHealth } from '@/src/lib/site/domain-verification'

interface SitePreviewProps {
  siteId?: string
  showAsDialog?: boolean
  triggerButton?: React.ReactNode
}

interface PreviewFrameProps {
  url: string
  device: 'desktop' | 'tablet' | 'mobile'
  loading: boolean
  error: string | null
}

function PreviewFrame({ url, device, loading, error }: PreviewFrameProps) {
  const getFrameStyles = () => {
    switch (device) {
      case 'mobile':
        return {
          width: '375px',
          height: '667px',
          maxWidth: '100%',
        }
      case 'tablet':
        return {
          width: '768px',
          height: '1024px',
          maxWidth: '100%',
        }
      default:
        return {
          width: '100%',
          height: '600px',
        }
    }
  }

  if (loading) {
    return (
      <div 
        className="border rounded-lg bg-muted flex items-center justify-center"
        style={getFrameStyles()}
      >
        <div className="text-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className="border rounded-lg bg-muted flex items-center justify-center"
        style={getFrameStyles()}
      >
        <div className="text-center space-y-2 p-4">
          <AlertTriangle className="h-8 w-8 mx-auto text-destructive" />
          <p className="text-sm font-medium">Preview Error</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden" style={getFrameStyles()}>
      <iframe
        src={url}
        title="Site Preview"
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts allow-forms"
        loading="lazy"
      />
    </div>
  )
}

function SitePreviewContent({ siteId }: { siteId?: string }) {
  const { site, loading: siteLoading } = useCurrentSite()
  const currentSite = site // Use current site if no specific siteId provided
  
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [domainStatus, setDomainStatus] = useState<any>(null)
  const [healthCheck, setHealthCheck] = useState<any>(null)
  const [connectivityTest, setConnectivityTest] = useState<any>(null)

  // Determine preview URL
  useEffect(() => {
    if (currentSite) {
      const primaryUrl = currentSite.custom_domain 
        ? `https://${currentSite.custom_domain}`
        : `https://${currentSite.subdomain}.blooms.cc`
      setPreviewUrl(primaryUrl)
    }
  }, [currentSite])

  // Test site connectivity and health
  const runSiteTests = async () => {
    if (!previewUrl) return

    try {
      const domain = previewUrl.replace(/^https?:\/\//, '')
      const [health, connectivity] = await Promise.all([
        getDomainHealth(domain),
        testDomainConnectivity(domain)
      ])
      
      setHealthCheck(health)
      setConnectivityTest(connectivity)
    } catch (error) {
      console.error('Failed to run site tests:', error)
    }
  }

  // Run tests when URL changes
  useEffect(() => {
    if (previewUrl) {
      runSiteTests()
    }
  }, [previewUrl])

  const handleRefreshPreview = () => {
    setPreviewLoading(true)
    setPreviewError(null)
    
    // Simulate loading delay
    setTimeout(() => {
      setPreviewLoading(false)
      // In a real implementation, this would reload the iframe
    }, 1000)
  }

  const handleSharePreview = async () => {
    if (previewUrl) {
      try {
        await navigator.clipboard.writeText(previewUrl)
        toast.success('Site URL copied to clipboard!')
      } catch (error) {
        toast.error('Failed to copy URL')
      }
    }
  }

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank')
    }
  }

  if (siteLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!currentSite) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Site Selected</AlertTitle>
        <AlertDescription>
          Please select a site to preview.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Site Info Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{currentSite.name}</h3>
          <p className="text-sm text-muted-foreground">
            Preview your site across different devices and test functionality
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshPreview}
            disabled={previewLoading}
          >
            <RefreshCw className={`h-4 w-4 ${previewLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSharePreview}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenInNewTab}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          {/* Device Selection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Device:</span>
              <Select
                value={previewDevice}
                onValueChange={(value: 'desktop' | 'tablet' | 'mobile') => setPreviewDevice(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desktop">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Desktop
                    </div>
                  </SelectItem>
                  <SelectItem value="tablet">
                    <div className="flex items-center gap-2">
                      <Tablet className="h-4 w-4" />
                      Tablet
                    </div>
                  </SelectItem>
                  <SelectItem value="mobile">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Mobile
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                {previewUrl.replace(/^https?:\/\//, '')}
              </Badge>
            </div>
          </div>

          {/* Preview Frame */}
          <div className="flex justify-center">
            <PreviewFrame
              url={previewUrl}
              device={previewDevice}
              loading={previewLoading}
              error={previewError}
            />
          </div>

          {/* Quick Actions */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewDevice('desktop')}
              className={previewDevice === 'desktop' ? 'bg-secondary' : ''}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewDevice('tablet')}
              className={previewDevice === 'tablet' ? 'bg-secondary' : ''}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewDevice('mobile')}
              className={previewDevice === 'mobile' ? 'bg-secondary' : ''}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Domain Health */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Domain Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthCheck ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <Badge 
                        variant={
                          healthCheck.status === 'healthy' ? 'default' :
                          healthCheck.status === 'warning' ? 'secondary' : 'destructive'
                        }
                      >
                        {healthCheck.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Uptime</span>
                      <span className="text-sm font-mono">{healthCheck.uptime.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Time</span>
                      <span className="text-sm font-mono">{healthCheck.responseTime}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Checked</span>
                      <span className="text-sm text-muted-foreground">
                        {healthCheck.lastChecked.toLocaleTimeString()}
                      </span>
                    </div>
                    {healthCheck.issues.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium mb-1">Issues:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {healthCheck.issues.map((issue: string, index: number) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Checking health...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connectivity Test */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Connectivity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {connectivityTest ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overall Status</span>
                      <div className="flex items-center gap-1">
                        {connectivityTest.success ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {connectivityTest.success ? 'Connected' : 'Failed'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">HTTP Status</span>
                      <Badge variant={connectivityTest.httpStatus === 200 ? 'default' : 'destructive'}>
                        {connectivityTest.httpStatus || 'Failed'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">HTTPS Status</span>
                      <Badge variant={connectivityTest.httpsStatus === 200 ? 'default' : 'destructive'}>
                        {connectivityTest.httpsStatus || 'Failed'}
                      </Badge>
                    </div>
                    
                    {connectivityTest.redirects && connectivityTest.redirects.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium mb-1">Redirects:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {connectivityTest.redirects.map((redirect: string, index: number) => (
                            <li key={index}>{redirect}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {connectivityTest.errors && connectivityTest.errors.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium mb-1">Errors:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                          {connectivityTest.errors.map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Testing connectivity...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Button onClick={runSiteTests} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Tests Again
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Site Analytics</CardTitle>
              <CardDescription>
                Basic site analytics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <p>Analytics data will be available here</p>
                <p className="text-sm">Connect your analytics service to view detailed metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function SitePreview({ siteId, showAsDialog = false, triggerButton }: SitePreviewProps) {
  if (showAsDialog) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {triggerButton || (
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview Site
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Site Preview</DialogTitle>
            <DialogDescription>
              Preview your site and test its functionality across different devices.
            </DialogDescription>
          </DialogHeader>
          <SitePreviewContent siteId={siteId} />
        </DialogContent>
      </Dialog>
    )
  }

  return <SitePreviewContent siteId={siteId} />
}

export default SitePreview