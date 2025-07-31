const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration - using service role key for admin operations
const supabaseUrl = 'http://localhost:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    // Try to delete any existing user first
    const { data: users } = await supabase.auth.admin.listUsers();
    const existingUser = users?.users?.find(u => u.email === 'admin@test.com');
    
    if (existingUser) {
      console.log('Removing existing user...');
      await supabase.auth.admin.deleteUser(existingUser.id);
    }

    // Create new admin user
    console.log('Creating new admin user...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@test.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
        username: 'admin'
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      return;
    }

    console.log('✓ User created successfully!');
    console.log('  Email: admin@test.com');
    console.log('  Password: admin123');
    console.log('  User ID:', data.user.id);
    
    // Update the profile to set admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        username: 'admin',
        full_name: 'Admin User',
        bio: 'Platform administrator'
      })
      .eq('user_id', data.user.id);
      
    if (profileError) {
      console.error('Error updating profile:', profileError);
    } else {
      console.log('✓ Profile updated with admin role');
    }
    
    // Add site membership for the greenthumb site
    const { data: sites } = await supabase
      .from('sites')
      .select('id')
      .eq('subdomain', 'greenthumb')
      .single();
      
    if (sites) {
      const { error: membershipError } = await supabase
        .from('site_memberships')
        .insert({
          user_id: data.user.id,
          site_id: sites.id,
          role: 'owner',
          is_active: true
        });
        
      if (membershipError) {
        console.error('Error creating site membership:', membershipError);
      } else {
        console.log('✓ Site membership created');
      }
    }
    
    console.log('\nYou can now login with:');
    console.log('Email: admin@test.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminUser();