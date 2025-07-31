const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  try {
    console.log('Testing login with admin@greenthumbgardens.com / password123');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@greenthumbgardens.com',
      password: 'password123'
    });

    if (error) {
      console.error('Login failed:', error.message);
      console.error('Error code:', error.code);
      console.error('Error status:', error.status);
      return;
    }

    console.log('Login successful!');
    console.log('User ID:', data.user.id);
    console.log('User email:', data.user.email);
    console.log('Session:', data.session ? 'Active' : 'None');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testLogin();