# Authentication Flows Guide

This guide covers the implementation of email verification and password reset flows in the Supabase Starter.

## Email Verification Flow

### Overview

Email verification ensures that users own the email addresses they sign up with. This is crucial for:
- Preventing spam accounts
- Ensuring password reset emails reach the right person
- Complying with data protection regulations

### Implementation

#### 1. Sign Up with Email Verification

```typescript
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'

function SignUpForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  async function handleSignUp(e: FormEvent) {
    e.preventDefault()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify-email`
      }
    })
    
    if (error) {
      setError(error.message)
      return
    }
    
    if (data.user && !data.user.confirmed_at) {
      // Show message to user
      setMessage('Please check your email to verify your account')
    } else {
      // User already verified (edge case)
      navigate('/dashboard')
    }
  }
}
```

#### 2. Resending Verification Email

```typescript
import { supabase } from '@/lib/supabase/client'

async function handleResend(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/verify-email`
    }
  })
  
  if (!error) {
    setMessage('Verification email sent! Please check your inbox.')
  } else {
    setError(error.message)
  }
}
```

#### 3. Checking Verification Status

```typescript
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

// In a protected component
function Dashboard() {
  const { user } = useAuth()
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false)
  
  useEffect(() => {
    if (user && !user.email_confirmed_at) {
      // Prompt user to verify email
      setShowVerificationPrompt(true)
    }
  }, [user])
  
  if (showVerificationPrompt) {
    return <EmailVerificationPrompt email={user?.email} />
  }
  
  // Rest of component...
}
```

### Email Verification in React Router

For a Vite + React app, handle email verification in your routes:

```typescript
// In App.tsx or routes file
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'

function EmailVerification() {
  const navigate = useNavigate()
  
  useEffect(() => {
    // Supabase will handle the email verification automatically
    // when the user clicks the link and lands on your app
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard')
      }
    })
  }, [navigate])
  
  return <div>Verifying your email...</div>
}
```

## Password Reset Flow

### Overview

The password reset flow allows users to securely reset forgotten passwords through email verification.

### Implementation

#### 1. Requesting Password Reset

```typescript
import { supabase } from '@/lib/supabase/client'
import { useState, FormEvent } from 'react'

function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    setLoading(false)
    
    if (!error) {
      setMessage('Password reset email sent! Check your inbox.')
    } else {
      setMessage(error.message || 'Failed to send reset email')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Reset Email'}
      </button>
      {message && <p>{message}</p>}
    </form>
  )
}
```

#### 2. Update Password Page

```typescript
import { supabase } from '@/lib/supabase/client'
import { useNavigate } from 'react-router-dom'
import { useState, FormEvent } from 'react'

function UpdatePasswordForm() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    const { error } = await supabase.auth.updateUser({
      password: password
    })
    setLoading(false)
    
    if (!error) {
      navigate('/login?message=Password%20updated%20successfully')
    } else {
      setError(error.message)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        minLength={6}
        required
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm password"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  )
}
```

### Password Reset Routes in React

Handle password reset in your React Router:

```typescript
// Add to your App.tsx routes
<Route path="/reset-password" element={<ResetPassword />} />
<Route path="/update-password" element={<UpdatePassword />} />

// ResetPassword component
function ResetPassword() {
  const navigate = useNavigate()
  
  useEffect(() => {
    // Supabase handles the token exchange automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) {
          // User can now update their password
          navigate('/update-password')
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [navigate])
  
  return <div>Processing password reset...</div>
}
```

## Security Best Practices

### 1. Token Expiration

Configure appropriate expiration times in Supabase Dashboard:
- Email verification: 24 hours
- Password reset: 1 hour

### 2. Rate Limiting

Implement rate limiting for sensitive operations:

```typescript
// Example rate limiter
const rateLimiter = new Map<string, number[]>()

function checkRateLimit(email: string, limit = 3, window = 3600000) {
  const now = Date.now()
  const attempts = rateLimiter.get(email) || []
  
  // Remove old attempts
  const recentAttempts = attempts.filter(time => now - time < window)
  
  if (recentAttempts.length >= limit) {
    throw new Error('Too many attempts. Please try again later.')
  }
  
  recentAttempts.push(now)
  rateLimiter.set(email, recentAttempts)
}
```

### 3. Secure Password Requirements

Enforce strong passwords:

```typescript
function validatePassword(password: string): string[] {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number')
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain a special character')
  }
  
  return errors
}
```

## User Experience Considerations

### 1. Clear Messaging

Always provide clear feedback:

```typescript
const messages = {
  emailSent: 'Check your email for a verification link',
  emailVerified: 'Email verified successfully!',
  passwordReset: 'Password reset email sent',
  passwordUpdated: 'Your password has been updated',
  tokenExpired: 'This link has expired. Please request a new one.',
}
```

### 2. Graceful Error Handling

Handle common errors gracefully:

```typescript
function getErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'User already registered': 'An account with this email already exists',
    'Invalid login credentials': 'Email or password is incorrect',
    'Email not confirmed': 'Please verify your email before logging in',
    'Token has expired': 'This link has expired. Please request a new one',
  }
  
  return errorMap[error] || 'An unexpected error occurred'
}
```

### 3. Loading States

Show loading states during async operations:

```typescript
function AuthButton({ loading, children }: { loading: boolean, children: React.ReactNode }) {
  return (
    <button disabled={loading}>
      {loading ? <Spinner /> : children}
    </button>
  )
}
```

## Testing

### Manual Testing Checklist

- [ ] Sign up with new email
- [ ] Verify email link works
- [ ] Resend verification email
- [ ] Request password reset
- [ ] Reset password with valid link
- [ ] Try expired links
- [ ] Test with invalid tokens
- [ ] Verify rate limiting works

### Automated Testing

See the test files:
- `/tests/unit/auth-flows.test.ts` - Unit tests
- `/tests/integration/auth-flow.test.ts` - Integration tests

## Troubleshooting

### Common Issues

1. **Emails not being sent**
   - Check Supabase email settings
   - Verify SMTP configuration
   - Check spam folders

2. **Links not working**
   - Ensure your redirect URLs use `window.location.origin`
   - Check redirect URL configuration in Supabase Dashboard
   - Make sure your app URL is added to allowed redirect URLs in Supabase

3. **Tokens expiring too quickly**
   - Adjust token expiration in Supabase Dashboard
   - Consider user timezone differences

### Debug Mode

Enable debug logging:

```typescript
const DEBUG = import.meta.env.DEV

function debugLog(action: string, data: any) {
  if (DEBUG) {
    console.log(`[Auth Flow] ${action}:`, data)
  }
}