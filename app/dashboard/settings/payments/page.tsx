'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { PaymentSettings } from '@/src/components/settings/PaymentSettings'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PaymentSettingsPage() {
  const searchParams = useSearchParams()
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Handle URL parameters for notifications
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

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
  }, [searchParams])

  return (
    <>
      {/* Notification Alert */}
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="fade-in-up mb-6">
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
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>
            Configure payment processing, tax rates, and shipping options for your site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentSettings />
        </CardContent>
      </Card>
    </>
  )
}