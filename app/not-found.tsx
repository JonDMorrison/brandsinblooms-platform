import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { Home, Search, ArrowLeft } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Page Not Found | Brands in Blooms',
  description: 'The page you are looking for could not be found.',
  robots: 'noindex, nofollow',
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="max-w-md w-full text-center space-y-6 fade-in">
        <div className="flex justify-center">
          <div className="p-4 bg-amber-100 rounded-full">
            <Search className="h-12 w-12 text-amber-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gradient-primary">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
            It might have been removed, renamed, or doesn&apos;t exist.
          </p>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Here are some helpful links instead:
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="default"
            asChild
            className="btn-gradient-primary"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="javascript:history.back()">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Link>
          </Button>
        </div>

        <div className="pt-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            Need help? Try these:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/dashboard"
              className="text-sm text-primary hover:underline"
            >
              Dashboard
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              href="/login"
              className="text-sm text-primary hover:underline"
            >
              Login
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              href="/signup"
              className="text-sm text-primary hover:underline"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}