import { AdminAuthProvider } from '@/src/contexts/AdminAuthContext'
import { AdminGuard } from '@/src/components/admin/AdminGuard'

export const metadata = {
  title: 'Platform Admin - Brands in Blooms',
  description: 'Platform administration panel for Brands in Blooms',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      <AdminGuard>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </AdminGuard>
    </AdminAuthProvider>
  )
}