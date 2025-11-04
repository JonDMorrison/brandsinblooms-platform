import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/database/types'
import { getSharedCookieDomain } from '@/lib/cookies/domain-config'

// Get shared cookie domain for cross-subdomain authentication
const cookieDomain = getSharedCookieDomain()

// Cookie options for browser client
const cookieOptions = {
  domain: cookieDomain,
  path: '/',
  sameSite: 'lax' as const,
}

// Create Supabase client function (for compatibility with some imports)
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Browser environment - use document.cookie
          if (typeof document === 'undefined') return undefined
          const value = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
            ?.split('=')[1]
          return value
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return

          // Merge with our custom domain
          const finalOptions = {
            ...options,
            ...cookieOptions,
          }

          // Build cookie string
          let cookie = `${name}=${value}`
          if (finalOptions.domain) cookie += `; domain=${finalOptions.domain}`
          if (finalOptions.path) cookie += `; path=${finalOptions.path}`
          if (finalOptions.maxAge) cookie += `; max-age=${finalOptions.maxAge}`
          if (finalOptions.sameSite) cookie += `; samesite=${finalOptions.sameSite}`
          if (finalOptions.secure) cookie += '; secure'

          document.cookie = cookie
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return

          // Remove with our custom domain
          const finalOptions = {
            ...options,
            ...cookieOptions,
          }

          let cookie = `${name}=; max-age=0`
          if (finalOptions.domain) cookie += `; domain=${finalOptions.domain}`
          if (finalOptions.path) cookie += `; path=${finalOptions.path}`

          document.cookie = cookie
        },
      },
    }
  )
}

// Export default client instance (for most use cases)
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: process.env.NODE_ENV === 'development',
    },
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${name}=`))
          ?.split('=')[1]
        return value
      },
      set(name: string, value: string, options: any) {
        if (typeof document === 'undefined') return

        const finalOptions = {
          ...options,
          ...cookieOptions,
        }

        let cookie = `${name}=${value}`
        if (finalOptions.domain) cookie += `; domain=${finalOptions.domain}`
        if (finalOptions.path) cookie += `; path=${finalOptions.path}`
        if (finalOptions.maxAge) cookie += `; max-age=${finalOptions.maxAge}`
        if (finalOptions.sameSite) cookie += `; samesite=${finalOptions.sameSite}`
        if (finalOptions.secure) cookie += '; secure'

        document.cookie = cookie
      },
      remove(name: string, options: any) {
        if (typeof document === 'undefined') return

        const finalOptions = {
          ...options,
          ...cookieOptions,
        }

        let cookie = `${name}=; max-age=0`
        if (finalOptions.domain) cookie += `; domain=${finalOptions.domain}`
        if (finalOptions.path) cookie += `; path=${finalOptions.path}`

        document.cookie = cookie
      },
    },
  }
)