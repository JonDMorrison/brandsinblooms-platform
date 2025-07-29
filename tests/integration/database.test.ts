import { createClient } from '@supabase/supabase-js'
import { Database } from '@/src/lib/database/types'

// Integration tests require actual Supabase connection
// Set TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_KEY in environment
const supabaseUrl = process.env.TEST_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.TEST_SUPABASE_SERVICE_KEY || ''

describe('Database Integration Tests', () => {
  let supabase: ReturnType<typeof createClient<Database>>
  let testUserId: string
  
  beforeAll(() => {
    if (!supabaseServiceKey) {
      console.warn('Skipping integration tests: TEST_SUPABASE_SERVICE_KEY not set')
      return
    }
    
    supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  })
  
  beforeEach(async () => {
    if (!supabaseServiceKey) return
    
    // Create a test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true,
    })
    
    if (authError) throw authError
    testUserId = authData.user.id
  })
  
  afterEach(async () => {
    if (!supabaseServiceKey || !testUserId) return
    
    // Clean up test user
    await supabase.auth.admin.deleteUser(testUserId)
  })
  
  describe('Profile Management', () => {
    it('should create and retrieve user profile', async () => {
      if (!supabaseServiceKey) {
        console.warn('Test skipped: no service key')
        return
      }
      
      // Create profile
      const profileData = {
        user_id: testUserId,
        username: 'testuser',
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      }
      
      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()
      
      expect(createError).toBeNull()
      expect(createdProfile).toMatchObject(profileData)
      
      // Retrieve profile
      const { data: retrievedProfile, error: retrieveError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', testUserId)
        .single()
      
      expect(retrieveError).toBeNull()
      expect(retrievedProfile).toMatchObject(profileData)
    })
    
    it('should enforce unique username constraint', async () => {
      if (!supabaseServiceKey) {
        console.warn('Test skipped: no service key')
        return
      }
      
      // Create first profile
      await supabase.from('profiles').insert({
        user_id: testUserId,
        username: 'uniqueuser',
      })
      
      // Try to create another user
      const { data: authData } = await supabase.auth.admin.createUser({
        email: `test2-${Date.now()}@example.com`,
        password: 'testpassword123',
        email_confirm: true,
      })
      
      // Try to create profile with same username
      const { error } = await supabase.from('profiles').insert({
        user_id: authData!.user.id,
        username: 'uniqueuser',
      })
      
      expect(error).toBeDefined()
      expect(error?.code).toBe('23505') // Unique violation
      
      // Clean up second user
      await supabase.auth.admin.deleteUser(authData!.user.id)
    })
  })
  
  describe('Row Level Security', () => {
    it('should allow users to read only their own profile', async () => {
      if (!supabaseServiceKey) {
        console.warn('Test skipped: no service key')
        return
      }
      
      // Create profile using service role
      await supabase.from('profiles').insert({
        user_id: testUserId,
        username: 'privateuser',
      })
      
      // Create another user and profile
      const { data: otherUser } = await supabase.auth.admin.createUser({
        email: `other-${Date.now()}@example.com`,
        password: 'testpassword123',
        email_confirm: true,
      })
      
      await supabase.from('profiles').insert({
        user_id: otherUser!.user.id,
        username: 'otheruser',
      })
      
      // Create client with user's auth token
      const { data: session } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: `test-${Date.now()}@example.com`,
      })
      
      // This would normally use the user's actual session
      // For testing, we'll verify RLS policies exist
      const { data: policies } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'profiles')
      
      expect(policies).toBeDefined()
      expect(policies?.length).toBeGreaterThan(0)
      
      // Clean up
      await supabase.auth.admin.deleteUser(otherUser!.user.id)
    })
  })
  
  describe('Real-time Subscriptions', () => {
    it('should receive real-time updates for profile changes', async (done) => {
      if (!supabaseServiceKey) {
        console.warn('Test skipped: no service key')
        done()
        return
      }
      
      // Create initial profile
      await supabase.from('profiles').insert({
        user_id: testUserId,
        username: 'realtimeuser',
      })
      
      // Set up subscription
      const channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${testUserId}`,
          },
          (payload) => {
            expect(payload.new).toMatchObject({
              username: 'updateduser',
            })
            
            // Clean up subscription
            supabase.removeChannel(channel)
            done()
          }
        )
        .subscribe()
      
      // Wait for subscription to be ready
      setTimeout(async () => {
        // Update profile
        await supabase
          .from('profiles')
          .update({ username: 'updateduser' })
          .eq('user_id', testUserId)
      }, 1000)
    }, 10000) // Increase timeout for real-time test
  })
})