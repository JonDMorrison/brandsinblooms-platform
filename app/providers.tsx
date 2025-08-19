'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState, lazy, Suspense } from 'react'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/src/contexts/AuthContext'
import { SiteProvider } from '@/src/contexts/SiteContext'
import { AdminAuthProvider } from '@/src/contexts/AdminAuthContext'
import { AdminImpersonationProvider } from '@/src/contexts/AdminImpersonationContext'
import { ImpersonationBanner } from '@/src/components/admin/ImpersonationBanner'
import { Tables } from '@/src/lib/database/types'

// Lazy load React Query Devtools only in development
const ReactQueryDevtools = process.env.NODE_ENV === 'development' 
  ? lazy(() => import('@tanstack/react-query-devtools').then(mod => ({
      default: mod.ReactQueryDevtools,
    })))
  : () => null

interface ProvidersProps {
  children: React.ReactNode
  initialHostname?: string
  initialSiteData?: Tables<'sites'> | null
  isAdminRoute?: boolean
  impersonationData?: {
    sessionId: string | null
    adminId: string | null
    adminEmail: string | null
  } | null
}

export function Providers({ children, initialHostname, initialSiteData, isAdminRoute, impersonationData }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: 1,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Reduce unnecessary re-renders
            // notifyOnChangeProps: 'tracked', // TODO: Fix type when React Query updates
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Only provide SiteContext for non-admin routes */}
        {!isAdminRoute ? (
          <AdminAuthProvider>
            <AdminImpersonationProvider>
              <SiteProvider 
                initialHostname={initialHostname}
                initialSiteData={initialSiteData}
              >
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
                disableTransitionOnChange
              >
                {/* Show impersonation banner for site routes */}
                {impersonationData && (
                  <ImpersonationBanner showAdminLink={true} />
                )}
                {children}
                <Toaster 
                  position="top-right" 
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'var(--background)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                    },
                  }}
                />
              </ThemeProvider>
            </SiteProvider>
          </AdminImpersonationProvider>
          </AdminAuthProvider>
        ) : (
          <AdminAuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster 
                position="top-right" 
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  },
                }}
              />
            </ThemeProvider>
          </AdminAuthProvider>
        )}
      </AuthProvider>
      {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  )
}