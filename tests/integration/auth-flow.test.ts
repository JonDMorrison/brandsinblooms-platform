import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database/types'

const supabaseUrl = process.env.TEST_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.TEST_SUPABASE_ANON_KEY || ''

describe('Authentication Flow Integration Tests', () => {
  let supabase: ReturnType<typeof createClient<Database>>
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'SecurePassword123!'
  
  beforeAll(() => {
    if (!supabaseAnonKey) {
      console.warn('Skipping auth flow tests: TEST_SUPABASE_ANON_KEY not set')
      return
    }
    
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
  })
  
  afterAll(async () => {
    if (!supabaseAnonKey) return
    
    // Clean up: sign out
    await supabase.auth.signOut()
  })
  
  describe('Complete Authentication Flow', () => {
    it('should handle signup, signin, and signout flow', async () => {
      if (!supabaseAnonKey) {
        console.warn('Test skipped: no anon key')
        return
      }
      
      // 1. Sign up new user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User',
          },
        },
      })
      
      expect(signUpError).toBeNull()
      expect(signUpData.user).toBeDefined()
      expect(signUpData.user?.email).toBe(testEmail)
      
      // Note: In a real environment, email confirmation would be required
      // For testing, you might need to use the service role to confirm the user
      
      // 2. Sign out after signup
      const { error: signOutError1 } = await supabase.auth.signOut()
      expect(signOutError1).toBeNull()
      
      // 3. Sign in with credentials
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
      
      expect(signInError).toBeNull()
      expect(signInData.user).toBeDefined()
      expect(signInData.session).toBeDefined()
      expect(signInData.user?.email).toBe(testEmail)
      
      // 4. Get current user
      const { data: { user }, error: getUserError } = await supabase.auth.getUser()
      
      expect(getUserError).toBeNull()
      expect(user).toBeDefined()
      expect(user?.email).toBe(testEmail)
      
      // 5. Update user metadata
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        data: { 
          full_name: 'Updated Test User',
          preferences: { theme: 'dark' },
        },
      })
      
      expect(updateError).toBeNull()
      expect(updateData.user?.user_metadata.full_name).toBe('Updated Test User')
      expect(updateData.user?.user_metadata.preferences?.theme).toBe('dark')
      
      // 6. Sign out
      const { error: signOutError2 } = await supabase.auth.signOut()
      expect(signOutError2).toBeNull()
      
      // 7. Verify user is signed out
      const { data: { user: nullUser } } = await supabase.auth.getUser()
      expect(nullUser).toBeNull()
    })
    
    it('should handle invalid credentials correctly', async () => {
      if (!supabaseAnonKey) {
        console.warn('Test skipped: no anon key')
        return
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      })
      
      expect(error).toBeDefined()
      expect(error?.message).toContain('Invalid login credentials')
      expect(data.user).toBeNull()
      expect(data.session).toBeNull()
    })
    
    it('should validate password requirements on signup', async () => {
      if (!supabaseAnonKey) {
        console.warn('Test skipped: no anon key')
        return
      }
      
      const weakPassword = '123' // Too short
      
      const { error } = await supabase.auth.signUp({
        email: `weak-${Date.now()}@example.com`,
        password: weakPassword,
      })
      
      expect(error).toBeDefined()
      // Supabase typically requires passwords to be at least 6 characters
      expect(error?.message).toMatch(/password/i)
    })
  })
  
  describe('Session Management', () => {
    it('should persist and refresh sessions', async () => {
      if (!supabaseAnonKey) {
        console.warn('Test skipped: no anon key')
        return
      }
      
      // Sign in to get a session
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
      
      const originalSession = signInData.session
      expect(originalSession).toBeDefined()
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      expect(session).toBeDefined()
      expect(session?.access_token).toBe(originalSession?.access_token)
      
      // Refresh session
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession()
      
      expect(refreshError).toBeNull()
      expect(refreshedSession).toBeDefined()
      // New session should have different tokens
      expect(refreshedSession?.access_token).not.toBe(originalSession?.access_token)
      
      // Clean up
      await supabase.auth.signOut()
    })
  })
  
  describe('Password Reset Flow', () => {
    it('should initiate password reset', async () => {
      if (!supabaseAnonKey) {
        console.warn('Test skipped: no anon key')
        return
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: 'http://localhost:3000/reset-password',
      })
      
      // In test environment, this might not send actual email
      // but should not error if email exists
      expect(error).toBeNull()
    })
  })
})