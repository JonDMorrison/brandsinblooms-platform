# Multi-Factor Authentication (MFA) Setup Guide

This guide explains how to implement and use Multi-Factor Authentication (MFA) in your Supabase application using Time-based One-Time Passwords (TOTP).

## Overview

MFA adds an extra layer of security by requiring users to provide two forms of identification:
1. Something they know (password)
2. Something they have (authenticator app on their phone)

## Prerequisites

- Supabase project with authentication enabled
- An authenticator app (Google Authenticator, Authy, 1Password, etc.)

## Implementation Flow

### 1. User Enrollment Flow

```typescript
// Example enrollment component
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'

function MFAEnrollment() {
  const navigate = useNavigate()
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [factorId, setFactorId] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleEnroll = async () => {
    setLoading(true)
    setError('')
    
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App'
    })
    
    setLoading(false)
    
    if (error) {
      setError(error.message)
      return
    }
    
    if (data && data.type === 'totp') {
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setFactorId(data.id)
    }
  }
  
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // First create a challenge
    const { data: challengeData, error: challengeError } = 
      await supabase.auth.mfa.challenge({ factorId })
    
    if (challengeError) {
      setError(challengeError.message)
      setLoading(false)
      return
    }
    
    // Then verify with the code
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code
    })
    
    setLoading(false)
    
    if (verifyError) {
      setError(verifyError.message)
    } else {
      // MFA enrolled successfully
      navigate('/dashboard')
    }
  }
  
  return (
    <div>
      {!qrCode ? (
        <button onClick={handleEnroll} disabled={loading}>
          {loading ? 'Setting up...' : 'Setup MFA'}
        </button>
      ) : (
        <form onSubmit={handleVerify}>
          <img src={qrCode} alt="MFA QR Code" />
          <p>Secret: {secret}</p>
          <input 
            type="text" 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            pattern="[0-9]{6}"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </div>
  )
}
```

### 2. Login with MFA Flow

```typescript
// Example login with MFA
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'

function LoginForm() {
  const navigate = useNavigate()
  const [showMFAInput, setShowMFAInput] = useState(false)
  const [challengeId, setChallengeId] = useState('')
  const [factorId, setFactorId] = useState('')
  
  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      setError(error.message)
      return
    }
    
    // Check if user has MFA enabled
    const { data: { user } } = await supabase.auth.getUser()
    const verifiedFactors = user?.factors?.filter(f => f.status === 'verified')
    
    if (verifiedFactors && verifiedFactors.length > 0) {
      // User has MFA enabled, need to verify
      const factor = verifiedFactors[0]
      setFactorId(factor.id)
      
      // Create MFA challenge
      const { data: challenge, error: challengeError } = 
        await supabase.auth.mfa.challenge({ factorId: factor.id })
      
      if (challengeError) {
        setError(challengeError.message)
        return
      }
      
      // Show MFA code input
      setShowMFAInput(true)
      setChallengeId(challenge.id)
    } else {
      // No MFA, proceed to dashboard
      navigate('/dashboard')
    }
  }
  
  const handleMFAVerify = async (code: string) => {
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code
    })
    
    if (error) {
      setError(error.message)
    } else {
      // MFA verified, user is fully authenticated
      navigate('/dashboard')
    }
  }
  
  return (
    <div>
      {/* Login form UI */}
      {showMFAInput && (
        <input
          type="text"
          placeholder="Enter MFA code"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.length === 6) {
              handleMFAVerify(e.currentTarget.value)
            }
          }}
        />
      )}
    </div>
  )
}
```

### 3. Protecting Sensitive Operations

```typescript
// Protect sensitive operations with MFA in React
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'

function SensitiveSettingsPage() {
  const navigate = useNavigate()
  const [isAAL2, setIsAAL2] = useState(false)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    checkMFAStatus()
  }, [])
  
  const checkMFAStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    // Check if user has AAL2 (MFA verified in this session)
    const aal = (session as any)?.aal || 'aal1'
    
    if (aal !== 'aal2') {
      // Redirect to MFA verification
      navigate('/verify-mfa?redirect=/sensitive-settings')
    } else {
      setIsAAL2(true)
    }
    
    setLoading(false)
  }
  
  if (loading) return <div>Checking MFA status...</div>
  if (!isAAL2) return null
  
  return (
    <div>
      <h1>Sensitive Settings</h1>
      {/* Only accessible after MFA verification */}
    </div>
  )
}
```

## Assurance Levels

Supabase uses Authenticator Assurance Levels (AAL):

- **AAL1**: User authenticated with single factor (password)
- **AAL2**: User authenticated with multiple factors (password + MFA)

Check the current level:

```typescript
import { supabase } from '@/lib/supabase/client'

async function checkAssuranceLevel() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return { level: 'none', authenticated: false }
  }
  
  // Check the AAL (Authenticator Assurance Level)
  const aal = (session as any).aal || 'aal1'
  
  return {
    level: aal,
    authenticated: true,
    mfaVerified: aal === 'aal2'
  }
}

// Usage
const { level, mfaVerified } = await checkAssuranceLevel()

if (level === 'aal2') {
  // User has verified MFA in this session
}
```

## Best Practices

### 1. Recovery Codes
Always provide recovery codes when users enable MFA:

```typescript
// Generate recovery codes after MFA enrollment
function generateRecoveryCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase())
  }
  return codes
}
```

### 2. Grace Period
Allow users a grace period to set up MFA:

```typescript
// Check if user should be prompted for MFA setup
const shouldPromptMFA = (user: User) => {
  const accountAge = Date.now() - new Date(user.created_at).getTime()
  const gracePeriod = 7 * 24 * 60 * 60 * 1000 // 7 days
  
  return accountAge > gracePeriod && !user.factors?.length
}
```

### 3. Session Management
Handle MFA requirements for different session types:

```typescript
// React Router guard to check MFA requirements
export function MFARoute({ children, requiredPaths }: { children: React.ReactNode, requiredPaths: string[] }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mfaVerified, setMfaVerified] = useState(false)
  
  useEffect(() => {
    const checkMFA = async () => {
      const { mfaVerified } = await getAssuranceLevel()
      setMfaVerified(mfaVerified)
      
      if (!mfaVerified && requiredPaths.some(p => location.pathname.startsWith(p))) {
        navigate('/mfa-verify')
      }
    }
    
    checkMFA()
  }, [location, navigate, requiredPaths])
  
  return mfaVerified ? <>{children}</> : null
}
```

## Troubleshooting

### Common Issues

1. **Time Sync Issues**
   - TOTP relies on synchronized time
   - Ensure user's device time is correct
   - Consider allowing a time window (±30 seconds)

2. **Lost Authenticator Device**
   - Implement recovery codes
   - Provide alternative verification methods
   - Have a support process for MFA reset

3. **QR Code Not Scanning**
   - Provide the secret key as text
   - Allow manual entry in authenticator apps

### Testing MFA

For development/testing, you can use these tools:
- [otp-generator](https://www.npmjs.com/package/otp-generator) for generating test codes
- Browser extensions that generate TOTP codes

## Security Considerations

1. **Always use HTTPS** to prevent MITM attacks
2. **Rate limit** MFA verification attempts
3. **Log MFA events** for security auditing
4. **Implement account recovery** procedures
5. **Consider SMS backup** for account recovery (with awareness of SMS vulnerabilities)

## Next Steps

1. Implement recovery codes storage
2. Add user-friendly MFA management UI
3. Set up monitoring for failed MFA attempts
4. Consider implementing WebAuthn for passwordless MFA