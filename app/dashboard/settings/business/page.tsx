'use client'

import { BusinessSettings } from '@/src/components/settings/BusinessSettings'

export default function BusinessSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="fade-in-up" style={{ animationDelay: '0s' }}>
        <h1 className="text-3xl font-bold tracking-tight">Business Configuration</h1>
        <p className="text-gray-500">
          Configure your business details and contact information.
        </p>
      </div>

      <BusinessSettings />
    </div>
  )
}
