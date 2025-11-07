/**
 * Stripe Connect Disconnect Route
 *
 * Disconnects a Stripe account from a site
 * POST /api/stripe/connect/disconnect
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { handleError } from '@/src/lib/types/error-handling'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siteId } = body

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
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
        { error: 'You must be a site owner to disconnect Stripe' },
        { status: 403 }
      )
    }

    // Clear Stripe account from site
    const { error: updateError } = await supabase
      .from('sites')
      .update({
        stripe_account_id: null,
        stripe_account_status: 'not_connected',
        stripe_onboarding_completed: false,
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
        stripe_disconnected_at: new Date().toISOString(),
      })
      .eq('id', siteId)

    if (updateError) {
      console.error('Failed to disconnect Stripe account:', updateError)
      return NextResponse.json(
        { error: 'Failed to disconnect Stripe account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Disconnect error:', error)
    const errorMessage = handleError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
