import { createBrowserClient } from '@supabase/ssr'

// Mock dependencies
jest.mock('@supabase/ssr')

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset modules to ensure clean state
    jest.resetModules()
  })
  
  describe('Browser Client', () => {
    it('should create browser client with correct configuration', async () => {
      const mockClient = { auth: { signIn: jest.fn() } }
      ;(createBrowserClient as jest.Mock).mockReturnValue(mockClient)
      
      // Import the client module
      const { supabase } = await import('@/src/lib/supabase/client')
      
      expect(createBrowserClient).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      expect(supabase).toBe(mockClient)
    })
  })
  
  // Note: Server-side client testing should be added for Next.js server components
  // Additional tests needed for middleware and server-side auth flows
})