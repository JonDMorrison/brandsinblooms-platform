/**
 * Stripe Connect Dashboard Link Route
 *
 * Creates a login link for site owners to access their Stripe Dashboard
 * GET /api/stripe/connect/dashboard?siteId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createAccountLoginLink } from '@/src/lib/stripe/connect'
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
        { error: 'You must be a site owner to access Stripe Dashboard' },
        { status: 403 }
      )
    }

    // Get site's Stripe account ID
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('stripe_account_id')
      .eq('id', siteId)
      .single()

    if (siteError || !site || !site.stripe_account_id) {
      return NextResponse.json(
        { error: 'Site does not have a connected Stripe account' },
        { status: 400 }
      )
    }

    // Create login link
    const loginLink = await createAccountLoginLink(site.stripe_account_id)

    return NextResponse.json({ url: loginLink.url })
  } catch (error) {
    console.error('Dashboard link error:', error)
    const errorMessage = handleError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
