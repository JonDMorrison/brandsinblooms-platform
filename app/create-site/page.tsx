/**
 * Create Site Page
 * Allows users to create a new site for a requested subdomain
 */

import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{
    subdomain?: string
  }>
}

export default async function CreateSitePage({ searchParams }: PageProps) {
  const { subdomain } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your Site
            </h1>
            <p className="text-gray-600">
              Set up your new site on the Brands in Blooms platform
            </p>
          </div>

          {subdomain && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-1">Requested subdomain:</p>
              <p className="font-mono text-lg text-blue-900 font-semibold">
                {subdomain}.blooms.cc
              </p>
              <p className="text-xs text-blue-600 mt-2">
                This subdomain is available and can be reserved for your site.
              </p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                What you'll get:
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Custom Subdomain</p>
                    <p className="text-sm text-gray-600">Your own branded URL</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Content Management</p>
                    <p className="text-sm text-gray-600">Easy-to-use editor</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Product Catalog</p>
                    <p className="text-sm text-gray-600">Showcase your offerings</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Custom Domain</p>
                    <p className="text-sm text-gray-600">Connect your own domain later</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ready to get started?
              </h3>
              <div className="space-y-3">
                <Link
                  href="/signup"
                  className="block w-full px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Account & Site
                </Link>
                
                <Link
                  href="/login"
                  className="block w-full px-6 py-3 bg-gray-100 text-gray-700 text-center rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Already have an account? Sign In
                </Link>
              </div>
            </div>

            <div className="border-t pt-6 text-center">
              <p className="text-sm text-gray-500 mb-4">
                Need help or have questions?
              </p>
              <div className="space-y-2">
                <Link
                  href="/contact"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Contact Support
                </Link>
                <span className="text-gray-300 mx-2">•</span>
                <Link
                  href="/pricing"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Pricing
                </Link>
                <span className="text-gray-300 mx-2">•</span>
                <Link
                  href="/"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { subdomain } = await searchParams
  
  return {
    title: `Create Site${subdomain ? ` - ${subdomain}` : ''} - Brands in Blooms`,
    description: 'Create your new site on the Brands in Blooms platform with custom subdomain and full content management.',
  }
}