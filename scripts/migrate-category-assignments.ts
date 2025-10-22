/**
 * Migration script to populate missing product_category_assignments
 *
 * This script fixes the issue where products have primary_category_id set
 * but no corresponding record in product_category_assignments table.
 *
 * Usage:
 *   pnpm tsx scripts/migrate-category-assignments.ts --dry-run  # Preview changes
 *   pnpm tsx scripts/migrate-category-assignments.ts            # Execute migration
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const isDryRun = process.argv.includes('--dry-run');

interface CategoryMap {
  [key: string]: string; // category name/slug -> category_id
}

interface MigrationStats {
  totalProducts: number;
  productsWithPrimaryCategory: number;
  productsWithAssignments: number;
  assignmentsCreated: number;
  legacyMapped: number;
  errors: number;
}

async function migrateCategoryAssignments() {
  console.log('🔄 Product Category Assignments Migration');
  console.log('='.repeat(80));
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '✅ EXECUTE (will modify database)'}`);
  console.log('='.repeat(80));

  const stats: MigrationStats = {
    totalProducts: 0,
    productsWithPrimaryCategory: 0,
    productsWithAssignments: 0,
    assignmentsCreated: 0,
    legacyMapped: 0,
    errors: 0,
  };

  // Get all sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, subdomain')
    .order('created_at');

  if (!sites || sites.length === 0) {
    console.log('⚠️  No sites found');
    return;
  }

  console.log(`\n📍 Found ${sites.length} site(s)\n`);

  // Process each site
  for (const site of sites) {
    await migrateSite(site.id, site.name, site.subdomain, stats);
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Migration Summary:');
  console.log('='.repeat(80));
  console.log(`   Total products processed: ${stats.totalProducts}`);
  console.log(`   Products with primary_category_id: ${stats.productsWithPrimaryCategory}`);
  console.log(`   Products with existing assignments: ${stats.productsWithAssignments}`);
  console.log(`   Products mapped from legacy field: ${stats.legacyMapped}`);
  if (isDryRun) {
    console.log(`   Assignments that would be created: ${stats.assignmentsCreated}`);
  } else {
    console.log(`   ✅ Assignments created: ${stats.assignmentsCreated}`);
  }
  if (stats.errors > 0) {
    console.log(`   ❌ Errors: ${stats.errors}`);
  }
  console.log('='.repeat(80));

  if (isDryRun) {
    console.log('\n💡 Run without --dry-run to execute the migration');
  } else {
    console.log('\n✅ Migration complete!');
  }
}

async function migrateSite(
  siteId: string,
  siteName: string,
  siteSubdomain: string,
  stats: MigrationStats
) {
  console.log(`\n🏢 Site: ${siteName} (${siteSubdomain})`);
  console.log('-'.repeat(80));

  // Get all categories for this site
  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name, slug')
    .eq('site_id', siteId)
    .eq('is_active', true);

  if (!categories || categories.length === 0) {
    console.log('   ⚠️  No categories found for this site\n');
    return;
  }

  // Build category lookup maps
  const categoryByName: CategoryMap = {};
  const categoryBySlug: CategoryMap = {};

  categories.forEach((cat) => {
    categoryByName[cat.name.toLowerCase()] = cat.id;
    categoryBySlug[cat.slug.toLowerCase()] = cat.id;
  });

  console.log(`   📂 Categories: ${categories.length}`);

  // Get all products for this site
  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      name,
      category,
      primary_category_id
    `)
    .eq('site_id', siteId);

  if (!products || products.length === 0) {
    console.log('   ⚠️  No products found for this site\n');
    return;
  }

  stats.totalProducts += products.length;
  console.log(`   📦 Products: ${products.length}`);

  // Get existing assignments
  const { data: existingAssignments } = await supabase
    .from('product_category_assignments')
    .select('product_id')
    .in('product_id', products.map(p => p.id));

  const productsWithAssignments = new Set(
    (existingAssignments || []).map(a => a.product_id)
  );

  stats.productsWithAssignments += productsWithAssignments.size;

  // Process products that need migration
  const assignmentsToCreate = [];
  const productsNeedingMapping = [];

  for (const product of products) {
    // Skip if already has assignment
    if (productsWithAssignments.has(product.id)) {
      continue;
    }

    let categoryIdToAssign = product.primary_category_id;

    // If no primary_category_id, try to map from legacy category field
    if (!categoryIdToAssign && product.category) {
      const legacyCategory = product.category.toLowerCase();

      // Try exact name match first
      categoryIdToAssign = categoryByName[legacyCategory];

      // Try slug match
      if (!categoryIdToAssign) {
        const slug = legacyCategory.replace(/\s+/g, '-');
        categoryIdToAssign = categoryBySlug[slug];
      }

      if (categoryIdToAssign) {
        productsNeedingMapping.push({
          productId: product.id,
          productName: product.name,
          legacyCategory: product.category,
          mappedCategoryId: categoryIdToAssign,
        });
        stats.legacyMapped++;

        // Update the product's primary_category_id if we found a match
        if (!isDryRun) {
          await supabase
            .from('products')
            .update({ primary_category_id: categoryIdToAssign })
            .eq('id', product.id);
        }
      }
    }

    if (categoryIdToAssign) {
      stats.productsWithPrimaryCategory++;
      assignmentsToCreate.push({
        product_id: product.id,
        category_id: categoryIdToAssign,
        is_primary: true,
        sort_order: 0,
      });
    }
  }

  // Report on legacy mappings
  if (productsNeedingMapping.length > 0) {
    console.log(`\n   🔄 Mapping ${productsNeedingMapping.length} products from legacy category field:`);
    productsNeedingMapping.slice(0, 5).forEach((mapping) => {
      const categoryName = categories.find(c => c.id === mapping.mappedCategoryId)?.name || 'Unknown';
      console.log(`      "${mapping.productName}" (${mapping.legacyCategory}) → ${categoryName}`);
    });
    if (productsNeedingMapping.length > 5) {
      console.log(`      ... and ${productsNeedingMapping.length - 5} more`);
    }
  }

  // Create assignments
  if (assignmentsToCreate.length > 0) {
    console.log(`\n   ${isDryRun ? '🔍' : '✅'} ${isDryRun ? 'Would create' : 'Creating'} ${assignmentsToCreate.length} category assignments...`);

    if (!isDryRun) {
      const { error } = await supabase
        .from('product_category_assignments')
        .insert(assignmentsToCreate);

      if (error) {
        console.error(`      ❌ Error creating assignments:`, error.message);
        stats.errors++;
      } else {
        console.log(`      ✅ Successfully created ${assignmentsToCreate.length} assignments`);
        stats.assignmentsCreated += assignmentsToCreate.length;
      }
    } else {
      stats.assignmentsCreated += assignmentsToCreate.length;
      console.log(`      Preview: Would insert ${assignmentsToCreate.length} records into product_category_assignments`);
    }
  } else {
    console.log(`\n   ✓ No assignments needed - all products already have assignments`);
  }
}

// Run migration
migrateCategoryAssignments().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
