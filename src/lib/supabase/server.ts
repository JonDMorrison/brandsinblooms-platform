import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database/types'
import { getSharedCookieDomain } from '@/lib/cookies/domain-config'

export async function createClient() {
  const cookieStore = await cookies()
  const cookieDomain = getSharedCookieDomain()

  console.log('🍪 [SERVER CLIENT] Creating Supabase client with cookie domain:', cookieDomain)

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Override cookie domain to enable sharing across main app and customer subdomains
              const cookieOptions = {
                ...options,
                domain: cookieDomain,
              }
              console.log('🍪 [SERVER CLIENT] Setting cookie:', {
                name,
                domain: cookieOptions.domain,
                path: cookieOptions.path,
                sameSite: cookieOptions.sameSite,
                httpOnly: cookieOptions.httpOnly
              })
              cookieStore.set(name, value, cookieOptions)
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.log('🍪 [SERVER CLIENT] Cookie set failed (expected in Server Components):', error)
          }
        },
      },
    }
  )
}