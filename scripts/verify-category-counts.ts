/**
 * Verify that category counts are now correct
 * Simulates what the getProductCategories() function will return
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCategories() {
  // Focus on Soul Bloom Sanctuary site (the one with data)
  const siteId = '5d8387d5-1271-446d-9980-aaf429f93a21';

  console.log('✅ Verifying Category Counts');
  console.log('='.repeat(80));
  console.log(`Site: Soul Bloom Sanctuary`);
  console.log(`Site ID: ${siteId}\n`);

  // Simulate getProductCategories() from products.ts:664-702
  const categoriesResponse = await supabase
    .from('product_categories')
    .select(`
      id,
      name,
      slug,
      icon,
      color,
      product_category_assignments!product_category_assignments_category_id_fkey(
        product_id
      )
    `)
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (categoriesResponse.error) {
    console.error('Error fetching categories:', categoriesResponse.error);
    return;
  }

  const categories = categoriesResponse.data || [];

  console.log('📂 Category Counts (as returned by getProductCategories()):\n');
  console.log('   Category Name                | Count');
  console.log('   ' + '-'.repeat(76));

  // Transform to include count (same logic as getProductCategories)
  const categoriesWithCounts = categories.map((category) => {
    const categoryAssignments = (category.product_category_assignments as any[]) || [];
    const productCount = categoryAssignments.length;

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      count: productCount,
      icon: category.icon || undefined,
      color: category.color || undefined,
    };
  });

  // Sort by name for easier reading
  categoriesWithCounts.sort((a, b) => a.name.localeCompare(b.name));

  categoriesWithCounts.forEach((cat) => {
    const name = cat.name.padEnd(28);
    const count = cat.count.toString().padStart(3);
    console.log(`   ${name} | ${count}`);
  });

  // Get total product count
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId);

  console.log('\n   ' + '-'.repeat(76));
  console.log(`   TOTAL (All categories)       | ${String(totalProducts || 0).padStart(3)}`);

  // Check for issues
  console.log('\n\n🔍 Validation Checks:\n');

  const totalCounted = categoriesWithCounts.reduce((sum, cat) => sum + cat.count, 0);
  const hasZeroCounts = categoriesWithCounts.some(cat => cat.count === 0);

  if (hasZeroCounts) {
    console.log('   ⚠️  Warning: Some categories have 0 products');
    categoriesWithCounts
      .filter(cat => cat.count === 0)
      .forEach(cat => console.log(`      - ${cat.name}`));
  } else {
    console.log('   ✅ All categories have products');
  }

  // Note: total counted may be more than total products if products are in multiple categories
  console.log(`\n   Total assignments: ${totalCounted}`);
  console.log(`   Total products: ${totalProducts || 0}`);

  if (totalCounted >= (totalProducts || 0)) {
    console.log(`   ✅ Assignment count matches or exceeds product count (some products may be in multiple categories)`);
  } else {
    console.log(`   ❌ Assignment count is less than product count - some products may be missing assignments`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Verification Complete\n');

  // Show what the UI dropdown will display
  console.log('📱 UI Dropdown Preview (what the user will see):\n');
  console.log(`   All (${totalProducts || 0})`);
  categoriesWithCounts.forEach((cat) => {
    console.log(`   ${cat.name} (${cat.count})`);
  });

  console.log('\n' + '='.repeat(80));
}

verifyCategories().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
