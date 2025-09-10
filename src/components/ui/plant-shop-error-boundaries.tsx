'use client'

import React from 'react'
import { ErrorBoundary } from '@/src/components/content-editor/ErrorBoundary'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { Button } from '@/src/components/ui/button'
import { RefreshCw, AlertTriangle, Leaf } from 'lucide-react'

interface PlantShopErrorFallbackProps {
  error: Error
  resetError: () => void
  sectionName: string
  description?: string
}

function PlantShopErrorFallback({ 
  error, 
  resetError, 
  sectionName, 
  description 
}: PlantShopErrorFallbackProps) {
  return (
    <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        {sectionName} Temporarily Unavailable
      </h3>
      <p className="mt-2 text-sm text-gray-600">
        {description || `We're having trouble loading the ${sectionName.toLowerCase()}. Don't worry - the rest of our plant collection is still available!`}
      </p>
      {process.env.NODE_ENV === 'development' && (
        <p className="mt-2 text-xs text-gray-400 font-mono">
          {error.message}
        </p>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <Button 
          onClick={resetError} 
          size="sm" 
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        <Button 
          onClick={() => window.location.href = '/plants'} 
          size="sm"
          className="flex items-center gap-2"
        >
          <Leaf className="h-4 w-4" />
          Browse Plants
        </Button>
      </div>
    </div>
  )
}

// Hero Section Error Boundary
export function HeroSectionErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="relative py-20 lg:py-32 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="brand-container">
            <PlantShopErrorFallback
              error={new Error('Hero section failed to load')}
              resetError={() => window.location.reload()}
              sectionName="Hero Section"
              description="The main banner is having issues, but you can still explore our amazing plant collection below!"
            />
          </div>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error('Hero section error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Featured Plants Error Boundary
export function FeaturedPlantsErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <section className="py-16 bg-white">
          <div className="brand-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                Featured Plants
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover our hand-picked selection of beautiful plants
              </p>
            </div>
            <PlantShopErrorFallback
              error={new Error('Featured plants failed to load')}
              resetError={() => window.location.reload()}
              sectionName="Featured Plants"
              description="Our featured plants are taking a little break. Browse our full catalog instead!"
            />
          </div>
        </section>
      }
      onError={(error, errorInfo) => {
        console.error('Featured plants error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Categories Section Error Boundary
export function CategoriesSectionErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <section className="py-16 bg-gray-50">
          <div className="brand-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                Plant Categories
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore plants by category
              </p>
            </div>
            <PlantShopErrorFallback
              error={new Error('Categories section failed to load')}
              resetError={() => window.location.reload()}
              sectionName="Plant Categories"
              description="Our category browser is temporarily down. You can still search for specific plants!"
            />
          </div>
        </section>
      }
      onError={(error, errorInfo) => {
        console.error('Categories section error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Care Guides Error Boundary
export function CareGuidesSectionErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <section className="py-16 bg-white">
          <div className="brand-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                Plant Care Guides
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Expert advice for plant parents
              </p>
            </div>
            <PlantShopErrorFallback
              error={new Error('Care guides failed to load')}
              resetError={() => window.location.reload()}
              sectionName="Plant Care Guides"
              description="Our care guides are being updated. Contact our plant experts for personalized advice!"
            />
          </div>
        </section>
      }
      onError={(error, errorInfo) => {
        console.error('Care guides section error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Team Section Error Boundary (for About page)
export function TeamSectionErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <section className="py-16">
          <div className="brand-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Meet Our Plant Care Experts</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our certified horticulturists bring decades of professional plant expertise
              </p>
            </div>
            <PlantShopErrorFallback
              error={new Error('Team section failed to load')}
              resetError={() => window.location.reload()}
              sectionName="Team Section"
              description="Our team profiles are currently unavailable, but our plant experts are still here to help!"
            />
          </div>
        </section>
      }
      onError={(error, errorInfo) => {
        console.error('Team section error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Sustainability Section Error Boundary (for About page)
export function SustainabilityErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <section className="py-16">
          <div className="brand-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Commitment to Sustainability</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Environmental stewardship is at the heart of everything we do
              </p>
            </div>
            <PlantShopErrorFallback
              error={new Error('Sustainability section failed to load')}
              resetError={() => window.location.reload()}
              sectionName="Sustainability Section"
              description="Information about our eco-friendly practices is temporarily unavailable."
            />
          </div>
        </section>
      }
      onError={(error, errorInfo) => {
        console.error('Sustainability section error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// FAQ Section Error Boundary (for Contact page)
export function FAQSectionErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <section className="py-16">
          <div className="brand-container">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <PlantShopErrorFallback
              error={new Error('FAQ section failed to load')}
              resetError={() => window.location.reload()}
              sectionName="FAQ Section"
              description="Our FAQ section is temporarily down. Please contact us directly for any questions!"
            />
          </div>
        </section>
      }
      onError={(error, errorInfo) => {
        console.error('FAQ section error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Generic Section Error Boundary
export function SectionErrorBoundary({ 
  children, 
  sectionName,
  fallbackDescription 
}: { 
  children: React.ReactNode
  sectionName: string
  fallbackDescription?: string
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="py-8">
          <PlantShopErrorFallback
            error={new Error(`${sectionName} failed to load`)}
            resetError={() => window.location.reload()}
            sectionName={sectionName}
            description={fallbackDescription}
          />
        </div>
      }
      onError={(error, errorInfo) => {
        console.error(`${sectionName} error:`, error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}