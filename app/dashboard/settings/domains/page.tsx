'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
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
  Eye,
  ExternalLink,
  AlertTriangle,
  Check,
  Shield,
} from 'lucide-react'
import { useCurrentSite, useSitePermissions } from '@/src/hooks/useSite'
import { DomainConfigurationIntegrated } from '@/src/components/site/DomainConfigurationIntegrated'
import { SitePreview } from '@/src/components/site/SitePreview'
import { SiteSwitcher } from '@/src/components/site/SiteSwitcher'

export default function DomainsPage() {
  const { site, loading } = useCurrentSite()
  const { canManage, canEdit } = useSitePermissions()

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
      <Alert className="fade-in-up" style={{ animationDelay: '0.2s' }}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Site Selected</AlertTitle>
        <AlertDescription>
          Please select a site to configure domain settings. You can switch sites using the site switcher in the header.
        </AlertDescription>
      </Alert>
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
      {/* Header Actions */}
      <div className="flex items-center justify-end gap-3">
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

      {/* Custom Domain Configuration */}
      <DomainConfigurationIntegrated
        onDomainUpdate={(domain, type) => {
          // Handle domain update
          console.log('Domain updated:', domain, type)
        }}
      />

      {/* Site Info Card - Moved to Bottom */}
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
    </div>
  )
}