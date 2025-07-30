/**
 * Domain Setup Page
 * Provides instructions for connecting a custom domain
 */

import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{
    domain?: string
  }>
}

export default async function DomainSetupPage({ searchParams }: PageProps) {
  const { domain } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Connect Your Domain
            </h1>
            <p className="text-gray-600">
              Set up your custom domain to point to your site
            </p>
          </div>

          {domain && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-purple-800 mb-1">Domain to connect:</p>
              <p className="font-mono text-lg text-purple-900 font-semibold">
                {domain}
              </p>
              <p className="text-xs text-purple-600 mt-2">
                Follow the steps below to connect this domain to your site.
              </p>
            </div>
          )}

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="border-l-4 border-blue-500 pl-6">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  1
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Create or Log Into Your Account
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                You need a Brands and Blooms account to connect a custom domain.
              </p>
              <div className="space-x-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Create Account
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-green-500 pl-6">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  2
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Configure DNS Settings
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                Add these DNS records at your domain registrar or DNS provider:
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-2">
                <div className="grid grid-cols-4 gap-4 font-semibold text-gray-700 border-b pb-2">
                  <span>Type</span>
                  <span>Name</span>
                  <span>Value</span>
                  <span>TTL</span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-gray-600">
                  <span>CNAME</span>
                  <span>www</span>
                  <span>proxy.blooms.cc</span>
                  <span>3600</span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-gray-600">
                  <span>A</span>
                  <span>@</span>
                  <span>192.168.1.100</span>
                  <span>3600</span>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> DNS changes can take up to 48 hours to propagate globally, 
                  but usually take effect within a few hours.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-purple-500 pl-6">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  3
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Add Domain in Dashboard
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                Once your DNS is configured, add your custom domain in your site settings.
              </p>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Go to Site Settings
              </Link>
            </div>

            {/* Verification */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                Verify Your Setup
              </h3>
              <p className="text-blue-800 mb-4">
                You can check if your DNS is configured correctly using these tools:
              </p>
              <div className="space-y-2">
                <a
                  href={`https://dnschecker.org/#CNAME/${domain || 'yourdomain.com'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                >
                  DNS Checker →
                </a>
                <br />
                <a
                  href={`https://whatsmydns.net/#CNAME/${domain || 'yourdomain.com'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                >
                  What's My DNS →
                </a>
              </div>
            </div>

            {/* Help */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Need Help?
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Common DNS Providers:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Cloudflare</li>
                    <li>• GoDaddy</li>
                    <li>• Namecheap</li>
                    <li>• Google Domains</li>
                    <li>• Route 53 (AWS)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Support Resources:</h4>
                  <div className="space-y-2 text-sm">
                    <Link
                      href="/help/custom-domains"
                      className="block text-blue-600 hover:text-blue-800"
                    >
                      Custom Domain Guide →
                    </Link>
                    <Link
                      href="/contact"
                      className="block text-blue-600 hover:text-blue-800"
                    >
                      Contact Support →
                    </Link>
                    <Link
                      href="/help/dns-troubleshooting"
                      className="block text-blue-600 hover:text-blue-800"
                    >
                      DNS Troubleshooting →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-6 border-t">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { domain } = await searchParams
  
  return {
    title: `Domain Setup${domain ? ` - ${domain}` : ''} - Brands and Blooms`,
    description: 'Learn how to connect your custom domain to your Brands and Blooms site with step-by-step DNS configuration instructions.',
  }
}