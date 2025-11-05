'use client'

/**
 * Stripe Connect Settings Component
 *
 * Allows site owners to connect/disconnect their Stripe account
 */

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Link as LinkIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StripeConnectSettingsProps {
  siteId: string
  stripeAccountId?: string | null
  stripeAccountStatus?: string | null
  chargesEnabled?: boolean
  payoutsEnabled?: boolean
  onboardingCompleted?: boolean
}

export function StripeConnectSettings({
  siteId,
  stripeAccountId,
  stripeAccountStatus,
  chargesEnabled = false,
  payoutsEnabled = false,
  onboardingCompleted = false,
}: StripeConnectSettingsProps) {
  const router = useRouter()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isDashboardLoading, setIsDashboardLoading] = useState(false)

  const isConnected = !!stripeAccountId
  const isActive = stripeAccountStatus === 'active' && chargesEnabled && payoutsEnabled

  const handleConnect = () => {
    setIsConnecting(true)
    // Redirect to Stripe Connect authorization
    window.location.href = `/api/stripe/connect/authorize?siteId=${siteId}`
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Stripe account? You will no longer be able to accept payments.')) {
      return
    }

    setIsDisconnecting(true)
    try {
      const response = await fetch('/api/stripe/connect/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect Stripe account')
      }

      router.refresh()
    } catch (error) {
      console.error('Disconnect error:', error)
      alert('Failed to disconnect Stripe account. Please try again.')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleViewDashboard = async () => {
    if (!stripeAccountId) return

    setIsDashboardLoading(true)
    try {
      const response = await fetch(`/api/stripe/connect/dashboard?siteId=${siteId}`)
      const data = await response.json()

      if (data.url) {
        window.open(data.url, '_blank')
      } else {
        throw new Error('Failed to get dashboard URL')
      }
    } catch (error) {
      console.error('Dashboard error:', error)
      alert('Failed to open Stripe Dashboard. Please try again.')
    } finally {
      setIsDashboardLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!isConnected) {
      return <Badge variant="outline">Not Connected</Badge>
    }

    switch (stripeAccountStatus) {
      case 'active':
        return <Badge className="bg-green-500 text-white">Active</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'restricted':
        return <Badge variant="destructive">Restricted</Badge>
      case 'disabled':
        return <Badge variant="destructive">Disabled</Badge>
      default:
        return <Badge variant="outline">{stripeAccountStatus}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Stripe Payment Processing</span>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Connect your Stripe account to accept credit card payments from customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to connect a Stripe account before you can accept payments on your site.
                Stripe handles all payment processing, security, and compliance.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">What you'll need:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Business information (name, address, tax ID)</li>
                <li>Bank account details for payouts</li>
                <li>Government-issued ID for verification</li>
              </ul>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full sm:w-auto"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Connect Stripe Account
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Account ID</p>
                  <p className="text-xs text-muted-foreground font-mono">{stripeAccountId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="flex items-center gap-2">
                  {chargesEnabled ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">Charges {chargesEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>

                <div className="flex items-center gap-2">
                  {payoutsEnabled ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">Payouts {payoutsEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>

              {!isActive && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {!onboardingCompleted
                      ? 'Your Stripe account setup is incomplete. Complete the onboarding process to accept payments.'
                      : 'Your Stripe account requires attention. Please complete any pending verifications.'}
                  </AlertDescription>
                </Alert>
              )}

              {isActive && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Your Stripe account is active and ready to accept payments!
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {!isActive && (
                <Button
                  onClick={handleConnect}
                  variant="default"
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Complete Stripe Setup'
                  )}
                </Button>
              )}

              <Button
                onClick={handleViewDashboard}
                variant="outline"
                disabled={isDashboardLoading}
              >
                {isDashboardLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Stripe Dashboard
                  </>
                )}
              </Button>

              <Button
                onClick={handleDisconnect}
                variant="destructive"
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  'Disconnect Stripe'
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
