/**
 * Email utility functions
 *
 * Provides functions for sending emails using the Resend-based API
 */

/**
 * Send verification email response type
 */
export interface SendVerificationEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send a verification email to a user
 *
 * @param to - The recipient email address
 * @param verificationUrl - The URL the user should click to verify their email
 * @returns Promise with the result of the email send operation
 */
export async function sendVerificationEmail(
  to: string,
  verificationUrl: string
): Promise<SendVerificationEmailResult> {
  try {
    const response = await fetch('/api/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        verificationUrl,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to send verification email',
      }
    }

    return {
      success: true,
      messageId: data.messageId,
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred'
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Generate a verification URL for a given token
 *
 * @param token - The verification token
 * @param baseUrl - The base URL of the application (optional, defaults to window.location.origin)
 * @returns The full verification URL
 */
export function generateVerificationUrl(
  token: string,
  baseUrl?: string
): string {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${origin}/auth/verify-email?token=${encodeURIComponent(token)}`
}
