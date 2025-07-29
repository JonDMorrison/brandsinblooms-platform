import { createClient } from '@/lib/supabase/server'
import ClientTest from './client-test'

export default async function TestSupabasePage() {
  // Test server client
  const supabase = await createClient()
  
  // Try to get the current session
  const { data: { session }, error } = await supabase.auth.getSession()
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Client Test</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Server Client Test</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Server client initialized: ✅
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Session check: {error ? `❌ ${error.message}` : session ? `✅ User: ${session.user.email}` : '✅ No session (not logged in)'}
          </p>
        </div>
        
        <ClientTest />
      </div>
    </div>
  )
}