/**
 * Stripe Connect Authorization Route
 *
 * Initiates Stripe Connect Express onboarding flow
 * GET /api/stripe/connect/authorize?siteId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createConnectAccount, createAccountLink } from '@/src/lib/stripe/connect'
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
        { error: 'You must be a site owner to connect Stripe' },
        { status: 403 }
      )
    }

    // Get site details
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name, subdomain, stripe_account_id')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      )
    }

    // Check if site already has a Stripe account
    if (site.stripe_account_id) {
      // Site already connected - create account update link instead
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const refreshUrl = `${appUrl}/dashboard/settings?tab=payments&reconnect=true&siteId=${siteId}`
      const returnUrl = `${appUrl}/api/stripe/connect/callback?siteId=${siteId}`

      const accountLink = await createAccountLink(
        site.stripe_account_id,
        refreshUrl,
        returnUrl,
        'account_update'
      )

      return NextResponse.redirect(accountLink.url)
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .single()

    const email = profile?.email || user.email || ''

    // Create new Stripe Connect account
    const account = await createConnectAccount({
      email,
      businessName: site.name,
      country: 'US',
      metadata: {
        site_id: siteId,
        subdomain: site.subdomain,
      },
    })

    // Save Stripe account ID to database
    const { error: updateError } = await supabase
      .from('sites')
      .update({
        stripe_account_id: account.id,
        stripe_account_status: 'pending',
        stripe_connected_at: new Date().toISOString(),
      })
      .eq('id', siteId)

    if (updateError) {
      console.error('Failed to save Stripe account ID:', updateError)
      return NextResponse.json(
        { error: 'Failed to save Stripe account' },
        { status: 500 }
      )
    }

    // Create account link for onboarding
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const refreshUrl = `${appUrl}/dashboard/settings?tab=payments&refresh=true&siteId=${siteId}`
    const returnUrl = `${appUrl}/api/stripe/connect/callback?siteId=${siteId}`

    const accountLink = await createAccountLink(
      account.id,
      refreshUrl,
      returnUrl,
      'account_onboarding'
    )

    // Redirect user to Stripe onboarding
    return NextResponse.redirect(accountLink.url)
  } catch (error) {
    console.error('Stripe Connect authorization error:', error)
    const errorMessage = handleError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
