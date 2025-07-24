import { execSync } from 'child_process'

// Setup for integration tests
export const setupIntegrationTests = () => {
  // Check if Supabase is running locally
  try {
    const result = execSync('supabase status', { encoding: 'utf-8' })
    
    if (!result.includes('supabase local development setup is running')) {
      console.warn('Supabase is not running. Start it with: pnpm supabase:start')
      process.exit(1)
    }
    
    // Extract service role key from status
    const serviceKeyMatch = result.match(/service_role key: (.+)/)
    if (serviceKeyMatch) {
      process.env.TEST_SUPABASE_SERVICE_KEY = serviceKeyMatch[1].trim()
    }
    
    // Extract anon key from status
    const anonKeyMatch = result.match(/anon key: (.+)/)
    if (anonKeyMatch) {
      process.env.TEST_SUPABASE_ANON_KEY = anonKeyMatch[1].trim()
    }
    
    // Set test URL
    process.env.TEST_SUPABASE_URL = 'http://localhost:54321'
    
  } catch (error) {
    console.error('Failed to check Supabase status:', error)
    console.warn('Integration tests will be skipped')
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupIntegrationTests()
}