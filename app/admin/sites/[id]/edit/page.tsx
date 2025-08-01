'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/src/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { SiteConfigurationForm } from '@/src/components/admin/SiteConfigurationForm'
import { SiteNavigation } from '@/src/components/admin/SiteNavigation'
import { getSiteById } from '@/src/lib/admin/sites'

export default function EditSitePage() {
  const router = useRouter()
  const params = useParams()
  const siteId = params.id as string
  const [site, setSite] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSite = async () => {
      try {
        const siteData = await getSiteById(siteId)
        setSite(siteData)
      } catch (error) {
        console.error('Error loading site:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSite()
  }, [siteId])

  const handleSave = () => {
    // Optionally redirect or show success message
    // The form component handles the actual save
  }

  const handleCancel = () => {
    router.push('/admin')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">Site not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        {/* Site Navigation */}
        <SiteNavigation 
          siteId={siteId}
          siteName={site.name}
          siteSubdomain={site.subdomain}
          showBackButton={true}
        />

        {/* Site Configuration Form */}
        <SiteConfigurationForm
          siteId={siteId}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}