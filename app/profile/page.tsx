'use client'

import { useAuth } from '@/src/contexts/AuthContext'
import Link from 'next/link'

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-8">Profile</h1>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="space-y-2">
            <div>
              <span className="text-muted-foreground">Email:</span>{' '}
              <span className="font-medium">{user?.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground">User ID:</span>{' '}
              <span className="font-medium">{user?.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created at:</span>{' '}
              <span className="font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}