import { supabase } from '@/src/lib/supabase/client'
import { Provider } from '@supabase/supabase-js'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { success: false, error: error.message, requiresMFA: false }
  }
  
  // Check if user has MFA enabled
  const { data: { user } } = await supabase.auth.getUser()
  const hasMFA = user?.factors?.some(factor => factor.status === 'verified')
  
  return { 
    success: true, 
    user: data.user,
    requiresMFA: hasMFA || false,
    factors: user?.factors || []
  }
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/verify-email`,
    },
  })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  // Check if email confirmation is required
  const needsEmailConfirmation = data.user && !data.user.confirmed_at
  
  return { 
    success: true, 
    user: data.user,
    needsEmailConfirmation
  }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signInWithOAuth(provider: Provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true, url: data.url }
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

export async function verifyEmail(token: string, email: string) {
  const { error } = await supabase.auth.verifyOtp({
    token,
    type: 'email',
    email,
  })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

export async function resendVerificationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/verify-email`,
    },
  })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

export async function checkEmailVerified() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { verified: false, user: null }
  }
  
  return {
    verified: !!user.email_confirmed_at,
    user,
  }
}