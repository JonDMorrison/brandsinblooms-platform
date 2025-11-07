/**
 * Stripe Connect Functions
 *
 * Handle Stripe Connect account onboarding and management
 */

import { stripe, STRIPE_CONFIG } from './config'
import Stripe from 'stripe'

// =============================================
// CONNECT ACCOUNT MANAGEMENT
// =============================================

/**
 * Create a Stripe Connect Express account for a site
 *
 * @param params - Account creation parameters
 * @returns Stripe Account
 */
export async function createConnectAccount(params: {
  email: string
  businessName: string
  country?: string
  metadata?: Record<string, string>
}): Promise<Stripe.Account> {
  const { email, businessName, country = 'US', metadata } = params

  const account = await stripe.accounts.create({
    type: STRIPE_CONFIG.connectAccountType,
    email,
    country,
    business_type: 'individual', // Can be changed to 'company' if needed
    business_profile: {
      name: businessName,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      ...metadata,
      platform: 'brands-in-blooms',
    },
  })

  return account
}

/**
 * Create account link for onboarding/re-onboarding
 *
 * @param accountId - Stripe Connect account ID
 * @param refreshUrl - URL to redirect if link expires
 * @param returnUrl - URL to redirect after onboarding
 * @param type - Type of link ('account_onboarding' or 'account_update')
 * @returns Account link
 */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string,
  type: 'account_onboarding' | 'account_update' = 'account_onboarding'
): Promise<Stripe.AccountLink> {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type,
  })

  return accountLink
}

/**
 * Retrieve a Connect account with full details
 *
 * @param accountId - Stripe Connect account ID
 * @returns Stripe Account
 */
export async function retrieveConnectAccount(
  accountId: string
): Promise<Stripe.Account> {
  return await stripe.accounts.retrieve(accountId)
}

/**
 * Delete/deauthorize a Connect account
 *
 * @param accountId - Stripe Connect account ID
 * @returns Deleted account response
 */
export async function deleteConnectAccount(
  accountId: string
): Promise<Stripe.DeletedAccount> {
  return await stripe.accounts.del(accountId)
}

// =============================================
// ACCOUNT STATUS CHECKS
// =============================================

/**
 * Check if an account can accept charges
 *
 * @param account - Stripe Account
 * @returns True if account can accept charges
 */
export function canAccountAcceptCharges(account: Stripe.Account): boolean {
  return account.charges_enabled === true
}

/**
 * Check if an account can receive payouts
 *
 * @param account - Stripe Account
 * @returns True if account can receive payouts
 */
export function canAccountReceivePayouts(account: Stripe.Account): boolean {
  return account.payouts_enabled === true
}

/**
 * Get account status summary
 *
 * @param account - Stripe Account
 * @returns Account status information
 */
export function getAccountStatus(account: Stripe.Account): {
  status: 'not_connected' | 'pending' | 'active' | 'restricted' | 'disabled'
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  requiresInformation: boolean
  requirements: string[]
} {
  const detailsSubmitted = account.details_submitted ?? false
  const chargesEnabled = account.charges_enabled ?? false
  const payoutsEnabled = account.payouts_enabled ?? false

  // Determine overall status
  let status: 'not_connected' | 'pending' | 'active' | 'restricted' | 'disabled'

  if (!detailsSubmitted) {
    status = 'pending'
  } else if (chargesEnabled && payoutsEnabled) {
    status = 'active'
  } else if (chargesEnabled || payoutsEnabled) {
    status = 'restricted'
  } else {
    status = 'disabled'
  }

  // Get requirements
  const requirements = [
    ...(account.requirements?.currently_due || []),
    ...(account.requirements?.eventually_due || []),
  ]

  return {
    status,
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    requiresInformation: requirements.length > 0,
    requirements,
  }
}

// =============================================
// LOGIN LINK (for accessing Stripe Dashboard)
// =============================================

/**
 * Create login link for connected account to access their Stripe Dashboard
 *
 * @param accountId - Stripe Connect account ID
 * @returns Login link
 */
export async function createAccountLoginLink(
  accountId: string
): Promise<Stripe.LoginLink> {
  return await stripe.accounts.createLoginLink(accountId)
}

// =============================================
// BALANCE & PAYOUTS
// =============================================

/**
 * Get balance for a connected account
 *
 * @param accountId - Stripe Connect account ID
 * @returns Balance information
 */
