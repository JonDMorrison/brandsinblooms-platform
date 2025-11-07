'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { ProfileSettings } from '@/src/components/settings/ProfileSettings'
import { SiteSettings } from '@/src/components/settings/SiteSettings'
import { SecuritySettings } from '@/src/components/settings/SecuritySettings'
import { PaymentSettings } from '@/src/components/settings/PaymentSettings'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { User, Globe, Shield, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Handle URL parameters for tab and notifications
  useEffect(() => {
    const tab = searchParams.get('tab')
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    // Set active tab from URL
    if (tab && ['profile', 'site', 'security', 'payments'].includes(tab)) {
      setActiveTab(tab)
    }

    // Show success notification
    if (success) {
      let message = 'Stripe account connected successfully!'
      if (success === 'stripe_active') {
        message = 'Your Stripe account is active and ready to accept payments!'
      } else if (success === 'stripe_pending') {
        message = 'Stripe account connected. Please complete any pending verifications to activate payments.'
      }
      setNotification({ type: 'success', message })
    }

    // Show error notification
    if (error) {
      let message = 'An error occurred. Please try again.'
      if (error === 'missing_site_id') {
        message = 'Missing site ID. Please try again from your site settings.'
      } else if (error === 'no_stripe_account') {
        message = 'No Stripe account found. Please try connecting again.'
      } else {
        message = decodeURIComponent(error)
      }
      setNotification({ type: 'error', message })
    }

    // Clear URL parameters after reading them
    if (tab || success || error) {
      const newUrl = '/dashboard/settings'
      router.replace(newUrl, { scroll: false })
    }
  }, [searchParams, router])

  return (
    <div className="space-y-6">
      <div className="fade-in-up" style={{ animationDelay: '0s' }}>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Notification Alert */}
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="fade-in-up">
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{notification.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

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