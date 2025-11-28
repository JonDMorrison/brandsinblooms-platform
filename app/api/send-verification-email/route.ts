/**
 * Send Verification Email API Route
 *
 * Sends account verification emails using Resend
 * POST /api/send-verification-email
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Request body schema
interface SendVerificationEmailRequest {
  to: string
  verificationUrl: string
}

// Response types
interface SendVerificationEmailSuccess {
  success: true
  messageId: string
}

interface SendVerificationEmailError {
  success: false
  error: string
}

type SendVerificationEmailResponse = SendVerificationEmailSuccess | SendVerificationEmailError

/**
 * Validates an email address format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates a URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SendVerificationEmailResponse>> {
  try {
    // Get and validate API key
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('[send-verification-email] RESEND_API_KEY is not configured')
      return NextResponse.json(
        { success: false, error: 'Email service is not configured' },
        { status: 500 }
      )
    }

    // Parse request body
    const body: unknown = await request.json()

    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { to, verificationUrl } = body as SendVerificationEmailRequest

    // Validate required fields
    if (!to || typeof to !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "to" email address' },
        { status: 400 }
      )
    }

    if (!verificationUrl || typeof verificationUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "verificationUrl"' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(to)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    // Validate URL format
    if (!isValidUrl(verificationUrl)) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification URL format' },
        { status: 400 }
      )
    }

    // Get sender email from environment variable or use default
    const fromEmail = process.env.NEXT_PUBLIC_EMAIL_FROM || 'support@agsites.ca'
    const senderName = process.env.SMTP_SENDER_NAME || 'Brands & Blooms'

    // Initialize Resend client
    const resend = new Resend(apiKey)

    // Send verification email
    const { data, error } = await resend.emails.send({
      from: `${senderName} <${fromEmail}>`,
      to: [to],
      subject: 'Verify your email address',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px;">
                      <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1a1a1a; text-align: center;">
                        Verify Your Email Address
                      </h1>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                        Thank you for signing up! Please verify your email address by clicking the button below.
                      </p>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="text-align: center; padding: 24px 0;">
                            <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                              Verify Email Address
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #6b6b6b;">
                        If you didn't create an account, you can safely ignore this email.
                      </p>
                      <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b6b6b;">
                        This link will expire in 24 hours.
                      </p>
                      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9b9b9b; text-align: center;">
                        If the button above doesn't work, copy and paste this link into your browser:
                        <br>
                        <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Verify Your Email Address

Thank you for signing up! Please verify your email address by clicking the link below:

${verificationUrl}

If you didn't create an account, you can safely ignore this email.

This link will expire in 24 hours.`,
    })

    if (error) {
      console.error('[send-verification-email] Resend API error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!data?.id) {
      console.error('[send-verification-email] No message ID returned from Resend')
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      )
    }

    console.log('[send-verification-email] Email sent successfully:', data.id)
    return NextResponse.json({
      success: true,
      messageId: data.id,
    })
  } catch (error: unknown) {
    console.error('[send-verification-email] Unexpected error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
