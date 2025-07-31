'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/src/lib/supabase/client'
import { SiteNavigation } from '@/src/components/admin/SiteNavigation'
import { SiteImpersonationControls } from '@/src/components/admin/SiteImpersonationControls'
import { SiteAccessPortal } from '@/src/components/admin/SiteAccessPortal'
import { ImpersonationBanner } from '@/src/components/admin/ImpersonationBanner'
import { ImpersonationSpacer } from '@/src/components/admin/ImpersonationBanner'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

interface SiteData {
  id: string
  name: string
  subdomain: string
  custom_domain?: string
  is_published: boolean
  owner_id: string
  owner_email?: string
  owner_name?: string
}

export default function SiteAccessPage() {
  const params = useParams()
  const siteId = params.id as string

  const [site, setSite] = useState<SiteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSiteData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch site data with owner information
        const { data: siteData, error: siteError } = await supabase
          .from('sites')
          .select(`
            id,
            name,
            subdomain,
            custom_domain,
            is_published,
            profiles!sites_owner_id_fkey (
              user_id,
              email,
              full_name
            )
          `)
          .eq('id', siteId)
          .single()

        if (siteError) {
          console.error('Error fetching site:', siteError)
          setError('Failed to fetch site data')
          return
        }

        if (!siteData) {
          setError('Site not found')
          return
        }

        // Transform the data
        setSite({
          id: siteData.id,
          name: siteData.name,
          subdomain: siteData.subdomain,
          custom_domain: siteData.custom_domain,
          is_published: siteData.is_published,
          owner_id: siteData.profiles?.user_id,
          owner_email: siteData.profiles?.email,
          owner_name: siteData.profiles?.full_name,
        })

      } catch (err) {
        console.error('Unexpected error fetching site:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (siteId) {
      fetchSiteData()
    }
  }, [siteId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ImpersonationBanner />
        <ImpersonationSpacer>
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </div>
        </ImpersonationSpacer>
      </div>
    )
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-background">
        <ImpersonationBanner />
        <ImpersonationSpacer>
          <div className="mx-auto max-w-7xl px-6 py-8">
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error || 'Site not found'}
              </AlertDescription>
            </Alert>
          </div>
        </ImpersonationSpacer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ImpersonationBanner />
      <ImpersonationSpacer>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="space-y-6">
            {/* Site Navigation */}
            <SiteNavigation
              siteId={site.id}
              siteName={site.name}
              siteSubdomain={site.subdomain}
            />

            {/* Site Access Controls */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Impersonation Controls */}
              <SiteImpersonationControls
                siteId={site.id}
                siteName={site.name}
                siteSubdomain={site.subdomain}
                siteCustomDomain={site.custom_domain}
                siteOwnerId={site.owner_id}
                siteOwnerEmail={site.owner_email}
                siteOwnerName={site.owner_name}
              />

              {/* Site Access Portal */}
              <SiteAccessPortal
                siteId={site.id}
                siteName={site.name}
                siteSubdomain={site.subdomain}
                siteCustomDomain={site.custom_domain}
                siteIsPublished={site.is_published}
                siteOwnerId={site.owner_id}
                siteOwnerEmail={site.owner_email}
                siteOwnerName={site.owner_name}
              />
            </div>

            {/* Additional Information */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">Important Notes</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>All impersonation sessions are logged for security audit purposes</li>
                <li>Sessions have a maximum duration of 24 hours and will auto-expire</li>
                <li>You can end impersonation sessions at any time from this page or the admin dashboard</li>
                <li>Impersonation allows you to see the site as the user would, including their permissions and data</li>
                <li>Use impersonation responsibly and only for legitimate administrative purposes</li>
              </ul>
            </div>
          </div>
        </div>
      </ImpersonationSpacer>
    </div>
  )
}