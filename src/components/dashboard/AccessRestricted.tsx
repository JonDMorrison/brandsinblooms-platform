'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Button } from '@/src/components/ui/button'
import { Clock, LogOut } from 'lucide-react'
import { supabase } from '@/src/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function AccessRestricted() {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      setIsSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-12 w-12 text-blue-400" />
          </div>
          <CardTitle className="text-center">Account Setup Pending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-center">
              Your account hasn&apos;t been enabled for site creation yet. We&apos;ll notify you once it&apos;s ready!
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleSignOut}
            disabled={isSigningOut}
            variant="outline"
            className="w-full"
          >
            {isSigningOut ? (
              <>Signing out...</>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
