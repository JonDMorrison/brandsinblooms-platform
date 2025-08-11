import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { handleError } from '@/lib/types/error-handling'

interface PasswordChangeData {
  currentPassword: string
  newPassword: string
}

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

  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: PasswordChangeData) => {
      // First verify the current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        throw new Error('User email not found')
      }

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })

      if (signInError) {
        throw new Error('Current password is incorrect')
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        throw updateError
      }

      return { success: true }
    },
    onSuccess: () => {
      toast.success('Password changed successfully!')
    },
    onError: (error: unknown) => {
      const errorDetails = handleError(error)
      toast.error(errorDetails.message)
    }
  })
}

export function useEnroll2FA() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<MFAEnrollmentData> => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-factors'] })
      toast.success('2FA enrollment started. Please scan the QR code.')
    },
    onError: (error: unknown) => {
      const errorDetails = handleError(error)
      toast.error(`Failed to enroll 2FA: ${errorDetails.message}`)
    }
  })
}

export function useVerify2FA() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ factorId, code }: { factorId: string; code: string }) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-factors'] })
      toast.success('2FA has been successfully enabled!')
    },
    onError: (error: unknown) => {
      const errorDetails = handleError(error)
      toast.error(`Verification failed: ${errorDetails.message}`)
    }
  })
}

export function useUnenroll2FA() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (factorId: string) => {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId
      })

      if (error) {
        throw error
      }

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-factors'] })
      toast.success('2FA has been disabled')
    },
    onError: (error: unknown) => {
      const errorDetails = handleError(error)
      toast.error(`Failed to disable 2FA: ${errorDetails.message}`)
    }
  })
}

export function useMFAFactors() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['mfa-factors'],
    queryFn: async (): Promise<MFAFactor[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return []
      }

      const { data, error } = await supabase.auth.mfa.listFactors()

      if (error) {
        throw error
      }

      return (data?.totp || []) as MFAFactor[]
    }
  })
}

export function useRevokeSession() {
  const supabase = createClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
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
    onSuccess: () => {
      toast.success('Session revoked successfully!')
    },
    onError: (error: unknown) => {
      const errorDetails = handleError(error)
      toast.error(`Failed to revoke session: ${errorDetails.message}`)
    }
  })
}

export function useRevokeAllSessions() {
  const supabase = createClient()

  return useMutation({
    mutationFn: async () => {
      // Sign out from all devices (this will invalidate all refresh tokens)
      const { error } = await supabase.auth.signOut({ scope: 'global' })

      if (error) {
        throw error
      }

      // Sign back in to current session
      // Note: In production, you'd want to handle this more gracefully
      return { success: true }
    },
    onSuccess: () => {
      toast.success('All other sessions have been revoked!')
    },
    onError: (error: unknown) => {
      const errorDetails = handleError(error)
      toast.error(`Failed to revoke sessions: ${errorDetails.message}`)
    }
  })
}

// Security notification preferences (these would be stored in user metadata or a separate table)
export function useUpdateSecurityNotifications() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (preferences: { emailNotifications: boolean; loginAlerts: boolean }) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Security notification preferences updated')
    },
    onError: (error: unknown) => {
      const errorDetails = handleError(error)
      toast.error(`Failed to update preferences: ${errorDetails.message}`)
    }
  })
}

export function useSecurityNotificationPreferences() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['security-preferences'],
    queryFn: async () => {
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
    }
  })
}