import { Suspense } from 'react'
import { Flower } from 'lucide-react'

// Import the client component
import HomePageClient from './home-client'

// Loading fallback component
function HomePageLoading() {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg">
          <Flower className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-brand-heading text-gradient-primary">
            Brands & Blooms
          </h1>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomePageClient />
    </Suspense>
  )
}