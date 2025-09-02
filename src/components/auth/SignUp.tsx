'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Eye, EyeOff, Check } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/AuthContext'
import { signUpSchema, type SignUpData } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { signInWithProvider, handleAuthError } from '@/lib/auth/client'
import { AuthError } from '@supabase/supabase-js'

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoadingProvider, setIsLoadingProvider] = useState<string | null>(null)
  const { signUp } = useAuth()
  const router = useRouter()

  // Generate unique IDs at the top level
  const emailId = React.useId()
  const passwordId = React.useId()
  const confirmPasswordId = React.useId()
  const acceptTermsId = React.useId()

  const form = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  })

  const onSubmit = async (data: SignUpData) => {
    try {
      await signUp(data.email, data.password)
      toast.success('Account created! Please check your email to verify your account.')
      router.push('/auth/verify-email')
    } catch (error) {
      const message = handleAuthError(error as AuthError)
      toast.error(message)
    }
  }

  const handleProviderSignIn = async (provider: 'google' | 'github') => {
    try {
      setIsLoadingProvider(provider)
      await signInWithProvider(provider)
    } catch (error) {
      toast.error(`Failed to sign up with ${provider}. Please try again.`)
    } finally {
      setIsLoadingProvider(null)
    }
  }

  // Password strength indicator
  const password = form.watch('password')
  const passwordStrength = {
    hasLength: password?.length >= 8,
    hasUpperCase: /[A-Z]/.test(password || ''),
    hasLowerCase: /[a-z]/.test(password || ''),
    hasNumber: /\d/.test(password || ''),
    hasSpecial: /[!@#$%^&*]/.test(password || ''),
  }

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length
  const strengthColor = strengthScore < 2 ? 'text-red-500' : strengthScore < 4 ? 'text-yellow-500' : 'text-green-500'

  return (
    <div className="w-full p-6">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-brand-heading text-primary">
            Create an Account
          </h2>
          <p className="text-muted-foreground">
            Join Brands in Blooms to start creating beautiful websites
          </p>
        </div>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                          className="fade-in-up"
                          style={{ animationDelay: '0.1s' }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor={passwordId}>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            id={passwordId}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a password"
                            autoComplete="new-password"
                            className="pr-10 fade-in-up"
                            style={{ animationDelay: '0.2s' }}
                          />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    {password && (
                      <div className="mt-2 space-y-1">
                        <p className={`text-xs ${strengthColor}`}>
                          Password strength: {strengthScore < 2 ? 'Weak' : strengthScore < 4 ? 'Medium' : 'Strong'}
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className={`flex items-center gap-1 ${passwordStrength.hasLength ? 'text-green-500' : 'text-muted-foreground'}`}>
                            <Check className="h-3 w-3" />
                            At least 8 characters
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.hasUpperCase && passwordStrength.hasLowerCase ? 'text-green-500' : 'text-muted-foreground'}`}>
                            <Check className="h-3 w-3" />
                            Mix of upper & lowercase letters
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.hasNumber ? 'text-green-500' : 'text-muted-foreground'}`}>
                            <Check className="h-3 w-3" />
                            At least one number
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.hasSpecial ? 'text-green-500' : 'text-muted-foreground'}`}>
                            <Check className="h-3 w-3" />
                            At least one special character
                          </div>
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor={confirmPasswordId}>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            id={confirmPasswordId}
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            autoComplete="new-password"
                            className="pr-10 fade-in-up"
                            style={{ animationDelay: '0.3s' }}
                          />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => {
                  return (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          id={acceptTermsId}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          name={field.name}
                          onBlur={field.onBlur}
                          disabled={field.disabled}
                          ref={field.ref}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-relaxed">
                        <FormLabel htmlFor={acceptTermsId} className="text-sm font-normal inline">
                          <span className="inline">I agree to the </span>
                          <Link 
                            href="/platform/terms" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline inline whitespace-nowrap"
                          >
                            Terms of Service
                          </Link>
                          <span className="inline"> and </span>
                          <Link 
                            href="/platform/privacy" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline inline whitespace-nowrap"
                          >
                            Privacy Policy
                          </Link>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )
                }}
              />
              <Button
                type="submit"
                className="w-full btn-gradient-primary fade-in-up cursor-pointer"
                style={{ animationDelay: '0.4s' }}
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </Form>
        </div>
        <div className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.delete('signup')
                url.searchParams.set('signin', 'true')
                window.history.replaceState({}, '', url.toString())
              }}
              className="text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
            >
              Sign in
            </button>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 w-full">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => handleProviderSignIn('google')}
              disabled={isLoadingProvider === 'google'}
            >
              {isLoadingProvider === 'google' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Google
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => handleProviderSignIn('github')}
              disabled={isLoadingProvider === 'github'}
            >
              {isLoadingProvider === 'github' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              )}
              GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}