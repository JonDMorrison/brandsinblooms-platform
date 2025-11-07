'use client'

/**
 * Payment Settings Component
 *
 * Wrapper component that fetches payment data and renders:
 * - Stripe Connect settings
 * - Tax configuration
 * - Shipping configuration
 */

import { useEffect, useState } from 'react'
import { useCurrentSite, useSitePermissions } from '@/src/hooks/useSite'
import { StripeConnectSettings } from '@/src/components/payments/StripeConnectSettings'
import { TaxSettings } from '@/src/components/payments/TaxSettings'
import { ShippingSettings } from '@/src/components/payments/ShippingSettings'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { getPaymentSettings } from '@/app/actions/payment-settings'

interface PaymentSettingsData {
  id: string
  site_id: string
  tax_enabled: boolean
  default_tax_rate: number
  tax_by_state: Record<string, number>
  tax_inclusive: boolean
  shipping_enabled: boolean
  free_shipping_threshold: number | null
  flat_rate_shipping: number
  shipping_by_region: Array<{ region: string; rate: number }>
  currency: string
  minimum_order_amount: number | null
}

export function PaymentSettings() {
  const { site, loading: siteLoading } = useCurrentSite()
  const { canManage } = useSitePermissions()
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch payment settings when site loads
  useEffect(() => {
    async function fetchPaymentSettings() {
      if (!site?.id) return

      try {
        setLoading(true)
        const settings = await getPaymentSettings(site.id)

        if (settings) {
          setPaymentSettings(settings as PaymentSettingsData)
        }
      } catch (err) {
        console.error('Failed to fetch payment settings:', err)
        setError('Failed to load payment settings')
      } finally {
        setLoading(false)
      }
    }

    if (site?.id) {
      fetchPaymentSettings()
    }
  }, [site?.id])

  // Loading state
  if (siteLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // No site selected
  if (!site) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Site Selected</AlertTitle>
        <AlertDescription>
          Please select a site to configure payment settings.
        </AlertDescription>
      </Alert>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Permissions Warning */}
      {!canManage && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>View Only Access</AlertTitle>
          <AlertDescription>
            You have read-only access to payment settings. Contact the site owner to make changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Stripe Connect Settings */}
      <StripeConnectSettings
        siteId={site.id}
        stripeAccountId={site.stripe_account_id}
        stripeAccountStatus={site.stripe_account_status}
        chargesEnabled={site.stripe_charges_enabled}
        payoutsEnabled={site.stripe_payouts_enabled}
        onboardingCompleted={site.stripe_onboarding_completed}
      />

      {/* Tax Settings */}
      {paymentSettings && (
        <TaxSettings
          siteId={site.id}
          settings={{
            taxEnabled: paymentSettings.tax_enabled,
            defaultTaxRate: paymentSettings.default_tax_rate,
            taxByState: paymentSettings.tax_by_state,
          }}
          canManage={canManage}
        />
      )}

      {/* Shipping Settings */}
      {paymentSettings && (
        <ShippingSettings
          siteId={site.id}
          settings={{
            shippingEnabled: paymentSettings.shipping_enabled,
            freeShippingThreshold: paymentSettings.free_shipping_threshold ?? 100,
            flatRateShipping: paymentSettings.flat_rate_shipping,
            shippingByRegion: paymentSettings.shipping_by_region,
          }}
          canManage={canManage}
        />
      )}
    </div>
  )
}
