'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/src/components/ui/alert'
import {
  Globe,
  Plus,
  Eye,
  Settings,
  ExternalLink,
  AlertTriangle,
  Check,
  Clock,
  Shield,
} from 'lucide-react'
import { useCurrentSite, useSitePermissions } from '@/src/hooks/useSite'
import { DomainConfiguration } from '@/src/components/site/DomainConfiguration'
import { SitePreview } from '@/src/components/site/SitePreview'
import { SiteSwitcher } from '@/src/components/site/SiteSwitcher'

export default function DomainsPage() {
  const { site, loading } = useCurrentSite()
  const { canManage, canEdit } = useSitePermissions()
  const [activeTab, setActiveTab] = useState('configuration')

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (!site) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domain Settings</h1>
          <p className="text-gray-500">
            Configure your site domains and preview functionality.
          </p>
        </div>
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Site Selected</AlertTitle>
          <AlertDescription>
            Please select a site to configure domain settings. You can switch sites using the site switcher in the header.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const getDomainStatus = () => {
    if (site.custom_domain) {
      return {
        type: 'custom',
        url: `https://${site.custom_domain}`,
        status: 'active', // In real app, this would come from verification
        primary: true
      }
    } else {
      return {
        type: 'subdomain',
        url: `https://${site.subdomain}.blooms.cc`,
        status: 'active',
        primary: true
      }
    }
  }

  const domainStatus = getDomainStatus()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domain Settings</h1>
          <p className="text-gray-500">
            Configure your site domains and preview functionality.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <SiteSwitcher />
          <SitePreview 
            showAsDialog 
            triggerButton={
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview Site
              </Button>
            }
          />
        </div>
      </div>

      {/* Site Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {site.name}
            </div>
            <div className="flex items-center gap-2">
              {!canManage && (
                <Badge variant="secondary">Read Only</Badge>
              )}
              {canEdit && !canManage && (
                <Badge variant="secondary">Editor</Badge>
              )}
              {canManage && (
                <Badge variant="default">Manager</Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Current domain configuration and status for this site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Primary Domain */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Primary</Badge>
                  <span className="font-medium">{domainStatus.url.replace('https://', '')}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {domainStatus.type === 'custom' ? 'Custom domain' : 'Platform subdomain'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Active</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(domainStatus.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Fallback Domain (if custom domain is primary) */}
            {site.custom_domain && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Fallback</Badge>
                    <span className="font-medium">{site.subdomain}.blooms.cc</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Platform subdomain (always available)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://${site.subdomain}.blooms.cc`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Domain Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm">SSL Certificate</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-500" />
                <span className="text-sm">DNS Configured</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Ready to Use</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Warning */}
      {!canManage && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Limited Permissions</AlertTitle>
          <AlertDescription>
            You have {canEdit ? 'editor' : 'viewer'} access to this site. 
            Contact the site owner to modify domain settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="configuration" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview & Testing
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Management
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="space-y-6">
            <TabsContent value="configuration" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Domain Configuration</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Configure your custom domain and subdomain settings. Changes take effect immediately.
                </p>
                <Separator className="mb-6" />
              </div>
              
              <DomainConfiguration 
                onDomainUpdate={(domain, type) => {
                  // Handle domain update
                  console.log('Domain updated:', domain, type)
                }}
              />
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Site Preview & Testing</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Preview your site across different devices and test domain configuration.
                </p>
                <Separator className="mb-6" />
              </div>
              
              <SitePreview />
            </TabsContent>

            <TabsContent value="management" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Domain Management</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Advanced domain management and monitoring tools.
                </p>
                <Separator className="mb-6" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Domain History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Domain History</CardTitle>
                    <CardDescription>
                      Recent changes to your domain configuration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-gray-1000 rounded-full mt-2 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Domain configured</p>
                          <p className="text-xs text-gray-500">
                            {domainStatus.type === 'custom' ? site.custom_domain : `${site.subdomain}.blooms.cc`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">SSL certificate issued</p>
                          <p className="text-xs text-gray-500">
                            Automatic HTTPS enabled
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(Date.now() - 86400000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                    <CardDescription>
                      Common domain management tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setActiveTab('preview')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Test Site Connectivity
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open(domainStatus.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Live Site
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          navigator.clipboard.writeText(domainStatus.url)
                          // toast would be shown here
                        }}
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Copy Site URL
                      </Button>
                      
                      {canManage && (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setActiveTab('configuration')}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure Domains
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Domain Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Domain Analytics</CardTitle>
                  <CardDescription>
                    Traffic and performance metrics for your domains
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p>Domain analytics will be available here</p>
                    <p className="text-sm">Connect your analytics service to view detailed metrics</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}