/**
 * Stripe Connect Callback Route
 *
 * Handles redirect after Stripe Connect onboarding
 * GET /api/stripe/connect/callback?siteId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { retrieveConnectAccount, getAccountStatus } from '@/src/lib/stripe/connect'
import { handleError } from '@/src/lib/types/error-handling'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const siteId = searchParams.get('siteId')

    if (!siteId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments?error=missing_site_id`
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?redirect=/dashboard/settings/payments`
      )
    }

    // Get site with Stripe account
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, stripe_account_id')
      .eq('id', siteId)
      .single()

    if (siteError || !site || !site.stripe_account_id) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments?error=no_stripe_account`
      )
    }

    // Retrieve account from Stripe to get current status
    const account = await retrieveConnectAccount(site.stripe_account_id)
    const status = getAccountStatus(account)

    // Update site with latest account status
    const { error: updateError } = await supabase
      .from('sites')
      .update({
        stripe_account_status: status.status,
        stripe_onboarding_completed: status.detailsSubmitted,
        stripe_charges_enabled: status.chargesEnabled,
        stripe_payouts_enabled: status.payoutsEnabled,
      })
      .eq('id', siteId)

    if (updateError) {
      console.error('Failed to update site Stripe status:', updateError)
    }

    // Determine success message based on status
    let message = 'stripe_connected'
    if (status.status === 'active') {
      message = 'stripe_active'
    } else if (status.status === 'pending' || status.requiresInformation) {
      message = 'stripe_pending'
    }

    // Redirect to payment settings page with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments?success=${message}&siteId=${siteId}`
    )
  } catch (error) {
    console.error('Stripe Connect callback error:', error)
    const errorMessage = handleError(error)

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments?error=${encodeURIComponent(errorMessage)}`
    )
  }
}
