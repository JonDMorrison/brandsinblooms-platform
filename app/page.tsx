import { Suspense } from 'react'
import { SiteHomepage } from '@/src/components/site/SiteHomepage'
import HomePlatform from './home-platform'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getAppDomain } from '@/lib/env/app-domain'

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const headersList = await headers()
  const host = headersList.get('host') || ''

  // Get search parameters
  const searchParamsData = await searchParams

  // Get app domain from environment
  const appDomain = getAppDomain()
  const isSubdomain = host.includes('.') && host !== appDomain && !host.startsWith('localhost:')

  if (isSubdomain) {
    // Preserve query parameters during redirect
    const urlSearchParams = new URLSearchParams()

    // Add all search parameters to the URL
    Object.entries(searchParamsData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => urlSearchParams.append(key, v))
        } else {
          urlSearchParams.append(key, value)
        }
      }
    })

    const queryString = urlSearchParams.toString()
    const homeUrl = queryString ? `/home?${queryString}` : '/home'

    redirect(homeUrl)
  }

  return (
    <SiteHomepage 
      fallbackContent={
        <Suspense fallback={null}>
          <HomePlatform />
        </Suspense>
      }
    />
  )
}