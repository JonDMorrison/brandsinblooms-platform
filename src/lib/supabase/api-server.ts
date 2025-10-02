import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from './server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/database/types'

/**
 * Creates a Supabase client from a NextRequest that supports both:
 * - Bearer token authentication (Authorization header) - for API/curl testing
 * - Cookie-based authentication (SSR) - for browser requests
 *
 * This enables the same API endpoint to be tested via curl with a JWT token
 * while maintaining full compatibility with browser-based cookie sessions.
 *
 * @param request - The NextRequest object
 * @returns Supabase client configured with appropriate auth method
 *
 * @example
 * // API route that accepts both auth methods
 * export async function POST(request: NextRequest) {
 *   const supabase = await createClientFromRequest(request)
 *   const { data: { user } } = await supabase.auth.getUser()
 *   // ...
 * }
 *
 * @example
 * // Testing with curl
 * curl -X POST http://localhost:3001/api/endpoint \
 *   -H "Authorization: Bearer <your-jwt-token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"data": "value"}'
 */
export async function createClientFromRequest(request: NextRequest) {
  // Check for Bearer token in Authorization header
  const authHeader = request.headers.get('authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    console.log('[API Auth] Using Bearer token authentication')

    // Create a client with the provided token
    // The token will be used for all API calls including auth.getUser()
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    return supabase
  }

  console.log('[API Auth] Using cookie-based authentication')

  // Fall back to cookie-based auth for browser requests
  return await createServerClient()
}
