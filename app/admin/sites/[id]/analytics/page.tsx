import { notFound } from 'next/navigation'
import { supabase } from '@/src/lib/supabase/client'
import { SiteAnalytics } from '@/src/components/admin/SiteAnalytics'

interface SiteAnalyticsPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: SiteAnalyticsPageProps) {
  // Note: In a real app, you'd want to fetch the site name server-side
  // For now, we'll use a generic title
  return {
    title: 'Site Analytics - Admin Dashboard',
    description: 'Detailed analytics and performance metrics for the site',
  }
}

export default async function SiteAnalyticsPage({ params }: SiteAnalyticsPageProps) {
  const { id: siteId } = params

  // Validate that the site exists (server-side check)
  // Note: In a production app, you'd want to do this check with proper admin auth
  // For now, we'll pass the siteId directly to the component which will handle the data fetching
  
  return (
    <SiteAnalytics 
      siteId={siteId} 
      siteName="Site Analytics" // This will be fetched by the component
    />
  )
}