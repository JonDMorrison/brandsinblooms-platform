'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form'
import { resetPassword, updatePassword } from '@/src/lib/auth/client'

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const newPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ResetPasswordData = z.infer<typeof resetPasswordSchema>
type NewPasswordData = z.infer<typeof newPasswordSchema>

export default function ResetPasswordClient() {
  const [isResetMode, setIsResetMode] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Generate unique IDs at the top level
  const newPasswordId = React.useId()
  const confirmPasswordId = React.useId()
  const emailId = React.useId()
  
  // Check if we have a token in the URL (user clicked email link)
  const hasToken = searchParams.has('code')

  const resetForm = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const newPasswordForm = useForm<NewPasswordData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onResetSubmit = async (data: ResetPasswordData) => {
    try {
      await resetPassword(data.email)
      toast.success('Password reset email sent! Check your inbox.')
      setIsResetMode(true)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email')
    }
  }

  const onNewPasswordSubmit = async (data: NewPasswordData) => {
    try {
      await updatePassword(data.password)
      toast.success('Password updated successfully!')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password')
    }
  }

  // If user has a token, show the new password form
  if (hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-primary">
              <KeyRound className="h-full w-full" />
            </div>
            <CardTitle className="text-2xl">Set new password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...newPasswordForm}>
              <form onSubmit={newPasswordForm.handleSubmit(onNewPasswordSubmit)} className="space-y-4">
                <FormField
                  control={newPasswordForm.control}
                  name="password"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel htmlFor={newPasswordId}>New Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            id={newPasswordId}
                            type="password"
                            placeholder="Enter new password"
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
                <FormField
                  control={newPasswordForm.control}
                  name="confirmPassword"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel htmlFor={confirmPasswordId}>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            id={confirmPasswordId}
                            type="password"
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={newPasswordForm.formState.isSubmitting}
                >
                  {newPasswordForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Otherwise show the reset request form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-primary">
            <KeyRound className="h-full w-full" />
          </div>
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>
            {isResetMode 
              ? "We&apos;ve sent you a password reset link" 
              : "Enter your email to receive a reset link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isResetMode ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-500">
                Check your email for a link to reset your password. 
                If it doesn&apos;t appear within a few minutes, check your spam folder.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsResetMode(false)}
              >
                Send another email
              </Button>
              <Link 
                href="/login" 
                className="block text-sm text-gray-500 hover:text-primary transition-colors"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="email"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel htmlFor={emailId}>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            id={emailId}
                            type="email"
                            placeholder="Enter your email"
                            autoComplete="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={resetForm.formState.isSubmitting}
                >
                  {resetForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending reset email...
                    </>
                  ) : (
                    'Send Reset Email'
                  )}
                </Button>
                <div className="text-center">
                  <Link 
                    href="/login" 
                    className="text-sm text-gray-500 hover:text-primary transition-colors"
                  >
                    Back to login
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}