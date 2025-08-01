/**
 * System Error Page
 * Shown when middleware encounters a database or system error
 */

import Link from 'next/link'
import { Suspense } from 'react'

interface PageProps {
  searchParams: Promise<{
    hostname?: string
    error?: string
  }>
}

export default async function SystemErrorPage({ searchParams }: PageProps) {
  const { hostname, error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            System Error
          </h1>
          <p className="text-gray-600">
            We&apos;re experiencing temporary technical difficulties.
          </p>
        </div>

        {hostname && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Requested domain:</p>
            <p className="font-mono text-sm text-gray-800">{hostname}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-yellow-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-yellow-800">
                Our technical team has been automatically notified.
              </p>
            </div>
          </div>

          <div className="text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What you can try:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Refresh the page in a few minutes</li>
              <li>• Check if other sites are working normally</li>
              <li>• Try accessing the site later</li>
              <li>• Contact support if the issue persists</li>
            </ul>
          </div>

          <div className="pt-4 space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            
            <Link
              href="/"
              className="block w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center"
            >
              Go to Main Site
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <div className="text-xs text-gray-500 space-y-2">
            <p>Error ID: {Date.now().toString(36)}</p>
            <p>If you continue to experience issues, please reference this error ID when contacting support.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ searchParams }: PageProps) {
  await searchParams // Consume the promise
  return {
    title: 'System Error - Brands in Blooms',
    description: 'We are experiencing temporary technical difficulties.',
    robots: 'noindex, nofollow',
  }
}