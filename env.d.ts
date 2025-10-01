declare namespace NodeJS {
  interface ProcessEnv {
    // Public (client-side)
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string
    NEXT_PUBLIC_ENABLE_ECOMMERCE?: string

    // Private (server-side only)
    SUPABASE_SERVICE_ROLE_KEY: string
    DATABASE_URL: string
    STRIPE_SECRET_KEY?: string
  }
}