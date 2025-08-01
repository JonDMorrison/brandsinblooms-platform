import { notFound } from 'next/navigation'
import { SiteHealthDetails } from '@/src/components/admin/SiteHealthDetails'
import { PageProps } from '@/src/lib/types/page-props'

export async function generateMetadata({ params }: PageProps<{ id: string }>) {
  return {
    title: 'Site Health Details - Admin Dashboard',
    description: 'Detailed health monitoring and diagnostics for the site',
  }
}

export default async function SiteHealthPage({ params }: PageProps<{ id: string }>) {
  const { id: siteId } = await params

  // Validate that the site exists (server-side check)
  // Note: In a production app, you'd want to do this check with proper admin auth
  // For now, we'll pass the siteId directly to the component which will handle the data fetching
  
  return (
    <SiteHealthDetails 
      siteId={siteId} 
      siteName="Site Health" // This will be fetched by the component
    />
  )
}