/**
 * Site Maintenance Page
 * Shown when a site is unpublished or under maintenance
 */

import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{
    site?: string
  }>
}

export default async function SiteMaintenancePage({ searchParams }: PageProps) {
  const { site } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Site Under Maintenance
          </h1>
          <p className="text-gray-600">
            {site ? `${site} is` : 'This site is'} currently unavailable.
          </p>
        </div>

        {site && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 font-medium">{site}</p>
            <p className="text-xs text-blue-600 mt-1">
              Site is not publicly available
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What&apos;s happening:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• The site owner is working on updates</p>
              <p>• The site is temporarily unpublished</p>
              <p>• Content is being reviewed or modified</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-3">
              <strong>Site Owner?</strong> Sign in to access your site.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>

          <div className="pt-4 border-t">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Main Site
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-xs text-gray-500">
          <p>This page will automatically redirect when the site becomes available.</p>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { site } = await searchParams
  
  return {
    title: `Site Maintenance${site ? ` - ${site}` : ''} - Brands in Blooms`,
    description: 'Site is currently under maintenance and temporarily unavailable.',
    robots: 'noindex, nofollow',
  }
}