export async function getAccountBalance(
  accountId: string
): Promise<Stripe.Balance> {
  return await stripe.balance.retrieve({
    stripeAccount: accountId,
  })
}

/**
 * List payouts for a connected account
 *
 * @param accountId - Stripe Connect account ID
 * @param limit - Number of payouts to retrieve
 * @returns List of payouts
 */
export async function listAccountPayouts(
  accountId: string,
  limit: number = 10
): Promise<Stripe.ApiList<Stripe.Payout>> {
  return await stripe.payouts.list(
    { limit },
    { stripeAccount: accountId }
  )
}

// =============================================
// VERIFICATION HELPERS
// =============================================

/**
 * Check if account needs additional information
 *
 * @param account - Stripe Account
 * @returns True if account needs more information
 */
export function needsAdditionalInformation(account: Stripe.Account): boolean {
  const currentlyDue = account.requirements?.currently_due || []
  const eventuallyDue = account.requirements?.eventually_due || []
  return currentlyDue.length > 0 || eventuallyDue.length > 0
}

/**
 * Get human-readable requirement descriptions
 *
 * @param requirements - Array of requirement field names
 * @returns Human-readable descriptions
 */
export function getRequirementDescriptions(requirements: string[]): string[] {
  const descriptions: Record<string, string> = {
    'business_profile.mcc': 'Business category',
    'business_profile.url': 'Business website',
    'business_type': 'Business type',
    'external_account': 'Bank account for payouts',
    'individual.address.city': 'City',
    'individual.address.line1': 'Street address',
    'individual.address.postal_code': 'Postal code',
    'individual.address.state': 'State',
    'individual.dob.day': 'Date of birth - day',
    'individual.dob.month': 'Date of birth - month',
    'individual.dob.year': 'Date of birth - year',
    'individual.email': 'Email address',
    'individual.first_name': 'First name',
    'individual.last_name': 'Last name',
    'individual.phone': 'Phone number',
    'individual.ssn_last_4': 'Last 4 digits of SSN',
    'individual.verification.document': 'ID verification document',
    'tos_acceptance.date': 'Terms of service acceptance',
    'tos_acceptance.ip': 'Terms of service IP address',
  }

  return requirements.map(req => descriptions[req] || req)
}

// =============================================
// WEBHOOK HELPERS
// =============================================

/**
 * Handle account.updated webhook event
 *
 * @param account - Stripe Account from webhook
 * @returns Account status summary
 */
export function handleAccountUpdatedEvent(account: Stripe.Account): {
  accountId: string
  status: ReturnType<typeof getAccountStatus>
  shouldNotify: boolean
  notificationMessage?: string
} {
  const status = getAccountStatus(account)
  let shouldNotify = false
  let notificationMessage: string | undefined

  // Notify if account becomes active
  if (status.status === 'active' && status.chargesEnabled && status.payoutsEnabled) {
    shouldNotify = true
    notificationMessage = 'Your Stripe account is now active and ready to accept payments!'
  }

  // Notify if account becomes restricted
  if (status.status === 'restricted' || status.status === 'disabled') {
    shouldNotify = true
    notificationMessage = 'Your Stripe account requires attention. Please complete the verification process.'
  }

  return {
    accountId: account.id,
    status,
    shouldNotify,
    notificationMessage,
  }
}

/**
 * Handle account.application.deauthorized event
 *
 * @param event - Stripe Event
 * @returns Account ID that was deauthorized
 */
export function handleAccountDeauthorizedEvent(
  event: Stripe.Event
): string | null {
  if (event.type === 'account.application.deauthorized') {
    const account = event.account
    return account || null
  }
  return null
}

// =============================================
// VALIDATION
// =============================================

/**
 * Validate that an account ID is properly formatted
 *
 * @param accountId - Potential Stripe account ID
 * @returns True if valid format
 */
export function isValidAccountId(accountId: string): boolean {
  return /^acct_[a-zA-Z0-9]{14,}$/.test(accountId)
}

/**
 * Validate account can process payments
 *
 * @param account - Stripe Account
 * @throws Error if account cannot process payments
 */
export function validateAccountCanProcessPayments(account: Stripe.Account): void {
  if (!account.charges_enabled) {
    throw new Error('This account cannot accept charges. Please complete account verification.')
  }

  if (account.requirements?.disabled_reason) {
    throw new Error(`Account is disabled: ${account.requirements.disabled_reason}`)
  }
}
