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
      const { supabase } = await import('@/lib/supabase/client')
      
      expect(createBrowserClient).toHaveBeenCalledWith(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
      )
      expect(supabase).toBe(mockClient)
    })
  })
  
  // Note: Server-side client testing removed as it's specific to Next.js
  // In a Vite SPA, all Supabase operations happen client-side
})