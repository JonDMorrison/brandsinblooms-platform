'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { SecuritySettings } from '@/src/components/settings/SecuritySettings'

export default function SecuritySettingsPage() {
  return (
    <Card className="fade-in-up" style={{ animationDelay: '0.2s' }}>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>
          Manage your password, two-factor authentication, and security preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SecuritySettings />
      </CardContent>
    </Card>
  )
}