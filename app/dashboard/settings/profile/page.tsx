'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { ProfileSettings } from '@/src/components/settings/ProfileSettings'

export default function ProfileSettingsPage() {
  return (
    <Card className="fade-in-up" style={{ animationDelay: '0.2s' }}>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your profile information and manage your account details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileSettings />
      </CardContent>
    </Card>
  )
}