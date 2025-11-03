'use client'

import { useEffect } from 'react'

export default function AdminPage() {
  useEffect(() => {
    // Force full page reload to ensure proper provider initialization
    window.location.replace('/dashboard/admin')
  }, [])

  // Show loading state during redirect
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to admin dashboard...</p>
      </div>
    </div>
  )
}