/**
 * Check active vs inactive products
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkActiveProducts() {
  const siteId = '5d8387d5-1271-446d-9980-aaf429f93a21';

  console.log('📊 Active vs Inactive Products\n');
  console.log('='.repeat(80));

  // Get all products
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, is_active, primary_category_id')
    .eq('site_id', siteId);

  const activeProducts = allProducts?.filter(p => p.is_active) || [];
  const inactiveProducts = allProducts?.filter(p => !p.is_active) || [];

  console.log(`Total products: ${allProducts?.length || 0}`);
  console.log(`Active products: ${activeProducts.length}`);
  console.log(`Inactive products: ${inactiveProducts.length}\n`);

  if (inactiveProducts.length > 0) {
    console.log('❌ Inactive Products:');
    inactiveProducts.forEach(p => {
      console.log(`   - ${p.name}`);
    });
  }

  // Now check category counts for ONLY active products
  console.log('\n\n📂 Category Counts (ACTIVE products only):\n');

  const { data: categories } = await supabase
    .from('product_categories')
    .select(`
      id,
      name,
      slug,
      product_category_assignments!product_category_assignments_category_id_fkey(
        product_id,
        product:products!product_category_assignments_product_id_fkey(
          is_active
        )
      )
    `)
    .eq('site_id', siteId)
    .eq('is_active', true);

  console.log('   Category Name                | All Products | Active Only');
  console.log('   ' + '-'.repeat(76));

  categories?.forEach((cat) => {
    const allAssignments = (cat.product_category_assignments as any[]) || [];
    const activeAssignments = allAssignments.filter(
      (a: any) => a.product?.is_active === true
    );

    const name = cat.name.padEnd(28);
    const allCount = allAssignments.length.toString().padStart(5);
    const activeCount = activeAssignments.length.toString().padStart(5);

    console.log(`   ${name} | ${allCount}        | ${activeCount}`);
  });

  console.log('\n='.repeat(80));
}

checkActiveProducts().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
