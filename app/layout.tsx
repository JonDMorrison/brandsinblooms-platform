import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { Providers } from './providers';
import { WebVitals } from '@/src/components/WebVitals';
import { generateSiteMetadata } from '@/src/lib/site/metadata';
import './globals.css';

// const inter = Inter({ 
//   subsets: ['latin'],
//   display: 'swap', // Prevent FOIT (Flash of Invisible Text)
//   preload: false
// });

// Generate dynamic metadata based on the current site
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const currentSite = headersList.get('x-current-site');

  return generateSiteMetadata(
    hostname,
    currentSite ? JSON.parse(currentSite) : null
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const currentSite = headersList.get('x-current-site');

  // Check if this is an admin route based on middleware headers
  const isAdminRoute = headersList.get('x-admin-route') === 'true';

  // Check if this is an impersonated session
  const isImpersonated = headersList.get('x-admin-impersonation') === 'true';
  const impersonationData = isImpersonated
    ? {
        sessionId: headersList.get('x-impersonation-session-id'),
        adminId: headersList.get('x-impersonation-admin-id'),
        adminEmail: headersList.get('x-impersonation-admin-email'),
      }
    : null;

  // Determine if this is a customer site route vs main app route
  // Customer sites will have x-site-id header set by middleware
  const siteId = headersList.get('x-site-id');
  const isCustomerSite = !!siteId && !isAdminRoute;
  
  // Main app includes: dashboard, admin, platform pages, auth pages, home page (localhost:3001)
  const isMainApp = !isCustomerSite;

  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body 
        className={`antialiased`}
        data-app={isMainApp ? 'platform' : 'site'}
      >
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
  );
}
