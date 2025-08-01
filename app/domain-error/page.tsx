/**
 * Domain Error Page
 * Shown when middleware detects an invalid domain format
 */

import { Suspense } from 'react'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{
    error?: string
    hostname?: string
  }>
}

export default async function DomainErrorPage({ searchParams }: PageProps) {
  const { error, hostname } = await searchParams

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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Domain
          </h1>
          <p className="text-gray-600">
            The domain you&apos;re trying to access has an invalid format.
          </p>
        </div>

        {hostname && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Requested domain:</p>
            <p className="font-mono text-sm text-gray-800">{hostname}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What you can do:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Check if you typed the domain name correctly</li>
              <li>• Make sure the domain has a valid format (e.g., example.com)</li>
              <li>• Contact the site owner if you believe this is an error</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Main Site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Generate metadata for this error page
export async function generateMetadata({ searchParams }: PageProps) {
  await searchParams // Consume the promise
  return {
    title: 'Domain Error - Brands in Blooms',
    description: 'The requested domain format is invalid.',
    robots: 'noindex, nofollow',
  }
}