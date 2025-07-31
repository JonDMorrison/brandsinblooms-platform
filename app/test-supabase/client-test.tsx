'use client'

import { createClient } from '@/src/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function ClientTest() {
  const [status, setStatus] = useState<string>('Testing...')
  const [session, setSession] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testClient() {
      try {
        const supabase = createClient()
        setStatus('Client initialized ✅')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          setError(error.message)
        } else {
          setSession(session)
        }
      } catch (err) {
        setStatus('Client initialization failed ❌')
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }
    
    testClient()
  }, [])

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Browser Client Test</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Browser client: {status}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Session check: {error ? `❌ ${error}` : session ? `✅ User: ${session.user.email}` : '✅ No session (not logged in)'}
      </p>
    </div>
  )
}