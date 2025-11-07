/**
 * Stripe Connect Refresh Status Route
 *
 * Fetches current account status from Stripe and updates database
 * GET /api/stripe/connect/refresh-status?siteId=xxx
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
      return NextResponse.json(
        { error: 'siteId parameter is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns this site
    const { data: membership, error: membershipError } = await supabase
      .from('site_memberships')
      .select('role')
      .eq('site_id', siteId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'You must be a site owner to refresh Stripe status' },
        { status: 403 }
      )
    }

    // Get site with Stripe account
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, stripe_account_id')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      )
    }

    if (!site.stripe_account_id) {
      return NextResponse.json(
        { error: 'No Stripe account connected to this site' },
        { status: 400 }
      )
    }

    // Fetch current status from Stripe
    const account = await retrieveConnectAccount(site.stripe_account_id)
    const status = getAccountStatus(account)

    // Update site with latest account status
    const { error: updateError } = await supabase
      .from('sites')
      .update({
        stripe_account_status: status.status,
        stripe_onboarding_completed: status.status === 'active',
        stripe_charges_enabled: status.chargesEnabled,
        stripe_payouts_enabled: status.payoutsEnabled,
      })
      .eq('id', siteId)

    if (updateError) {
      console.error('Failed to update site Stripe status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update Stripe status' },
        { status: 500 }
      )
    }

    // Return updated status
    return NextResponse.json({
      success: true,
      status: status.status,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      onboardingCompleted: status.status === 'active',
    })
  } catch (error) {
    console.error('Stripe Connect refresh status error:', error)
    const errorMessage = handleError(error)

    return NextResponse.json(
      { error: errorMessage.message },
      { status: 500 }
    )
  }
}
