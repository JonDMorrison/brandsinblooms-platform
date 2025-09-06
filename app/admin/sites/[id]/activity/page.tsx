import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminGuard } from '@/src/components/admin/AdminGuard'
import { AdminActionLog } from '@/src/components/admin/AdminActionLog'
import { SiteNavigation } from '@/src/components/admin/SiteNavigation'
import { getSiteById } from '@/src/lib/admin/sites'
import { PageProps } from '@/src/lib/types/page-props'

export async function generateMetadata({ params }: PageProps<{ id: string }>): Promise<Metadata> {
  try {
    const { id } = await params
    const site = await getSiteById(id)
    
    if (!site) {
      return {
        title: 'Site Not Found - Admin',
        description: 'The requested site could not be found.'
      }
    }

    return {
      title: `Activity Log - ${site.name} - Admin`,
      description: `View activity log for ${site.name} site`
    }
  } catch (error) {
    return {
      title: 'Error - Admin',
      description: 'An error occurred while loading the site.'
    }
  }
}

export default async function SiteActivityPage({ params }: PageProps<{ id: string }>) {
  const { id } = await params
  let site: any = null
  let error: string | null = null

  try {
    site = await getSiteById(id)
    
    if (!site) {
      notFound()
    }
  } catch (err) {
    console.error('Error loading site:', err)
    error = 'Failed to load site information'
  }

  if (error) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-white p-6">
          <div className="mx-auto max-w-7xl">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-destructive mb-2">Error</h1>
              <p className="text-gray-500">{error}</p>
            </div>
          </div>
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b bg-card/50">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Activity Log
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {site.name} • {site.subdomain}.brandsinblooms.com
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={`/admin/sites/${id}/edit`}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  ← Back to Site
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
          <SiteNavigation 
            siteId={id}
            siteName={site.name}
            siteSubdomain={site.subdomain}
            showBackButton={true}
          />
          
          <AdminActionLog 
            siteId={id} 
            siteName={site.name}
            showFilters={true}
            showSummary={true}
            limit={50}
          />
        </main>
      </div>
    </AdminGuard>
  )
}