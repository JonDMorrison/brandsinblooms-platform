'use client'

/**
 * Checkout Page Client Component
 *
 * Multi-step checkout flow with shipping, payment, and order confirmation
 */

import { useState, useEffect, useMemo } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useCart } from '@/src/contexts/CartContext'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { ShippingForm } from '@/src/components/checkout/ShippingForm'
import { OrderSummary } from '@/src/components/checkout/OrderSummary'
import { PaymentForm } from '@/src/components/checkout/PaymentForm'
import { ShippingAddress } from '@/src/lib/validation/checkout-schemas'
import { Button } from '@/src/components/ui/button'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { ArrowLeft, ShoppingCart, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CheckoutPageClientProps {
  siteId: string
  stripeAccountId: string
}

export function CheckoutPageClient({ siteId, stripeAccountId }: CheckoutPageClientProps) {
  // Load Stripe with the connected account ID
  const stripePromise = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      console.error('[Checkout] Stripe publishable key not configured')
      return null
    }

    return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, {
      stripeAccount: stripeAccountId,
    })
  }, [stripeAccountId])
  const router = useRouter()
  const { items, clearCart, isHydrated } = useCart()
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping')
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [totals, setTotals] = useState<{
    subtotal: number
    tax: number
    shipping: number
    total: number
  } | null>(null)
  const [isCreatingIntent, setIsCreatingIntent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validate required props
  if (!siteId || !stripeAccountId) {
    console.error('[CheckoutPageClient] Missing required props:', { siteId, stripeAccountId })
    return (
      <div className="brand-container py-12">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load checkout. Payment configuration is missing. Please contact the site owner.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // Redirect if cart is empty (only after cart has hydrated to prevent race condition)
  useEffect(() => {
    if (isHydrated && items.length === 0) {
      router.push('/cart')
    }
  }, [isHydrated, items.length, router])

  const handleShippingSubmit = async (address: ShippingAddress) => {
    setShippingAddress(address)
    setIsCreatingIntent(true)
    setError(null)

    try {
      // Create payment intent with shipping info
      const response = await fetch('/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          cartItems: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          shippingAddress: address,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent')
      }

      setClientSecret(data.clientSecret)
      setPaymentIntentId(data.paymentIntentId)
      setTotals(data.totals)
      setStep('payment')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsCreatingIntent(false)
    }
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!shippingAddress || !totals) return

    try {
      // Create order in database
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          stripePaymentIntentId: paymentIntentId,
          cartItems: items.map(item => ({
            productId: item.productId,
            productName: item.product.name,
            productSku: item.product.sku,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.subtotal,
          })),
          customerEmail: shippingAddress.email,
          customerName: shippingAddress.fullName,
          shippingAddress,
          subtotal: totals.subtotal,
          taxAmount: totals.tax,
          shippingAmount: totals.shipping,
          totalAmount: totals.total,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      // Clear cart
      await clearCart()

      // Redirect to confirmation page
      router.push(`/order-confirmation/${data.orderId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    }
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
  }

  // Show loading state while cart is hydrating
  if (!isHydrated) {
    return (
      <div className="brand-container py-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-500">Loading checkout...</p>
        </div>
      </div>
    )
  }

  // This will be caught by the useEffect redirect, but prevents flash of content
  if (items.length === 0) {
    return null
  }

  return (
    <div className="brand-container py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/cart" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
          <h1 className="text-4xl font-bold mt-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
            Checkout
          </h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {step === 'shipping' && (
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-2xl font-semibold mb-6">Shipping Information</h2>
                <ShippingForm
                  onSubmit={handleShippingSubmit}
                  isSubmitting={isCreatingIntent}
                />
              </div>
            )}

            {step === 'payment' && clientSecret && (
              <div className="bg-card rounded-lg border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Payment</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('shipping')}
                    disabled={isCreatingIntent}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Edit Shipping
                  </Button>
                </div>

                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                    },
                  }}
                >
                  <PaymentForm
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    amount={totals?.total || 0}
                  />
                </Elements>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <OrderSummary
                subtotal={totals?.subtotal}
                tax={totals?.tax}
                shipping={totals?.shipping}
                total={totals?.total}
                isCalculating={isCreatingIntent}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
