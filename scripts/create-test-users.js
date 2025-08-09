#!/usr/bin/env node

// Script to create test users via Supabase API
// Run with: node scripts/create-test-users.js

const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const users = [
  { email: 'admin@test.com', password: 'password123', fullName: 'Admin User', role: 'admin' },
  { email: 'owner@test.com', password: 'password123', fullName: 'Site Owner', role: 'site_owner' },
  { email: 'editor@test.com', password: 'password123', fullName: 'Editor User', role: 'user' },
  { email: 'viewer@test.com', password: 'password123', fullName: 'Viewer User', role: 'user' }
];

async function createUser(userData) {
  try {
    // Create user via auth API
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.fullName
        }
      })
    });

    if (!authResponse.ok) {
      const error = await authResponse.text();
      console.error(`Failed to create ${userData.email}:`, error);
      return null;
    }

    const authData = await authResponse.json();
    console.log(`✓ Created user: ${userData.email} (ID: ${authData.user.id})`);

    // Update profile with role
    const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${authData.user.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        role: userData.role,
        full_name: userData.fullName,
        username: userData.email.split('@')[0]
      })
    });

    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      console.error(`Failed to update profile for ${userData.email}:`, error);
    } else {
      console.log(`✓ Updated profile role: ${userData.role}`);
    }

    return authData.user.id;
  } catch (error) {
    console.error(`Error creating user ${userData.email}:`, error.message);
    return null;
  }
}

async function createSiteMemberships(userId, userEmail) {
  // Define site memberships based on user
  let memberships = [];
  
  if (userEmail === 'admin@test.com') {
    // Admin has owner access to all sites
    memberships = [
      { site_id: '00000000-0000-0000-0000-000000000001', role: 'owner' },
      { site_id: '14a3a999-b698-437f-90a8-f89842f10d08', role: 'owner' },
      { site_id: '55555555-5555-5555-5555-555555555555', role: 'owner' }
    ];
  } else if (userEmail === 'owner@test.com') {
    // Owner owns dev and greenthumb
    memberships = [
      { site_id: '00000000-0000-0000-0000-000000000001', role: 'owner' },
      { site_id: '14a3a999-b698-437f-90a8-f89842f10d08', role: 'owner' }
    ];
  } else if (userEmail === 'editor@test.com') {
    // Editor can edit dev site
    memberships = [
      { site_id: '00000000-0000-0000-0000-000000000001', role: 'editor' }
    ];
  } else if (userEmail === 'viewer@test.com') {
    // Viewer can view dev site
    memberships = [
      { site_id: '00000000-0000-0000-0000-000000000001', role: 'viewer' }
    ];
  }

  for (const membership of memberships) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/site_memberships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: userId,
          site_id: membership.site_id,
          role: membership.role,
          is_active: true
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Failed to create membership for ${userEmail}:`, error);
      } else {
        console.log(`✓ Created ${membership.role} membership for site ${membership.site_id}`);
      }
    } catch (error) {
      console.error(`Error creating membership:`, error.message);
    }
  }
}

async function main() {
  console.log('Creating test users...\n');

  for (const user of users) {
    console.log(`\nProcessing ${user.email}...`);
    const userId = await createUser(user);
    
    if (userId) {
      await createSiteMemberships(userId, user.email);
    }
  }

  console.log('\n✅ Test users created successfully!');
  console.log('\nYou can now login with:');
  console.log('  Email: owner@test.com');
  console.log('  Password: password123');
  console.log('\nOther test accounts:');
  console.log('  admin@test.com / password123 (Admin)');
  console.log('  editor@test.com / password123 (Editor)');
  console.log('  viewer@test.com / password123 (Viewer)');
}

main().catch(console.error);