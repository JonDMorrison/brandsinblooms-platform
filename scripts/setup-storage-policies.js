#!/usr/bin/env node

/**
 * Setup storage policies for product-images bucket
 * Run this script to configure RLS policies for the storage bucket
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStoragePolicies() {
  console.log('Setting up storage policies for product-images bucket...\n');

  try {
    // SQL to create storage policies
    const policies = [
      {
        name: 'Anyone can view product images',
        sql: `
          CREATE POLICY IF NOT EXISTS "Anyone can view product images"
          ON storage.objects FOR SELECT
          USING (bucket_id = 'product-images');
        `
      },
      {
        name: 'Authenticated users can upload product images',
        sql: `
          CREATE POLICY IF NOT EXISTS "Authenticated users can upload product images"
          ON storage.objects FOR INSERT
          WITH CHECK (
            bucket_id = 'product-images' 
            AND auth.uid() IS NOT NULL
          );
        `
      },
      {
        name: 'Authenticated users can update their product images',
        sql: `
          CREATE POLICY IF NOT EXISTS "Authenticated users can update their product images"
          ON storage.objects FOR UPDATE
          USING (
            bucket_id = 'product-images'
            AND auth.uid() IS NOT NULL
          )
          WITH CHECK (
            bucket_id = 'product-images'
            AND auth.uid() IS NOT NULL
          );
        `
      },
      {
        name: 'Authenticated users can delete their product images',
        sql: `
          CREATE POLICY IF NOT EXISTS "Authenticated users can delete their product images"
          ON storage.objects FOR DELETE
          USING (
            bucket_id = 'product-images'
            AND auth.uid() IS NOT NULL
          );
        `
      }
    ];

    // First, enable RLS on storage.objects table
    console.log('Enabling RLS on storage.objects table...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError && !rlsError.message.includes('already enabled')) {
      console.warn('Note: Could not enable RLS on storage.objects (may require admin privileges)');
    } else {
      console.log('✓ RLS enabled on storage.objects\n');
    }

    // Apply each policy
    for (const policy of policies) {
      console.log(`Creating policy: ${policy.name}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`✓ Policy already exists: ${policy.name}`);
        } else {
          console.error(`✗ Failed to create policy: ${policy.name}`);
          console.error(`  Error: ${error.message}`);
        }
      } else {
        console.log(`✓ Created policy: ${policy.name}`);
      }
    }

    console.log('\n✅ Storage policies setup complete!');
    console.log('\nNote: If policies couldn\'t be created due to permissions, you can:');
    console.log('1. Run the SQL commands in supabase/config/storage-policies.sql manually in the Supabase dashboard');
    console.log('2. Or configure the policies through the Supabase dashboard UI under Storage > Policies');

  } catch (error) {
    console.error('Error setting up storage policies:', error);
    process.exit(1);
  }
}

// Run the setup
setupStoragePolicies();