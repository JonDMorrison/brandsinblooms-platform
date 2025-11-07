/**
 * Stripe Webhook Health Check
 *
 * Endpoint to verify webhook configuration and status
 * GET /api/webhooks/stripe/health
 */

import { NextRequest, NextResponse } from 'next/server'
import { STRIPE_CONFIG } from '@/src/lib/stripe/config'
import { createClient } from '@/src/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Check authentication (only allow admins to access health status)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Perform health checks
    const checks = {
      webhookSecretConfigured: false,
      webhookSecretValid: false,
      databaseConnection: false,
      recentWebhookEvents: {
        total: 0,
        processed: 0,
        failed: 0,
        lastReceived: null as string | null,
      },
      stripeApiConnection: false,
    }

    // 1. Check webhook secret is configured
    const webhookSecret = STRIPE_CONFIG.webhookSecret
    checks.webhookSecretConfigured = !!webhookSecret && webhookSecret !== '' && !webhookSecret.includes('placeholder')

    // 2. Check if webhook secret looks valid (starts with whsec_)
    if (checks.webhookSecretConfigured) {
      checks.webhookSecretValid = webhookSecret.startsWith('whsec_')
    }

    // 3. Check database connection and recent events
    try {
      const { data: recentEvents, error } = await supabase
        .from('stripe_webhook_events')
        .select('id, event_type, processed, error_message, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!error && recentEvents) {
        checks.databaseConnection = true
        checks.recentWebhookEvents.total = recentEvents.length
        checks.recentWebhookEvents.processed = recentEvents.filter(e => e.processed).length
        checks.recentWebhookEvents.failed = recentEvents.filter(e => e.error_message).length
        checks.recentWebhookEvents.lastReceived = recentEvents[0]?.created_at || null
      }
    } catch (error) {
      console.error('Database health check failed:', error)
    }

    // 4. Check Stripe API connection (simple ping)
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY
      checks.stripeApiConnection = !!stripeSecretKey && stripeSecretKey !== ''
    } catch (error) {
      console.error('Stripe API check failed:', error)
    }

    // Calculate overall health
    const isHealthy =
      checks.webhookSecretConfigured &&
      checks.webhookSecretValid &&
      checks.databaseConnection &&
      checks.stripeApiConnection

    // Get event type breakdown
    let eventTypeBreakdown: Record<string, number> = {}
    if (checks.databaseConnection) {
      const { data: eventTypes } = await supabase
        .from('stripe_webhook_events')
        .select('event_type')

      if (eventTypes) {
        eventTypeBreakdown = eventTypes.reduce((acc, event) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    }

    // Get failed events for troubleshooting
    let recentFailures: unknown[] = []
    if (checks.databaseConnection) {
      const { data: failures } = await supabase
        .from('stripe_webhook_events')
        .select('event_type, error_message, created_at')
        .not('error_message', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5)

      recentFailures = failures || []
    }

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
      details: {
        eventTypeBreakdown,
        recentFailures,
      },
      recommendations: generateRecommendations(checks),
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Generate actionable recommendations based on health check results
 */
function generateRecommendations(checks: {
  webhookSecretConfigured: boolean
  webhookSecretValid: boolean
  databaseConnection: boolean
  stripeApiConnection: boolean
  recentWebhookEvents: {
    total: number
    processed: number
    failed: number
    lastReceived: string | null
  }
}): string[] {
  const recommendations: string[] = []

  if (!checks.webhookSecretConfigured) {
    recommendations.push(
      '⚠️ CRITICAL: Webhook secret is not configured. Set STRIPE_WEBHOOK_SECRET in environment variables.'
    )
    recommendations.push(
      '📚 For local dev: Run "stripe listen --forward-connect-to localhost:3001/api/webhooks/stripe" and copy the webhook secret.'
    )
    recommendations.push(
      '🌐 For production: Register webhook at https://dashboard.stripe.com/webhooks and select "Events on Connected accounts".'
    )
  }

  if (checks.webhookSecretConfigured && !checks.webhookSecretValid) {
    recommendations.push(
      '⚠️ WARNING: Webhook secret does not start with "whsec_". This may not be a valid Stripe webhook secret.'
    )
  }

  if (!checks.databaseConnection) {
    recommendations.push(
      '❌ CRITICAL: Cannot connect to database to check webhook event logs.'
    )
  }

  if (!checks.stripeApiConnection) {
    recommendations.push(
      '❌ CRITICAL: STRIPE_SECRET_KEY is not configured. Webhook signature verification will fail.'
    )
  }

  if (checks.recentWebhookEvents.total === 0) {
    recommendations.push(
      '📭 INFO: No webhook events received yet. Trigger a test event from Stripe Dashboard or create a test order.'
    )
  }

  if (checks.recentWebhookEvents.failed > 0) {
    const failureRate = (checks.recentWebhookEvents.failed / checks.recentWebhookEvents.total) * 100
    if (failureRate > 10) {
      recommendations.push(
        `⚠️ WARNING: High webhook failure rate (${failureRate.toFixed(1)}%). Check error logs below.`
      )
    }
  }

  const hoursSinceLastEvent = checks.recentWebhookEvents.lastReceived
    ? (Date.now() - new Date(checks.recentWebhookEvents.lastReceived).getTime()) / (1000 * 60 * 60)
    : null

  if (hoursSinceLastEvent && hoursSinceLastEvent > 24) {
    recommendations.push(
      `📅 INFO: Last webhook received ${Math.floor(hoursSinceLastEvent)} hours ago. Consider testing webhook endpoint.`
    )
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All checks passed! Webhook system is healthy.')
  }

  return recommendations
}
