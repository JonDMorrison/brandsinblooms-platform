#!/usr/bin/env tsx

/**
 * Migration script to generate slugs for existing products
 * 
 * This script:
 * 1. Queries all products without slugs
 * 2. Generates unique slugs for each
 * 3. Updates products in batches
 * 4. Logs progress and any errors
 * 
 * Usage: pnpm tsx scripts/generate-existing-slugs.ts
 */

import { createClient } from '@supabase/supabase-js'
import { generateUniqueSlug } from '../src/lib/utils/slug'
import type { Database } from '../src/lib/database/types'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

// Verify required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

// Configuration
const BATCH_SIZE = 100 // Process products in batches
const DELAY_BETWEEN_BATCHES = 1000 // 1 second delay between batches to avoid rate limiting

interface ProductToUpdate {
  id: string
  name: string
  site_id: string
  slug: string | null
}

/**
 * Generate slugs for a batch of products
 */
async function generateSlugsForBatch(products: ProductToUpdate[]): Promise<Array<{ id: string; slug: string }>> {
  const results: Array<{ id: string; slug: string }> = []
  
  for (const product of products) {
    try {
      const slug = await generateUniqueSlug(
        supabase,
        product.name,
        product.site_id,
        product.id
      )
      results.push({ id: product.id, slug })
    } catch (error) {
      console.error(`❌ Failed to generate slug for product ${product.id} (${product.name}):`, error)
    }
  }
  
  return results
}

/**
 * Update products with generated slugs
 */
async function updateProductSlugs(updates: Array<{ id: string; slug: string }>): Promise<number> {
  let successCount = 0
  
  // Update products one by one to handle individual errors
  for (const update of updates) {
    const { error } = await supabase
      .from('products')
      .update({ slug: update.slug })
      .eq('id', update.id)
    
    if (error) {
      console.error(`❌ Failed to update product ${update.id}:`, error)
    } else {
      successCount++
    }
  }
  
  return successCount
}

/**
 * Main migration function
 */
async function migrateExistingSlugs() {
  console.log('🚀 Starting slug migration for existing products...\n')
  
  try {
    // Count total products without slugs
    const { count: totalCount, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .or('slug.is.null,slug.eq.')
    
    if (countError) {
      throw new Error(`Failed to count products: ${countError.message}`)
    }
    
    if (!totalCount || totalCount === 0) {
      console.log('✅ No products need slug generation. All products already have slugs!')
      return
    }
    
    console.log(`📊 Found ${totalCount} products without slugs\n`)
    
    let processedCount = 0
    let successCount = 0
    let offset = 0
    
    // Process in batches
    while (processedCount < totalCount) {
      // Fetch batch of products without slugs
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, name, site_id, slug')
        .or('slug.is.null,slug.eq.')
        .range(offset, offset + BATCH_SIZE - 1)
      
      if (fetchError) {
        console.error(`❌ Failed to fetch products batch at offset ${offset}:`, fetchError)
        break
      }
      
      if (!products || products.length === 0) {
        break
      }
      
      console.log(`\n📦 Processing batch ${Math.floor(offset / BATCH_SIZE) + 1} (${products.length} products)...`)
      
      // Generate slugs for batch
      const slugUpdates = await generateSlugsForBatch(products as ProductToUpdate[])
      
      if (slugUpdates.length > 0) {
        // Update products with generated slugs
        const updated = await updateProductSlugs(slugUpdates)
        successCount += updated
        console.log(`  ✅ Updated ${updated}/${slugUpdates.length} products`)
      }
      
      processedCount += products.length
      offset += BATCH_SIZE
      
      // Progress update
      const percentage = Math.round((processedCount / totalCount) * 100)
      console.log(`  📊 Progress: ${processedCount}/${totalCount} (${percentage}%)`)
      
      // Delay between batches to avoid rate limiting
      if (processedCount < totalCount) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(50))
    console.log('🎉 Migration Complete!')
    console.log('='.repeat(50))
    console.log(`📊 Total products processed: ${processedCount}`)
    console.log(`✅ Successfully updated: ${successCount}`)
    console.log(`❌ Failed updates: ${processedCount - successCount}`)
    
    if (processedCount - successCount > 0) {
      console.log('\n⚠️  Some products failed to update. Please check the error logs above.')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrateExistingSlugs()
  .then(() => {
    console.log('\n✨ Slug migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  })