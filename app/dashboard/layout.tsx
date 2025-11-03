import { Metadata } from 'next'
import { requireAuth, requireRole } from '@/src/lib/auth/server'
import { DashboardLayoutClient } from './dashboard-layout-client'
import { AccessRestricted } from '@/src/components/dashboard/AccessRestricted'

export const metadata: Metadata = {
  title: {
    template: '%s - Dashboard | Brands in Blooms',
    default: 'Dashboard',
  },
  description: 'Manage your floral business, create content, and track orders with Brands in Blooms dashboard.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  // Check if user has site_owner or admin role
  const authData = await requireRole(['site_owner', 'admin'])

  // If user doesn't have required role, show access restricted message
  if (!authData) {
    return <AccessRestricted />
  }

  // User has required role - show dashboard normally
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}