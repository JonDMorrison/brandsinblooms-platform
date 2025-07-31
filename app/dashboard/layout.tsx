import { Metadata } from 'next'
import { requireAuth } from '@/src/lib/auth/server'
import { DashboardLayoutClient } from './dashboard-layout-client'

export const metadata: Metadata = {
  title: {
    template: '%s - Dashboard | Brands and Blooms',
    default: 'Dashboard',
  },
  description: 'Manage your floral business, create content, and track orders with Brands and Blooms dashboard.',
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

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}