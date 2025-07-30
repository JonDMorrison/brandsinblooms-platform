/**
 * Site Not Found Page
 * Shown when middleware cannot find a site for the requested domain
 */

import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{
    hostname?: string
    subdomain?: string
    domain?: string
  }>
}

export default async function SiteNotFoundPage({ searchParams }: PageProps) {
  const { hostname, subdomain, domain } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291.94-5.709 2.291"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Site Not Found
          </h1>
          <p className="text-gray-600">
            We couldn't find a site associated with this domain.
          </p>
        </div>

        {hostname && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Requested domain:</p>
            <p className="font-mono text-sm text-gray-800">{hostname}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Possible reasons:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                The site hasn't been created yet
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                The domain configuration is incorrect
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                The site has been deleted or deactivated
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                DNS changes haven't propagated yet (for custom domains)
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">What you can do:</h3>
            
            {subdomain && (
              <Link
                href={`/create-site?subdomain=${subdomain}`}
                className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Create Site for "{subdomain}"
              </Link>
            )}
            
            {domain && (
              <Link
                href={`/domain-setup?domain=${domain}`}
                className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                Set Up Custom Domain
              </Link>
            )}
            
            <Link
              href="/"
              className="block w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center"
            >
              Go to Main Site
            </Link>
          </div>

          <div className="pt-4 border-t text-sm text-gray-500">
            <p>
              If you believe this is an error, please contact support or the site owner.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { hostname } = await searchParams
  
  return {
    title: `Site Not Found${hostname ? ` - ${hostname}` : ''} - Brands and Blooms`,
    description: 'The requested site could not be found.',
    robots: 'noindex, nofollow',
  }
}