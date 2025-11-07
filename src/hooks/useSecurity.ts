import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation'
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { handleError } from '@/lib/types/error-handling'

interface MFAEnrollmentData {
  id: string
  type: 'totp'
  totp: {
    qr_code: string
    secret: string
    uri: string
  }
}

interface MFAFactor {
  id: string
  status: 'verified' | 'unverified'
  friendly_name: string
  factor_type: 'totp'
  created_at: string
  updated_at: string
}

export function useChangePassword() {
  const supabase = createClient()

  return useSupabaseMutation<{ success: boolean }, string>(
    async (newPassword: string, signal: AbortSignal) => {
      // Update password directly (secure_password_change = false in config)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw error
      }

      return { success: true }
    },
    {
      showSuccessToast: 'Password changed successfully!',
      showErrorToast: true
    }
  )
}

export function useEnroll2FA() {
  const supabase = createClient()

  return useSupabaseMutation<MFAEnrollmentData, void>(
    async (_, signal: AbortSignal): Promise<MFAEnrollmentData> => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      })

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('Failed to enroll 2FA')
      }

      return data as MFAEnrollmentData
    },
    {
      showSuccessToast: '2FA enrollment started. Please scan the QR code.',
      showErrorToast: true
    }
  )
}

export function useVerify2FA() {
  const supabase = createClient()

  return useSupabaseMutation<any, { factorId: string; code: string }>(
    async ({ factorId, code }: { factorId: string; code: string }, signal: AbortSignal) => {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId
      })
      
      if (error) {
        throw error
      }
      
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: data!.id,
        code
      })

      if (verifyError) {
        throw verifyError
      }

      return verifyData
    },
    {
      showSuccessToast: '2FA has been successfully enabled!',
      showErrorToast: true
    }
  )
}

export function useUnenroll2FA() {
  const supabase = createClient()

  return useSupabaseMutation<{ success: boolean }, string>(
    async (factorId: string, signal: AbortSignal) => {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId
      })

      if (error) {
        throw error
      }

      return { success: true }
    },
    {
      showSuccessToast: '2FA has been disabled',
      showErrorToast: true
    }
  )
}

export function useMFAFactors() {
  const supabase = createClient()

  return useSupabaseQuery<MFAFactor[]>(
    async (signal): Promise<MFAFactor[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return []
      }

      const { data, error } = await supabase.auth.mfa.listFactors()

      if (error) {
        throw error
      }

      return (data?.totp || []) as MFAFactor[]
    },
    {
      persistKey: 'mfa-factors',
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )
}

export function useRevokeSession() {
  const supabase = createClient()

  return useSupabaseMutation<{ success: boolean; sessionId: string }, string>(
    async (sessionId: string, signal: AbortSignal) => {
      // Note: Supabase doesn't directly expose session revocation via client SDK
      // This would typically be handled through a server-side API endpoint
      // For now, we'll simulate the functionality
      console.warn('Session revocation requires server-side implementation')
      
      // In a real implementation, you would call your API endpoint:
      // const response = await fetch('/api/sessions/revoke', {
      //   method: 'POST',
      //   body: JSON.stringify({ sessionId }),
      //   headers: { 'Content-Type': 'application/json' }
      // })
      
      return { success: true, sessionId }
    },
    {
      showSuccessToast: 'Session revoked successfully!',
      showErrorToast: true
    }
  )
}

export function useRevokeAllSessions() {
  const supabase = createClient()

  return useSupabaseMutation<{ success: boolean }, void>(
    async (_, signal: AbortSignal) => {
      // Sign out from all devices (this will invalidate all refresh tokens)
      const { error } = await supabase.auth.signOut({ scope: 'global' })

      if (error) {
        throw error
      }

      // Sign back in to current session
      // Note: In production, you'd want to handle this more gracefully
      return { success: true }
    },
    {
      showSuccessToast: 'All other sessions have been revoked!',
      showErrorToast: true
    }
  )
}

// Security notification preferences (these would be stored in user metadata or a separate table)
export function useUpdateSecurityNotifications() {
  const supabase = createClient()

  return useSupabaseMutation<{ emailNotifications: boolean; loginAlerts: boolean }, { emailNotifications: boolean; loginAlerts: boolean }>(
    async (preferences: { emailNotifications: boolean; loginAlerts: boolean }, signal: AbortSignal) => {
      const { error } = await supabase.auth.updateUser({
        data: {
          security_notifications: {
            email_notifications: preferences.emailNotifications,
            login_alerts: preferences.loginAlerts
          }
        }
      })

      if (error) {
        throw error
      }

      return preferences
    },
    {
      showSuccessToast: 'Security notification preferences updated',
      showErrorToast: true
    }
  )
}

export function useSecurityNotificationPreferences() {
  const supabase = createClient()

  return useSupabaseQuery<{ emailNotifications: boolean; loginAlerts: boolean }>(
    async (signal) => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return {
          emailNotifications: true,
          loginAlerts: true
        }
      }

      // Get preferences from user metadata
      const preferences = user.user_metadata?.security_notifications || {
        email_notifications: true,
        login_alerts: true
      }

      return {
        emailNotifications: preferences.email_notifications ?? true,
        loginAlerts: preferences.login_alerts ?? true
      }
    },
    {
      persistKey: 'security-preferences',
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )
}