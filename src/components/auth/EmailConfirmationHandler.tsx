'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/src/components/ui/alert'

/**
 * EmailConfirmationHandler
 * 
 * Handles email confirmation codes from Supabase auth emails.
 * When a user clicks the confirmation link, they're redirected to the site with a code parameter.
 * This component exchanges that code for a session and redirects to the dashboard.
 */
export function EmailConfirmationHandler() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        const code = searchParams.get('code')

        if (!code) {
            return
        }

        const confirmEmail = async () => {
            setStatus('loading')

            try {
                const supabase = createClient()
                const { error } = await supabase.auth.exchangeCodeForSession(code)

                if (error) {
                    console.error('Email confirmation error:', error)
                    setStatus('error')
                    setErrorMessage(error.message || 'Account confirmation failed')
                } else {
                    setStatus('success')
                    // Redirect to dashboard after successful confirmation
                    setTimeout(() => {
                        router.push('/dashboard')
                    }, 1500)
                }
            } catch (err) {
                console.error('Unexpected error during email confirmation:', err)
                setStatus('error')
                setErrorMessage('An unexpected error occurred during confirmation')
            }
        }

        confirmEmail()
    }, [searchParams, router])

    // Don't render anything if there's no code
    if (!searchParams.get('code')) {
        return null
    }

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border rounded-lg shadow-lg p-8 max-w-md w-full">
                {status === 'loading' && (
                    <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                        <h2 className="text-xl font-semibold">Confirming your account...</h2>
                        <p className="text-muted-foreground text-sm">
                            Please wait while we verify your email address.
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center space-y-4">
                        <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
                        <h2 className="text-xl font-semibold">Account confirmed!</h2>
                        <p className="text-muted-foreground text-sm">
                            Your email has been verified. Redirecting to dashboard...
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <XCircle className="w-12 h-12 mx-auto text-destructive" />
                            <h2 className="text-xl font-semibold mt-4">Confirmation failed</h2>
                        </div>
                        <Alert variant="destructive">
                            <AlertDescription>
                                {errorMessage || 'Unable to confirm your account. The link may have expired or already been used.'}
                            </AlertDescription>
                        </Alert>
                        <div className="text-center">
                            <button
                                onClick={() => router.push('/')}
                                className="text-sm text-primary hover:underline"
                            >
                                Return to home
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
