import { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/server'
import { DashboardLayoutClient } from './dashboard-layout-client'

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

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}