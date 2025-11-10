'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { SiteSettings } from '@/src/components/settings/SiteSettings'

export default function SiteSettingsPage() {
  return (
    <Card className="fade-in-up" style={{ animationDelay: '0.2s' }}>
      <CardHeader>
        <CardTitle>Site Information</CardTitle>
        <CardDescription>
          Configure your site settings, branding, and SEO preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SiteSettings />
      </CardContent>
    </Card>
  )
}