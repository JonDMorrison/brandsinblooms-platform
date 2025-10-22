/**
 * Detailed analysis of the category assignment issue
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function detailedAnalysis() {
  // Focus on Soul Bloom Sanctuary site
  const siteId = '5d8387d5-1271-446d-9980-aaf429f93a21';

  console.log('🔍 Detailed Category Assignment Analysis');
  console.log('='.repeat(80));
  console.log(`Site: Soul Bloom Sanctuary`);
  console.log(`Site ID: ${siteId}\n`);

  // Get all categories
  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name, slug')
    .eq('site_id', siteId)
    .order('name');

  console.log('📂 Categories:\n');
  categories?.forEach((cat) => {
    console.log(`   ${cat.name} (${cat.slug}) - ID: ${cat.id}`);
  });

  // Get all products with full details
  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      name,
      category,
      primary_category_id,
      primary_category:product_categories!products_primary_category_id_fkey (
        id,
        name
      )
    `)
    .eq('site_id', siteId)
    .order('name');

  console.log(`\n\n📦 Products (${products?.length || 0} total):\n`);
  console.log('   Name | Legacy Category | Primary Category ID | Has Assignment?');
  console.log('   ' + '-'.repeat(76));

  for (const product of products || []) {
    // Check if this product has an assignment
    const { data: assignment } = await supabase
      .from('product_category_assignments')
      .select('id, category_id, is_primary')
      .eq('product_id', product.id)
      .maybeSingle();

    const legacyCat = product.category || 'NONE';
    const primaryCatId = product.primary_category_id || 'NONE';
    const primaryCatName = (product.primary_category as any)?.name || 'NONE';
    const hasAssignment = assignment ? '✅ YES' : '❌ NO';

    console.log(`   ${product.name.padEnd(25)} | ${legacyCat.padEnd(18)} | ${primaryCatName.padEnd(18)} | ${hasAssignment}`);
  }

  // Get all assignments
  console.log(`\n\n🔗 Existing Product Category Assignments:\n`);
  const { data: assignments } = await supabase
    .from('product_category_assignments')
    .select(`
      id,
      product_id,
      category_id,
      is_primary,
      product:products (name),
      category:product_categories (name)
    `)
    .in('product_id', (products || []).map(p => p.id));

  if (assignments && assignments.length > 0) {
    assignments.forEach((assg) => {
      const productName = (assg.product as any)?.name || 'Unknown';
      const categoryName = (assg.category as any)?.name || 'Unknown';
      const isPrimary = assg.is_primary ? 'PRIMARY' : 'Secondary';
      console.log(`   ✓ ${productName} → ${categoryName} (${isPrimary})`);
    });
  } else {
    console.log('   ⚠️  No assignments found');
  }

  // Summarize the issue
  console.log(`\n\n🎯 Summary of the Issue:\n`);
  console.log('=' .repeat(80));

  const productsWithPrimaryCategoryId = products?.filter(p => p.primary_category_id) || [];
  const productsWithoutAssignment = productsWithPrimaryCategoryId.filter(async (p) => {
    const { data } = await supabase
      .from('product_category_assignments')
      .select('id')
      .eq('product_id', p.id)
      .maybeSingle();
    return !data;
  });

  console.log(`   ✓ Products with primary_category_id set: ${productsWithPrimaryCategoryId.length}`);
  console.log(`   ✓ Product category assignments in database: ${assignments?.length || 0}`);
  console.log(`   ❌ MISSING ASSIGNMENTS: ${productsWithPrimaryCategoryId.length - (assignments?.length || 0)}`);

  console.log(`\n   🐛 ROOT CAUSE:`);
  console.log(`      Products have their 'primary_category_id' foreign key set correctly,`);
  console.log(`      BUT the corresponding 'product_category_assignments' records are missing.`);
  console.log(`      The getProductCategories() function counts via the assignments table,`);
  console.log(`      so it shows 0 for categories that have no assignment records.`);

  console.log(`\n   ✅ SOLUTION:`);
  console.log(`      Create product_category_assignments records for all products that`);
  console.log(`      have a primary_category_id but no assignment record.`);

  console.log('\n' + '='.repeat(80));
}

detailedAnalysis().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
