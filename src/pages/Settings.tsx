import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileSettings } from '@/components/settings/ProfileSettings'
import { SiteSettings } from '@/components/settings/SiteSettings'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { SecuritySettings } from '@/components/settings/SecuritySettings'
import { BillingSettings } from '@/components/settings/BillingSettings'
import { User, Globe, Bell, Shield, CreditCard } from 'lucide-react'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="site" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Site
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Billing
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

            <TabsContent value="notifications" className="space-y-6">
              <div>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how and when you receive notifications.
                </CardDescription>
              </div>
              <NotificationSettings />
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

            <TabsContent value="billing" className="space-y-6">
              <div>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>
                  Manage your subscription, payment methods, and invoices.
                </CardDescription>
              </div>
              <BillingSettings />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}