'use client'

import { useCurrentSite, useSitePermissions } from '@/src/hooks/useSite'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { 
  Globe, 
  MapPin, 
  Mail, 
  Phone, 
  Clock, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface BusinessHours {
  [day: string]: {
    open?: string
    close?: string
  } | null
}

export function SiteInfo() {
  const { site, loading, error } = useCurrentSite()
  const { role, hasAccess, canEdit, canManage } = useSitePermissions()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load site information: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  if (!site) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No site information available
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Site Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>{site.name}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {site.is_published ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Eye className="h-3 w-3 mr-1" />
                  Published
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Draft
                </Badge>
              )}
              {hasAccess && role && (
                <Badge variant="outline">
                  {role}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {site.description && (
            <p className="text-muted-foreground">{site.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Site URLs</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono bg-muted px-2 py-1 rounded">
                    {site.subdomain}.yourdomain.com
                  </span>
                </div>
                {site.custom_domain && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-mono bg-muted px-2 py-1 rounded">
                      {site.custom_domain}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Access Level</h4>
              <div className="space-y-1 text-sm">
                {hasAccess ? (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>You have {role} access</span>
                    </div>
                    {canEdit && (
                      <div className="text-muted-foreground">
                        • Can edit content and products
                      </div>
                    )}
                    {canManage && (
                      <div className="text-muted-foreground">
                        • Can manage site settings
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span>Public view only</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      {(site.business_name || site.business_email || site.business_phone || site.business_address) && (
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {site.business_name && (
              <div>
                <h4 className="font-medium">Business Name</h4>
                <p className="text-muted-foreground">{site.business_name}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {site.business_email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${site.business_email}`}
                    className="text-primary hover:underline"
                  >
                    {site.business_email}
                  </a>
                </div>
              )}
              
              {site.business_phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`tel:${site.business_phone}`}
                    className="text-primary hover:underline"
                  >
                    {site.business_phone}
                  </a>
                </div>
              )}
            </div>
            
            {site.business_address && (
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <h5 className="font-medium">Address</h5>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {site.business_address}
                  </p>
                </div>
              </div>
            )}
            
            {site.business_hours && (
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <h5 className="font-medium">Business Hours</h5>
                  <div className="text-sm text-muted-foreground">
                    {Object.entries(site.business_hours as BusinessHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize">{day}:</span>
                        <span>
                          {hours?.open && hours?.close 
                            ? `${hours.open} - ${hours.close}`
                            : 'Closed'
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Site Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Site Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <h5 className="font-medium">Status</h5>
              <p className="text-muted-foreground">
                {site.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
            
            <div>
              <h5 className="font-medium">Visibility</h5>
              <p className="text-muted-foreground">
                {site.is_published ? 'Published' : 'Draft'}
              </p>
            </div>
            
            <div>
              <h5 className="font-medium">Timezone</h5>
              <p className="text-muted-foreground">
                {site.timezone || 'America/New_York'}
              </p>
            </div>
            
            <div>
              <h5 className="font-medium">Created</h5>
              <p className="text-muted-foreground">
                {new Date(site.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Compact site info for headers or sidebars
 */
export function CompactSiteInfo() {
  const { site, loading } = useCurrentSite()
  const { role } = useSitePermissions()

  if (loading) {
    return <Skeleton className="h-8 w-32" />
  }

  if (!site) {
    return null
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{site.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {site.subdomain}
          {site.custom_domain && ` • ${site.custom_domain}`}
        </div>
      </div>
      {role && (
        <Badge variant="outline" className="text-xs">
          {role}
        </Badge>
      )}
    </div>
  )
}