import SignIn from '@/components/auth/SignIn'
import { requireGuest } from '@/lib/auth/server'

export default async function LoginPage() {
  // Redirect to dashboard if already authenticated
  await requireGuest()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <SignIn />
    </div>
  )
}