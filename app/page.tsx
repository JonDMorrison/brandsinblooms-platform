import { Suspense } from 'react'
import { SiteHomepage } from '@/src/components/site/SiteHomepage'
import HomePageClient from './home-client'

export default function HomePage() {
  return (
    <SiteHomepage 
      fallbackContent={
        <Suspense fallback={null}>
          <HomePageClient />
        </Suspense>
      }
    />
  )
}