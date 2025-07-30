'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')

  useEffect(() => {
    // Redirect to homepage with signup parameter if needed
    const url = new URL('/', window.location.origin)
    if (redirectTo) {
      url.searchParams.set('redirectTo', redirectTo)
    }
    router.replace(url.toString())
  }, [router, redirectTo])

  // Return a loading state to avoid flashing
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  )
}