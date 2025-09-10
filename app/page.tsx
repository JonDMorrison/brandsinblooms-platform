import { Suspense } from 'react'
import { SiteHomepage } from '@/src/components/site/SiteHomepage'
import HomePlatform from './home-platform'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function HomePage() {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  
  // If this is a subdomain (contains a dot but isn't just localhost), redirect to /home
  const isSubdomain = host.includes('.') && host !== 'localhost:3001' && !host.startsWith('localhost:')
  
  if (isSubdomain) {
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