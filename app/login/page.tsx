'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Redirect to homepage with signin parameter, preserving ALL query params
    const url = new URL('/', window.location.origin)
    url.searchParams.set('signin', 'true')

    // Preserve all existing query parameters
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })

    router.replace(url.toString())
  }, [router, searchParams])

  // Return a loading state to avoid flashing
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <LoginRedirect />
    </Suspense>
  )
}