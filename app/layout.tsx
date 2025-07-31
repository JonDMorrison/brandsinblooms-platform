import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { Providers } from './providers'
import { WebVitals } from '@/components/WebVitals'
import { generateSiteMetadata } from '@/src/lib/site/metadata'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Generate dynamic metadata based on the current site
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const hostname = headersList.get('host') || ''
  const currentSite = headersList.get('x-current-site')
  
  return generateSiteMetadata(hostname, currentSite ? JSON.parse(currentSite) : null)
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const hostname = headersList.get('host') || ''
  const currentSite = headersList.get('x-current-site')
  
  // Check if this is an admin route based on middleware headers
  const isAdminRoute = headersList.get('x-admin-route') === 'true'
  
  // Check if this is an impersonated session
  const isImpersonated = headersList.get('x-admin-impersonation') === 'true'
  const impersonationData = isImpersonated ? {
    sessionId: headersList.get('x-impersonation-session-id'),
    adminId: headersList.get('x-impersonation-admin-id'),
    adminEmail: headersList.get('x-impersonation-admin-email'),
  } : null
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <WebVitals />
        <Providers 
          initialHostname={hostname}
          initialSiteData={currentSite ? JSON.parse(currentSite) : null}
          isAdminRoute={isAdminRoute}
          impersonationData={impersonationData}
        >
          {children}
        </Providers>
      </body>
    </html>
  )
}