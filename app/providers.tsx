'use client'

import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import { Toaster } from '@/src/components/ui/sonner'
import { AuthProvider } from '@/src/contexts/AuthContext'
import { ProfileProvider } from '@/src/contexts/ProfileContext'
import { SiteProvider } from '@/src/contexts/SiteContext'
import { AdminAuthProvider } from '@/src/contexts/AdminAuthContext'
import { AdminImpersonationProvider } from '@/src/contexts/AdminImpersonationContext'
import { ImpersonationBanner } from '@/src/components/admin/ImpersonationBanner'
import { Tables } from '@/src/lib/database/types'


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

  return (
      <AuthProvider>
        <ProfileProvider>
          <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/*
            Provider hierarchy:
            - AuthProvider: Core Supabase auth (shared across all routes)
            - AdminAuthProvider: Admin-specific auth context (for both admin routes and impersonation)
            - AdminImpersonationProvider: Impersonation session management (for both admin routes and customer sites)
            - SiteProvider: Customer site context (only for non-admin routes)

            Note: Admin routes do NOT re-wrap with these providers in their layout - they inherit from here.
          */}
          <AdminAuthProvider>
            <AdminImpersonationProvider>
              {!isAdminRoute ? (
                <SiteProvider
                  initialHostname={initialHostname}
                  initialSiteData={initialSiteData}
                >
                  {/* Show impersonation banner for site routes */}
                  {impersonationData && (
                    <ImpersonationBanner showAdminLink={true} />
                  )}
                  {children}
                </SiteProvider>
              ) : (
                children
              )}
            </AdminImpersonationProvider>
          </AdminAuthProvider>
          <Toaster
            position="top-right"
            duration={4000}
            offset="72px"
          />
          </ThemeProvider>
        </ProfileProvider>
      </AuthProvider>
  )
}