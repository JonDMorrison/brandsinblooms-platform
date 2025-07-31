const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  try {
    console.log('Testing login with admin@test.com / admin123');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123'
    });

    if (error) {
      console.error('Login failed:', error.message);
      return;
    }

    console.log('✓ Login successful!');
    console.log('  User:', data.user.email);
    console.log('  Session:', data.session ? 'Active' : 'None');
    console.log('  Access token:', data.session?.access_token ? 'Present' : 'Missing');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testLogin();