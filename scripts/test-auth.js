#!/usr/bin/env node

// Test authentication directly
const SUPABASE_URL = 'http://localhost:54321';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function testAuth() {
  console.log('Testing authentication...\n');
  
  const testAccounts = [
    { email: 'owner@test.com', password: 'password123' },
    { email: 'admin@test.com', password: 'password123' },
    { email: 'editor@test.com', password: 'password123' },
    { email: 'viewer@test.com', password: 'password123' }
  ];

  for (const account of testAccounts) {
    console.log(`Testing ${account.email}...`);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY
        },
        body: JSON.stringify({
          email: account.email,
          password: account.password
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ Success! User ID: ${data.user.id}`);
      } else {
        console.log(`❌ Failed: ${data.msg || data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
}

testAuth().catch(console.error);