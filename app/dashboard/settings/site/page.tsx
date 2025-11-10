'use client'

import { SiteInformationSettings } from '@/src/components/settings/SiteInformationSettings'

export default function SiteSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="fade-in-up" style={{ animationDelay: '0s' }}>
        <h1 className="text-3xl font-bold tracking-tight">Site Information</h1>
        <p className="text-gray-500">
          Configure your site&apos;s basic information.
        </p>
      </div>

      <SiteInformationSettings />
    </div>
  )
}
