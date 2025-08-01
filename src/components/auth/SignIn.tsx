'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Eye, EyeOff, Mail } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/AuthContext'
import { signInSchema, type SignInData } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { signInWithProvider, signInWithMagicLink, handleAuthError } from '@/lib/auth/client'
import { AuthError } from '@supabase/supabase-js'
import { handleError } from '@/lib/types/error-handling'

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoadingProvider, setIsLoadingProvider] = useState<string | null>(null)
  const [isLoadingMagicLink, setIsLoadingMagicLink] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  // Generate unique IDs at the top level
  const emailId = React.useId()
  const passwordId = React.useId()

  const form = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: SignInData) => {
    try {
      await signIn(data.email, data.password)
      toast.success('Successfully signed in!')
      router.push('/dashboard')
    } catch (error: unknown) {
      const message = handleAuthError(error as AuthError)
      toast.error(message)
    }
  }

  const handleProviderSignIn = async (provider: 'google' | 'github') => {
    try {
      setIsLoadingProvider(provider)
      await signInWithProvider(provider)
    } catch (error: unknown) {
      const handled = handleError(error)
      toast.error(`Failed to sign in with ${provider}. Please try again.`)
    } finally {
      setIsLoadingProvider(null)
    }
  }

  const handleMagicLinkSignIn = async () => {
    const email = form.getValues('email')
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    try {
      setIsLoadingMagicLink(true)
      await signInWithMagicLink(email)
      toast.success('Check your email for the magic link!')
    } catch (error: unknown) {
      const handled = handleError(error)
      toast.error('Failed to send magic link. Please try again.')
    } finally {
      setIsLoadingMagicLink(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card className="gradient-card shadow-lg hover-scale-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-brand-heading text-primary">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to your Brands in Blooms account
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                            placeholder="Enter your password"
                            autoComplete="current-password"
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
                    <FormMessage />
                  </FormItem>
                  )
                }}
              />
              <div className="flex items-center justify-between">
                <Link
                  href="/auth/reset-password"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full btn-gradient-primary fade-in-up"
                style={{ animationDelay: '0.3s' }}
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleMagicLinkSignIn}
                disabled={isLoadingMagicLink}
              >
                {isLoadingMagicLink ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending magic link...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Sign in with Magic Link
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/?signup=true"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Sign up
            </Link>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 w-full">
            <Button
              variant="outline"
              className="interactive"
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
              className="interactive"
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
        </CardFooter>
      </Card>
    </div>
  )
}