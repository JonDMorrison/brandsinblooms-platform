import { Skeleton } from '@/src/components/ui/skeleton'
import { Card } from '@/src/components/ui/card'

// Featured Plants Loading Skeleton
export function FeaturedPlantsSkeleton() {
  return (
    <section className="py-16 bg-white">
      <div className="brand-container">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <Skeleton className="w-full h-64" />
              <div className="p-6">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-16 w-full mb-4" />
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-18" />
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Skeleton className="h-12 w-32 mx-auto" />
        </div>
      </div>
    </section>
  )
}

// Plant Categories Loading Skeleton
export function PlantCategoriesSkeleton() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="brand-container">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-48 mx-auto mb-4" />
          <Skeleton className="h-6 w-80 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <Skeleton className="w-full h-48" />
              <div className="p-6">
                <Skeleton className="h-6 w-24 mb-3" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Care Guides Loading Skeleton
export function CareGuidesSkeleton() {
  return (
    <section className="py-16 bg-white">
      <div className="brand-container">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-56 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Skeleton className="w-12 h-12 rounded-lg mr-4" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-6 w-40 mb-3" />
              <Skeleton className="h-16 w-full mb-4" />
              <div className="flex flex-wrap gap-2 mb-4">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-14" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="text-center">
          <Skeleton className="h-12 w-32 mx-auto" />
        </div>
      </div>
    </section>
  )
}

// Seasonal Section Loading Skeleton
export function SeasonalSectionSkeleton() {
  return (
    <section className="py-16 bg-gradient-to-r from-orange-50 to-yellow-50">
      <div className="brand-container">
        <div className="max-w-4xl mx-auto text-center">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-80 mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-start space-x-3">
                  <Skeleton className="w-6 h-6 rounded-full flex-shrink-0 mt-1" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <Skeleton className="h-6 w-48 mx-auto mb-3" />
            <Skeleton className="h-16 w-full mb-4" />
            <Skeleton className="h-12 w-32 mx-auto" />
          </div>
        </div>
      </div>
    </section>
  )
}

// Team Section Loading Skeleton (for About page)
export function TeamSectionSkeleton() {
  return (
    <section className="py-16">
      <div className="brand-container">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 md:p-8 border shadow-sm">
              <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-4 md:gap-6">
                <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-16 w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex flex-wrap gap-1">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-14" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Sustainability Section Loading Skeleton (for About page)
export function SustainabilitySkeleton() {
  return (
    <section className="py-16">
      <div className="brand-container">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-80 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border">
              <Skeleton className="w-12 h-12 rounded-lg mb-4" />
              <Skeleton className="h-6 w-32 mb-3" />
              <Skeleton className="h-16 w-full mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// FAQ Section Loading Skeleton (for Contact page)
export function FAQSectionSkeleton() {
  return (
    <section className="py-16">
      <div className="brand-container">
        <Skeleton className="h-10 w-64 mx-auto mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border">
                <Skeleton className="h-6 w-64 mb-3" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border">
                <Skeleton className="h-6 w-56 mb-3" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Store Information Loading Skeleton (for Contact page)
export function StoreInfoSkeleton() {
  return (
    <div className="bg-white rounded-xl p-8 border">
      <Skeleton className="h-8 w-40 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-3">
            <Skeleton className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Mission Statement Loading Skeleton
export function MissionStatementSkeleton() {
  return (
    <section className="py-16 text-white" style={{backgroundColor: 'var(--theme-primary)'}}>
      <div className="brand-container">
        <div className="max-w-4xl mx-auto text-center">
          <Skeleton className="h-10 w-80 mx-auto mb-6 bg-white/20" />
          <Skeleton className="h-24 w-full mb-8 bg-white/20" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Skeleton className="h-12 w-48 bg-white/20" />
            <Skeleton className="h-12 w-40 bg-white/20" />
          </div>
        </div>
      </div>
    </section>
  )
}

// Generic Section Loading Skeleton
export function SectionSkeleton({ 
  height = "h-64",
  showHeader = true,
  headerWidth = "w-48",
  backgroundColor = "bg-white"
}: {
  height?: string
  showHeader?: boolean
  headerWidth?: string
  backgroundColor?: string
}) {
  return (
    <div className={`py-8 ${backgroundColor}`}>
      <div className="brand-container">
        {showHeader && (
          <div className="text-center mb-8">
            <Skeleton className={`h-8 ${headerWidth} mx-auto mb-4`} />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
        )}
        <Skeleton className={`w-full ${height}`} />
      </div>
    </div>
  )
}