/**
 * Detect DNS provider for a domain
 * Queries NS records and matches against known provider patterns
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '@/lib/types/error-handling'
import { detectDnsProvider } from '@/src/lib/dns/utils'
import { DNS_PROVIDERS } from '@/src/lib/dns/types'
import { isValidCustomDomain } from '@/src/lib/site/resolution'

interface DetectProviderRequest {
  domain: string
}

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json() as DetectProviderRequest
    const { domain } = body

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    // Clean domain
    const cleanDomain = domain.trim().toLowerCase()
      .replace(/^https?:\/\//, '') // Remove protocol
      .replace(/^www\./, '') // Remove www
      .replace(/\/$/, '') // Remove trailing slash

    // Validate domain format
    if (!isValidCustomDomain(cleanDomain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      )
    }

    // Detect DNS provider
    const providerId = await detectDnsProvider(cleanDomain)

    // Get provider details if found
    const provider = providerId ? DNS_PROVIDERS[providerId] : null

    return NextResponse.json({
      success: true,
      data: {
        domain: cleanDomain,
        provider: provider ? {
          id: provider.id,
          name: provider.name,
          documentationUrl: provider.documentationUrl
        } : null,
        detected: !!provider
      }
    })
  } catch (error: unknown) {
    const errorInfo = handleError(error)

    // Check for specific DNS errors
    if (errorInfo.message.includes('ENOTFOUND') || errorInfo.message.includes('ENODATA')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Domain not found or has no nameservers',
          data: {
            domain: null,
            provider: null,
            detected: false
          }
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to detect DNS provider',
        details: errorInfo.message
      },
      { status: 500 }
    )
  }
}