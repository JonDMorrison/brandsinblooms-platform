import { Suspense } from 'react'
import { SiteHomepage } from '@/src/components/site/SiteHomepage'
import HomePlatform from './home-platform'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function HomePage() {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  
  // Get app domain from environment
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN
  const isSubdomain = host.includes('.') && host !== appDomain && !host.startsWith('localhost:')
  
  // Debug logging
  console.log('[PAGE DEBUG]', {
    host,
    appDomain,
    isSubdomain,
    hostIncludesDots: host.includes('.'),
    hostNotAppDomain: host !== appDomain,
    hostNotLocalhost: !host.startsWith('localhost:')
  })
  
  if (isSubdomain) {
    console.log('[PAGE] Redirecting to /home because isSubdomain=true')
    redirect('/home')
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