import { Suspense } from 'react'
import { SiteHomepage } from '@/src/components/site/SiteHomepage'
import HomePlatform from './home-platform'

export default function HomePage() {
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