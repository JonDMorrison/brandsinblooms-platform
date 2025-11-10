import { ReactNode } from 'react'

export default function SettingsLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <div className="space-y-6">
      <div className="fade-in-up" style={{ animationDelay: '0s' }}>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      {children}
    </div>
  )
}