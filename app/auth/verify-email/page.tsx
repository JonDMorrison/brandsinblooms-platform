import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Mail } from 'lucide-react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-primary">
            <Mail className="h-full w-full" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a verification link to confirm your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            Please check your email and click the verification link to activate your account.
            The link will expire in 24 hours.
          </p>
          <div className="pt-4 text-center">
            <p className="text-sm text-gray-500">
              Didn&apos;t receive the email?{' '}
              <button className="text-primary hover:underline">
                Resend verification email
              </button>
            </p>
          </div>
          <div className="pt-2 text-center">
            <Link 
              href="/login" 
              className="text-sm text-gray-500 hover:text-primary transition-colors"
            >
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}