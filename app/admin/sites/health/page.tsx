import { SiteHealthDashboard } from '@/src/components/admin/SiteHealthDashboard'

export const metadata = {
  title: 'Platform Health - Admin Dashboard',
  description: 'Monitor the health and status of all sites on the platform',
}

export default function PlatformHealthPage() {
  return <SiteHealthDashboard />
}