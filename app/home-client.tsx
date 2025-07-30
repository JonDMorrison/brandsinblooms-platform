'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Flower } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

// Lazy load auth components to improve performance
const SignIn = lazy(() => import('@/components/auth/SignIn'))
const SignUp = lazy(() => import('@/components/auth/SignUp'))

export default function HomePageClient() {
  const searchParams = useSearchParams()
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true')
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    setIsSignUp(searchParams.get('signup') === 'true')
  }, [searchParams])

  const handleToggle = (signUp: boolean) => {
    setIsSignUp(signUp)
    const url = new URL(window.location.href)
    if (signUp) {
      url.searchParams.set('signup', 'true')
    } else {
      url.searchParams.delete('signup')
    }
    window.history.replaceState({}, '', url.toString())
  }

  if (loading) {
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

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <header className="relative z-10">
        <nav className="brand-container py-6">
          <div className="flex items-center justify-center">
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
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="brand-container">
          <div className="flex flex-col items-center space-y-8">
            {/* Auth Toggle */}
            <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
              <Button
                variant={!isSignUp ? "default" : "ghost"}
                size="sm"
                onClick={() => handleToggle(false)}
                className={!isSignUp ? "btn-gradient-primary" : ""}
              >
                Sign In
              </Button>
              <Button
                variant={isSignUp ? "default" : "ghost"}
                size="sm"
                onClick={() => handleToggle(true)}
                className={isSignUp ? "btn-gradient-primary" : ""}
              >
                Sign Up
              </Button>
            </div>

            {/* Auth Form */}
            <div className="w-full max-w-md">
              <Suspense fallback={
                <div className="flex items-center justify-center h-[400px]">
                  <div className="animate-pulse">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg">
                      <Flower className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              }>
                <div className="transition-all duration-200 ease-in-out">
                  {isSignUp ? <SignUp /> : <SignIn />}
                </div>
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}