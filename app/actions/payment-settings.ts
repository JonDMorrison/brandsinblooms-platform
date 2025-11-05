'use server'

/**
 * Payment Settings Server Actions
 *
 * Update tax and shipping configuration for sites
 */

import { createClient } from '@/src/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =============================================
// VALIDATION SCHEMAS
// =============================================

const taxSettingsSchema = z.object({
  taxEnabled: z.boolean(),
  defaultTaxRate: z.number().min(0).max(100),
  taxByState: z.record(z.string(), z.number().min(0).max(100)),
  taxInclusive: z.boolean(),
})

const shippingSettingsSchema = z.object({
  shippingEnabled: z.boolean(),
  freeShippingThreshold: z.number().min(0),
  flatRateShipping: z.number().min(0),
  shippingByRegion: z.array(
    z.object({
      region: z.string(),
      rate: z.number().min(0),
    })
  ),
})

// =============================================
// SERVER ACTIONS
// =============================================

export async function updateTaxSettings(siteId: string, settings: z.infer<typeof taxSettingsSchema>) {
  try {
    const supabase = await createClient()

    // Verify user owns the site
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: membership } = await supabase
      .from('site_memberships')
      .select('role')
      .eq('site_id', siteId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'owner') {
      return { success: false, error: 'Only site owners can update payment settings' }
    }

    // Validate settings
    const validated = taxSettingsSchema.parse(settings)

    // Update settings
    const { error } = await supabase
      .from('site_payment_settings')
      .update({
        tax_enabled: validated.taxEnabled,
        default_tax_rate: validated.defaultTaxRate,
        tax_by_state: validated.taxByState,
        tax_inclusive: validated.taxInclusive,
      })
      .eq('site_id', siteId)

    if (error) {
      console.error('Failed to update tax settings:', error)
      return { success: false, error: 'Failed to update tax settings' }
    }

    revalidatePath('/dashboard/settings/payments')
    return { success: true }
  } catch (error) {
    console.error('Update tax settings error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid settings format' }
    }
    return { success: false, error: 'Failed to update tax settings' }
  }
}

export async function updateShippingSettings(siteId: string, settings: z.infer<typeof shippingSettingsSchema>) {
  try {
    const supabase = await createClient()

    // Verify user owns the site
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: membership } = await supabase
      .from('site_memberships')
      .select('role')
      .eq('site_id', siteId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'owner') {
      return { success: false, error: 'Only site owners can update payment settings' }
    }

    // Validate settings
    const validated = shippingSettingsSchema.parse(settings)

    // Update settings
    const { error } = await supabase
      .from('site_payment_settings')
      .update({
        shipping_enabled: validated.shippingEnabled,
        free_shipping_threshold: validated.freeShippingThreshold,
        flat_rate_shipping: validated.flatRateShipping,
        shipping_by_region: validated.shippingByRegion,
      })
      .eq('site_id', siteId)

    if (error) {
      console.error('Failed to update shipping settings:', error)
      return { success: false, error: 'Failed to update shipping settings' }
    }

    revalidatePath('/dashboard/settings/payments')
    return { success: true }
  } catch (error) {
    console.error('Update shipping settings error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid settings format' }
    }
    return { success: false, error: 'Failed to update shipping settings' }
  }
}

export async function getPaymentSettings(siteId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('site_payment_settings')
      .select('*')
      .eq('site_id', siteId)
      .single()

    if (error) {
      console.error('Failed to get payment settings:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Get payment settings error:', error)
    return null
  }
}
