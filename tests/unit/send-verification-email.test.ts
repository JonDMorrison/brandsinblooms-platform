/**
 * Unit tests for the send verification email utility and validation logic
 */

describe('Email Utility Functions', () => {
  describe('sendVerificationEmail', () => {
    let originalFetch: typeof global.fetch

    beforeEach(() => {
      originalFetch = global.fetch
    })

    afterEach(() => {
      global.fetch = originalFetch
    })

    it('should call the API with correct parameters', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, messageId: 're_123' }),
      })
      global.fetch = mockFetch

      const { sendVerificationEmail } = await import('@/lib/email')
      const result = await sendVerificationEmail(
        'user@example.com',
        'https://example.com/verify?token=abc123'
      )

      expect(mockFetch).toHaveBeenCalledWith('/api/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'user@example.com',
          verificationUrl: 'https://example.com/verify?token=abc123',
        }),
      })
      expect(result.success).toBe(true)
      expect(result.messageId).toBe('re_123')
    })

    it('should return error when API returns non-ok response', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid email' }),
      })
      global.fetch = mockFetch

      const { sendVerificationEmail } = await import('@/lib/email')
      const result = await sendVerificationEmail('user@example.com', 'https://example.com/verify')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email')
    })

    it('should handle network errors gracefully', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'))
      global.fetch = mockFetch

      const { sendVerificationEmail } = await import('@/lib/email')
      const result = await sendVerificationEmail('user@example.com', 'https://example.com/verify')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('generateVerificationUrl', () => {
    it('should generate correct verification URL with token', async () => {
      const { generateVerificationUrl } = await import('@/lib/email')
      const url = generateVerificationUrl('abc123', 'https://example.com')

      expect(url).toBe('https://example.com/auth/verify-email?token=abc123')
    })

    it('should encode special characters in token', async () => {
      const { generateVerificationUrl } = await import('@/lib/email')
      const url = generateVerificationUrl('token with spaces & special=chars', 'https://example.com')

      expect(url).toContain('token%20with%20spaces%20%26%20special%3Dchars')
    })
  })
})

describe('Email Validation', () => {
  /**
   * Test the email validation regex used in the API route
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  it('should accept valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('user.name@example.com')).toBe(true)
    expect(isValidEmail('user+tag@example.co.uk')).toBe(true)
    expect(isValidEmail('user123@sub.example.org')).toBe(true)
  })

  it('should reject invalid email addresses', () => {
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('user@example')).toBe(false)
    expect(isValidEmail('user example@email.com')).toBe(false)
  })
})

describe('URL Validation', () => {
  /**
   * Test the URL validation logic used in the API route
   */
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  it('should accept valid URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('https://example.com/path')).toBe(true)
    expect(isValidUrl('https://example.com/verify?token=abc123')).toBe(true)
    expect(isValidUrl('http://localhost:3000/verify')).toBe(true)
  })

  it('should reject invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false)
    expect(isValidUrl('/relative/path')).toBe(false)
    expect(isValidUrl('example.com')).toBe(false)
  })
})

