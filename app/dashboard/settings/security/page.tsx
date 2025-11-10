'use client'

import { SecuritySettings } from '@/src/components/settings/SecuritySettings'

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <div className="fade-in-up" style={{ animationDelay: '0s' }}>
        <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-gray-500">
          Manage your password and security preferences.
        </p>
      </div>

      <SecuritySettings />
    </div>
  )
}
