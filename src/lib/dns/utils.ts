/**
 * DNS Utilities for domain verification and provider detection
 */

import { promises as dns } from 'dns'
import crypto from 'crypto'
import {
  DNS_PROVIDERS,
  DnsRecords,
  DomainVerificationResult,
  PROXY_DOMAIN,
  VERIFICATION_PREFIX,
  DEFAULT_TTL
} from './types'

/**
 * Generate a unique verification token for a domain
 */
export function generateVerificationToken(siteId: string, domain: string): string {
  const hash = crypto.createHash('sha256')
  hash.update(`${siteId}-${domain}-${Date.now()}`)
  return `verify-${hash.digest('hex').substring(0, 16)}`
}

/**
 * Generate DNS records for domain configuration
 */
export function generateDnsRecords(domain: string, verificationToken: string): DnsRecords {
  return {
    cname: {
      type: 'CNAME',
      name: '@', // Root domain
      value: PROXY_DOMAIN,
      ttl: DEFAULT_TTL
    },
    txt: {
      type: 'TXT',
      name: VERIFICATION_PREFIX,
      value: verificationToken,
      ttl: DEFAULT_TTL
    }
  }
}

/**
 * Detect DNS provider from nameservers
 */
export async function detectDnsProvider(domain: string): Promise<string | null> {
  try {
    // Get the NS records for the domain
    const nameservers = await dns.resolveNs(domain)

    // Check each provider's patterns
    for (const [providerId, provider] of Object.entries(DNS_PROVIDERS)) {
      for (const ns of nameservers) {
        const nsLower = ns.toLowerCase()
        if (provider.nameservers.some(pattern => nsLower.includes(pattern))) {
          return providerId
        }
      }
    }

    return null // Provider not recognized
  } catch (error) {
    console.error('Error detecting DNS provider:', error)
    return null
  }
}

/**
 * Verify DNS records for a custom domain
 */
export async function verifyDnsRecords(
  domain: string,
  expectedToken: string
): Promise<DomainVerificationResult> {
  const errors: string[] = []
  const details: DomainVerificationResult['details'] = {}

  let cnameValid = false
  let txtValid = false

  // Check CNAME record
  try {
    const cnameRecords = await dns.resolveCname(domain)
    details.actualCname = cnameRecords[0] || 'Not found'
    details.expectedCname = PROXY_DOMAIN

    cnameValid = cnameRecords.some(record =>
      record.toLowerCase() === PROXY_DOMAIN.toLowerCase()
    )

    if (!cnameValid) {
      errors.push(`CNAME record not pointing to ${PROXY_DOMAIN}. Found: ${details.actualCname}`)
    }
  } catch (error) {
    details.actualCname = 'Not found'
    details.expectedCname = PROXY_DOMAIN
    errors.push(`CNAME record not found for ${domain}`)
  }

  // Check TXT record for verification
  try {
    const txtDomain = `${VERIFICATION_PREFIX}.${domain}`
    const txtRecords = await dns.resolveTxt(txtDomain)

    // TXT records are returned as arrays of strings
    const flatTxtRecords = txtRecords.flat()
    details.actualTxt = flatTxtRecords[0] || 'Not found'
    details.expectedTxt = expectedToken

    txtValid = flatTxtRecords.some(record => record === expectedToken)

    if (!txtValid) {
      errors.push(`TXT verification record not found or incorrect. Expected: ${expectedToken}`)
    }
  } catch (error) {
    details.actualTxt = 'Not found'
    details.expectedTxt = expectedToken
    errors.push(`TXT verification record not found at ${VERIFICATION_PREFIX}.${domain}`)
  }

  return {
    verified: cnameValid && txtValid,
    cnameValid,
    txtValid,
    errors,
    details
  }
}

/**
 * Check if enough time has passed since last DNS check (rate limiting)
 */
export function canCheckDns(lastCheckAt: Date | null, rateLimitSeconds: number = 60): {
  allowed: boolean
  secondsRemaining?: number
} {
  if (!lastCheckAt) {
    return { allowed: true }
  }

  const now = new Date()
  const timeSinceLastCheck = (now.getTime() - lastCheckAt.getTime()) / 1000

  if (timeSinceLastCheck >= rateLimitSeconds) {
    return { allowed: true }
  }

  return {
    allowed: false,
    secondsRemaining: Math.ceil(rateLimitSeconds - timeSinceLastCheck)
  }
}

/**
 * Placeholder for Cloudflare integration
 * TODO: Implement actual Cloudflare API integration
 */
export async function registerWithCloudflare(domain: string): Promise<{
  success: boolean
  error?: string
}> {
  // TODO: Implement actual Cloudflare API integration
  // This would:
  // 1. Add domain to Cloudflare account
  // 2. Configure SSL certificate
  // 3. Set up proxy rules
  // 4. Return success/error status

  console.log(`[MOCK] Registering domain with Cloudflare: ${domain}`)

  // Mock successful registration
  return {
    success: true
  }
}

/**
 * Placeholder for Cloudflare domain removal
 * TODO: Implement actual Cloudflare API integration
 */
export async function removeFromCloudflare(domain: string): Promise<{
  success: boolean
  error?: string
}> {
  // TODO: Implement actual Cloudflare API integration
  // This would:
  // 1. Remove domain from Cloudflare account
  // 2. Clean up SSL certificates
  // 3. Remove proxy rules
  // 4. Return success/error status

  console.log(`[MOCK] Removing domain from Cloudflare: ${domain}`)

  // Mock successful removal
  return {
    success: true
  }
}