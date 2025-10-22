/**
 * Script to analyze current category state in the database
 * Helps understand the legacy vs modern category system usage
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in environment');
  console.error('   Make sure .env.local exists and contains the required keys');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeCategories() {
  console.log('📊 Analyzing Category System State\n');
  console.log('='.repeat(80));

  // Get all sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, subdomain')
    .order('created_at', { ascending: true });

  if (!sites || sites.length === 0) {
    console.error('No sites found');
    return;
  }

  console.log(`\n📍 Found ${sites.length} site(s) in database:\n`);
  sites.forEach((site, idx) => {
    console.log(`   ${idx + 1}. ${site.name} (${site.subdomain}) - ID: ${site.id}`);
  });

  // Analyze each site
  for (const site of sites) {
    await analyzeSite(site.id, site.name, site.subdomain);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Analysis Complete\n');
}

async function analyzeSite(siteId: string, siteName: string, siteSubdomain: string) {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`🏢 Analyzing Site: ${siteName} (${siteSubdomain})`);
  console.log(`   Site ID: ${siteId}`);
  console.log('='.repeat(80));

  // 1. Get all modern categories
  console.log('📂 Modern Categories (product_categories table):');
  console.log('-'.repeat(80));
  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name, slug, is_active, sort_order')
    .eq('site_id', siteId)
    .order('sort_order', { ascending: true });

  if (categories && categories.length > 0) {
    categories.forEach((cat) => {
      console.log(`   ✓ ${cat.name} (${cat.slug}) - Active: ${cat.is_active}`);
    });
  } else {
    console.log('   ⚠️  No categories found');
  }

  // 2. Get all products with their category information
  console.log('\n\n📦 Products Analysis:');
  console.log('-'.repeat(80));
  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      name,
      category,
      primary_category_id,
      primary_category:product_categories!products_primary_category_id_fkey (
        id,
        name,
        slug
      )
    `)
    .eq('site_id', siteId);

  if (!products || products.length === 0) {
    console.log('   ⚠️  No products found');
    return;
  }

  console.log(`   Total products: ${products.length}\n`);

  // 3. Analyze category field usage
  const legacyCategoryUsage = new Map<string, number>();
  const modernCategoryUsage = new Map<string, number>();
  const noCategoryProducts: any[] = [];

  products.forEach((product) => {
    // Count legacy category field usage
    if (product.category) {
      legacyCategoryUsage.set(
        product.category,
        (legacyCategoryUsage.get(product.category) || 0) + 1
      );
    }

    // Count modern primary_category_id usage
    if (product.primary_category_id) {
      const catName = (product.primary_category as any)?.name || 'Unknown';
      modernCategoryUsage.set(
        catName,
        (modernCategoryUsage.get(catName) || 0) + 1
      );
    }

    // Track products with no category
    if (!product.category && !product.primary_category_id) {
      noCategoryProducts.push(product);
    }
  });

  console.log('   🏷️  Legacy Category Field Usage (string field):');
  if (legacyCategoryUsage.size > 0) {
    legacyCategoryUsage.forEach((count, category) => {
      console.log(`      "${category}": ${count} products`);
    });
  } else {
    console.log('      ✓ No products using legacy category field');
  }

  console.log('\n   🔗 Modern Category Assignments (primary_category_id):');
  if (modernCategoryUsage.size > 0) {
    modernCategoryUsage.forEach((count, category) => {
      console.log(`      "${category}": ${count} products`);
    });
  } else {
    console.log('      ⚠️  No products using modern category system');
  }

  if (noCategoryProducts.length > 0) {
    console.log(`\n   ⚠️  Products with NO category: ${noCategoryProducts.length}`);
    noCategoryProducts.forEach((p) => {
      console.log(`      - ${p.name}`);
    });
  }

  // 4. Check product_category_assignments table
  console.log('\n\n🔗 Product Category Assignments:');
  console.log('-'.repeat(80));
  const { data: assignments, count } = await supabase
    .from('product_category_assignments')
    .select('product_id, category_id, is_primary', { count: 'exact' })
    .in('product_id', products.map((p) => p.id));

  console.log(`   Total assignments: ${count || 0}`);
  if (assignments && assignments.length > 0) {
    const primaryCount = assignments.filter((a) => a.is_primary).length;
    console.log(`   Primary assignments: ${primaryCount}`);
    console.log(`   Secondary assignments: ${assignments.length - primaryCount}`);
  }

  // 5. Identify migration needs
  console.log('\n\n🔧 Migration Analysis:');
  console.log('-'.repeat(80));
  const productsNeedingMigration = products.filter(
    (p) => p.category && !p.primary_category_id
  );

  if (productsNeedingMigration.length > 0) {
    console.log(`   ⚠️  ${productsNeedingMigration.length} products need migration from legacy to modern system:`);

    // Group by legacy category
    const byLegacyCategory = new Map<string, any[]>();
    productsNeedingMigration.forEach((p) => {
      if (!byLegacyCategory.has(p.category!)) {
        byLegacyCategory.set(p.category!, []);
      }
      byLegacyCategory.get(p.category!)!.push(p);
    });

    byLegacyCategory.forEach((prods, legacyCat) => {
      console.log(`\n      Legacy category "${legacyCat}" (${prods.length} products):`);

      // Try to find matching modern category
      const matchingCategory = categories?.find(
        (c) => c.name.toLowerCase() === legacyCat.toLowerCase() ||
               c.slug.toLowerCase() === legacyCat.toLowerCase().replace(/\s+/g, '-')
      );

      if (matchingCategory) {
        console.log(`         ✓ Can map to modern category: "${matchingCategory.name}" (${matchingCategory.id})`);
      } else {
        console.log(`         ⚠️  No matching modern category found - needs manual mapping or category creation`);
      }

      // Show first 3 products as examples
      prods.slice(0, 3).forEach((p) => {
        console.log(`            - ${p.name}`);
      });
      if (prods.length > 3) {
        console.log(`            ... and ${prods.length - 3} more`);
      }
    });
  } else {
    console.log('   ✓ All products are using the modern category system');
  }
}

// Run the analysis
analyzeCategories().catch((error) => {
  console.error('Error analyzing categories:', error);
  process.exit(1);
});
