'use client'

import { useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry
      // Sentry.captureException(error)
      
      // Custom error logging
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error)
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="max-w-md w-full text-center space-y-6 fade-in">
        <div className="flex justify-center">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gradient-primary">
            500
          </h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="text-muted-foreground">
            We apologize for the inconvenience. An unexpected error has occurred while processing your request.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-muted/50 p-4 rounded-lg text-left">
            <p className="text-sm font-mono text-muted-foreground break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground/70 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            className="btn-gradient-primary"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>

        <div className="pt-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            If this problem persists, please{' '}
            <Link href="/contact" className="text-primary hover:underline">
              contact support
            </Link>
          </p>
          {error.digest && process.env.NODE_ENV === 'production' && (
            <p className="text-xs text-muted-foreground/70">
              Error Reference: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}