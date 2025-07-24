import { supabase } from '@/lib/supabase/client'
import { AuthMFAEnrollResponse, AuthMFAVerifyResponse } from '@supabase/supabase-js'

export interface MFAEnrollmentResult {
  success: boolean
  qrCode?: string
  secret?: string
  factorId?: string
  error?: string
}

export interface MFAVerificationResult {
  success: boolean
  error?: string
}

export async function enrollMFA(): Promise<MFAEnrollmentResult> {
  try {
    // First, check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }
    
    // Enroll in TOTP MFA
    const { data, error }: AuthMFAEnrollResponse = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `${user.email} - Authenticator App`,
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    if (!data || data.type !== 'totp') {
      return { success: false, error: 'Failed to generate MFA enrollment data' }
    }
    
    return {
      success: true,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id,
    }
  } catch (err) {
    console.error('MFA enrollment error:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    }
  }
}

export async function verifyMFAEnrollment(
  factorId: string,
  code: string
): Promise<MFAVerificationResult> {
  try {
    // First get a challenge
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    })
    
    if (challengeError || !challengeData) {
      return { success: false, error: challengeError?.message || 'Failed to create challenge' }
    }
    
    const { error }: AuthMFAVerifyResponse = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    console.error('MFA verification error:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    }
  }
}

export async function challengeMFA(factorId: string) {
  const { data, error } = await supabase.auth.mfa.challenge({
    factorId,
  })
  
  if (error) {
    return { success: false, error: error.message, challengeId: null }
  }
  
  return { success: true, challengeId: data.id, error: null }
}

export async function verifyMFAChallenge(
  factorId: string,
  challengeId: string,
  code: string
): Promise<MFAVerificationResult> {
  try {
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    console.error('MFA challenge verification error:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    }
  }
}

export async function unenrollMFA(factorId: string): Promise<MFAVerificationResult> {
  try {
    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    console.error('MFA unenrollment error:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    }
  }
}

export async function listMFAFactors() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, factors: [], error: 'User not authenticated' }
    }
    
    // Get user's MFA factors
    const factors = user.factors || []
    
    return {
      success: true,
      factors: factors.map(factor => ({
        id: factor.id,
        status: factor.status,
        friendlyName: factor.friendly_name,
        createdAt: factor.created_at,
      })),
      error: null,
    }
  } catch (err) {
    console.error('List MFA factors error:', err)
    return { 
      success: false, 
      factors: [],
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    }
  }
}

export async function getAssuranceLevel() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return { level: 'none', authenticated: false }
  }
  
  // Check the AAL (Authenticator Assurance Level)
  const aal = (session as any).aal || 'aal1'
  
  return {
    level: aal,
    authenticated: true,
    mfaVerified: aal === 'aal2',
  }
}