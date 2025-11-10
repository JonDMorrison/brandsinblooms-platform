'use client'

import { ProfileSettings } from '@/src/components/settings/ProfileSettings'

export default function ProfileSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="fade-in-up" style={{ animationDelay: '0s' }}>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-gray-500">
          Update your profile information and manage your account details.
        </p>
      </div>

      <ProfileSettings />
    </div>
  )
}
