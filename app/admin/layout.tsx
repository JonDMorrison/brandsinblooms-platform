import { AdminGuard } from '@/src/components/admin/AdminGuard'

export const metadata = {
  title: 'Platform Admin - Brands in Blooms',
  description: 'Platform administration panel for Brands in Blooms',
}

/**
 * Admin Layout
 *
 * NOTE: AdminAuthProvider and AdminImpersonationProvider are provided by the root
 * Providers component (app/providers.tsx). We do NOT re-wrap them here to avoid
 * duplicate provider instances and multiple auth state listeners.
 *
 * This layout only provides:
 * - AdminGuard for route protection
 * - Layout styling
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </AdminGuard>
  )
}