/**
 * Checkout Totals Calculation
 *
 * Calculate tax and shipping based on site-specific settings
 */

import { createClient } from '@/src/lib/supabase/server'

export interface CartItem {
  id: string
  productId: string
  quantity: number
  price: number
  subtotal: number
}

export interface ShippingAddress {
  city: string
  state: string
  postalCode: string
  country: string
}

export interface OrderTotals {
  subtotal: number
  tax: number
  shipping: number
  total: number
  currency: string
}

/**
 * Calculate order totals including tax and shipping
 */
export async function calculateOrderTotals(
  siteId: string,
  cartItems: CartItem[],
  shippingAddress?: ShippingAddress
): Promise<OrderTotals> {
  // Calculate subtotal
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0)

  // Get site payment settings
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('site_payment_settings')
    .select('*')
    .eq('site_id', siteId)
    .single()

  // Use defaults if settings not found
  const taxEnabled = settings?.tax_enabled ?? true
  const defaultTaxRate = settings?.default_tax_rate ?? 8.0
  const taxByState = settings?.tax_by_state as Record<string, number> ?? {}
  const shippingEnabled = settings?.shipping_enabled ?? true
  const freeShippingThreshold = settings?.free_shipping_threshold ?? 100.0
  const flatRateShipping = settings?.flat_rate_shipping ?? 10.0
  const shippingByRegion = (settings?.shipping_by_region as Array<{ region: string; rate: number }>) ?? []
  const currency = settings?.currency ?? 'USD'

  // Calculate tax
  let tax = 0
  if (taxEnabled && shippingAddress) {
    const stateRate = taxByState[shippingAddress.state]
    const rate = stateRate !== undefined ? stateRate : defaultTaxRate
    tax = subtotal * (rate / 100)
  }

  // Calculate shipping
  let shipping = 0
  if (shippingEnabled) {
    // Check free shipping threshold
    if (subtotal >= freeShippingThreshold) {
      shipping = 0
    } else if (shippingAddress) {
      // Check for region-specific rate
      const regionRate = shippingByRegion.find(
        r => r.region === shippingAddress.state || r.region === shippingAddress.country
      )
      shipping = regionRate ? regionRate.rate : flatRateShipping
    } else {
      shipping = flatRateShipping
    }
  }

  return {
    subtotal,
    tax,
    shipping,
    total: subtotal + tax + shipping,
    currency,
  }
}

/**
 * Calculate platform commission (if enabled)
 */
export async function calculatePlatformCommission(
  siteId: string,
  orderTotal: number
): Promise<number> {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('site_payment_settings')
    .select('platform_commission_enabled, platform_commission_type, platform_commission_value')
    .eq('site_id', siteId)
    .single()

  if (!settings?.platform_commission_enabled) {
    return 0
  }

  if (settings.platform_commission_type === 'percentage') {
    return orderTotal * (settings.platform_commission_value / 100)
  } else if (settings.platform_commission_type === 'fixed') {
    return settings.platform_commission_value
  }

  return 0
}
