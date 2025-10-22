/**
 * Test that the trigger automatically creates product_category_assignments
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTrigger() {
  const siteId = '5d8387d5-1271-446d-9980-aaf429f93a21';
  const categoryId = 'a1b2c3d4-e5f6-4a5b-8c9d-111111111111'; // Indoor Plants

  console.log('🧪 Testing Trigger: sync_primary_category_assignment\n');
  console.log('='.repeat(80));

  // Test 1: Create a product with primary_category_id
  console.log('\n📝 Test 1: Creating product with primary_category_id...');

  const { data: newProduct, error: createError } = await supabase
    .from('products')
    .insert({
      site_id: siteId,
      name: 'Trigger Test Plant',
      slug: 'trigger-test-plant-' + Date.now(),
      price: 9.99,
      primary_category_id: categoryId,
      sku: 'TEST-TRIGGER-' + Date.now(),
    })
    .select()
    .single();

  if (createError) {
    console.error('   ❌ Error creating product:', createError.message);
    return;
  }

  console.log(`   ✅ Product created: ${newProduct.name} (ID: ${newProduct.id})`);

  // Check if assignment was automatically created
  const { data: assignment, error: assignmentError } = await supabase
    .from('product_category_assignments')
    .select('*')
    .eq('product_id', newProduct.id)
    .eq('category_id', categoryId)
    .maybeSingle();

  if (assignmentError) {
    console.error('   ❌ Error checking assignment:', assignmentError.message);
  } else if (assignment) {
    console.log(`   ✅ Assignment automatically created by trigger!`);
    console.log(`      - Category ID: ${assignment.category_id}`);
    console.log(`      - Is Primary: ${assignment.is_primary}`);
    console.log(`      - Sort Order: ${assignment.sort_order}`);
  } else {
    console.log(`   ❌ Assignment NOT created - trigger may not be working`);
  }

  // Test 2: Update product's primary_category_id
  console.log('\n📝 Test 2: Updating product primary_category_id...');

  const newCategoryId = 'a1b2c3d4-e5f6-4a5b-8c9d-222222222222'; // Outdoor Plants

  const { error: updateError } = await supabase
    .from('products')
    .update({ primary_category_id: newCategoryId })
    .eq('id', newProduct.id);

  if (updateError) {
    console.error('   ❌ Error updating product:', updateError.message);
  } else {
    console.log(`   ✅ Product updated with new primary_category_id`);

    // Check if new assignment was created and old one removed
    const { data: newAssignment } = await supabase
      .from('product_category_assignments')
      .select('*')
      .eq('product_id', newProduct.id)
      .eq('is_primary', true)
      .maybeSingle();

    if (newAssignment && newAssignment.category_id === newCategoryId) {
      console.log(`   ✅ Assignment updated by trigger!`);
      console.log(`      - New Category ID: ${newAssignment.category_id}`);
    } else {
      console.log(`   ❌ Assignment NOT updated correctly`);
    }
  }

  // Test 3: Set primary_category_id to NULL
  console.log('\n📝 Test 3: Removing primary_category_id (set to NULL)...');

  const { error: removeError } = await supabase
    .from('products')
    .update({ primary_category_id: null })
    .eq('id', newProduct.id);

  if (removeError) {
    console.error('   ❌ Error removing category:', removeError.message);
  } else {
    console.log(`   ✅ Product primary_category_id set to NULL`);

    // Check if primary assignment was removed
    const { data: primaryAssignment } = await supabase
      .from('product_category_assignments')
      .select('*')
      .eq('product_id', newProduct.id)
      .eq('is_primary', true)
      .maybeSingle();

    if (!primaryAssignment) {
      console.log(`   ✅ Primary assignment removed by trigger!`);
    } else {
      console.log(`   ❌ Primary assignment NOT removed`);
    }
  }

  // Cleanup: Delete test product
  console.log('\n🧹 Cleaning up test product...');

  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', newProduct.id);

  if (deleteError) {
    console.error('   ❌ Error deleting test product:', deleteError.message);
  } else {
    console.log(`   ✅ Test product deleted`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Trigger testing complete!\n');
}

testTrigger().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
