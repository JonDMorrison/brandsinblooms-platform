const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const supabaseUrl = 'http://localhost:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    // Delete existing user if exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const user = existingUser?.users?.find(u => u.email === 'admin@greenthumbgardens.com');
    
    if (user) {
      console.log('Deleting existing user...');
      await supabase.auth.admin.deleteUser(user.id);
    }

    // Create new user
    console.log('Creating new user...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@greenthumbgardens.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User (Sarah)',
        username: 'greenthumb_admin'
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      return;
    }

    console.log('User created successfully:', data.user.email);
    console.log('User ID:', data.user.id);
    
    // Update the profile to be an admin
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', data.user.id);
      
    if (profileError) {
      console.error('Error updating profile:', profileError);
    } else {
      console.log('Profile updated to admin role');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestUser();