'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { ProfileSettings } from '@/src/components/settings/ProfileSettings'
import { SiteSettings } from '@/src/components/settings/SiteSettings'
import { SecuritySettings } from '@/src/components/settings/SecuritySettings'
import { PaymentSettings } from '@/src/components/settings/PaymentSettings'
import { User, Globe, Shield, CreditCard } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="space-y-6">
      <div className="fade-in-up" style={{ animationDelay: '0s' }}>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500">
          Manage your account settings and preferences.
        </p>
      </div>

      <Card className="fade-in-up" style={{ animationDelay: '0.2s' }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="site" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Site
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payments
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="space-y-6">
            <TabsContent value="profile" className="space-y-6">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information and manage your account details.
                </CardDescription>
              </div>
              <ProfileSettings />
            </TabsContent>

            <TabsContent value="site" className="space-y-6">
              <div>
                <CardTitle>Site Configuration</CardTitle>
                <CardDescription>
                  Configure your site settings, domain, and SEO preferences.
                </CardDescription>
              </div>
              <SiteSettings />
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <div>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and security preferences.
                </CardDescription>
              </div>
              <SecuritySettings />
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <div>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>
                  Configure payment processing, tax rates, and shipping options for your site.
                </CardDescription>
              </div>
              <PaymentSettings />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}