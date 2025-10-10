/**
 * Seed script to create demo pages with all layout types
 * Creates one page for each layout type with rich mock data
 */

import { createClient } from '@supabase/supabase-js'
import { getEnhancedLayoutTemplate } from '../src/lib/content/templates.js'
import { MOCK_DATA_PRESETS } from '../src/lib/content/mock-data/index.js'
import { serializePageContent, mapLayoutToContentType } from '../src/lib/content/index.js'
import type { Database } from '../src/lib/database/types.js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Define demo pages to create
const demoPages = [
  {
    title: 'Landing Page Demo',
    slug: 'landing-page-demo',
    layout: 'landing' as const,
    description: 'Professional landing page with hero, features, testimonials, and pricing',
    preset: MOCK_DATA_PRESETS.technology
  },
  {
    title: 'Blog Article Demo',
    slug: 'blog-article-demo',
    layout: 'blog' as const,
    description: 'Rich blog post with comprehensive content and formatting',
    preset: MOCK_DATA_PRESETS.technology
  },
  {
    title: 'Portfolio Demo',
    slug: 'portfolio-demo',
    layout: 'portfolio' as const,
    description: 'Beautiful portfolio showcase with project gallery',
    preset: MOCK_DATA_PRESETS.creative
  },
  {
    title: 'About Us Demo',
    slug: 'about-us-demo',
    layout: 'about' as const,
    description: 'Company story with mission, values, and team profiles',
    preset: MOCK_DATA_PRESETS.consulting
  },
  {
    title: 'Product Page Demo',
    slug: 'product-page-demo',
    layout: 'product' as const,
    description: 'Detailed product showcase with specifications and pricing',
    preset: MOCK_DATA_PRESETS.retail
  },
  {
    title: 'Contact Page Demo',
    slug: 'contact-page-demo',
    layout: 'contact' as const,
    description: 'Contact form with business information and location details',
    preset: MOCK_DATA_PRESETS.technology
  },
  {
    title: 'Custom Page Demo',
    slug: 'custom-page-demo',
    layout: 'other' as const,
    description: 'Flexible custom layout with mixed content sections',
    preset: MOCK_DATA_PRESETS.nonprofit
  }
]

async function seedDemoContent() {
  console.log('🌱 Starting demo content seed...\n')

  try {
    // Get or prompt for site ID
    const siteId = process.argv[2]
    
    if (!siteId) {
      console.error('❌ Please provide a site ID as an argument:')
      console.error('   pnpm seed:demo-content <site-id>')
      console.error('\nTo find your site ID:')
      console.error('1. Go to the Sites page in the admin panel')
      console.error('2. Click on a site to see its details')
      console.error('3. The site ID is shown in the URL or site details\n')
      process.exit(1)
    }

    // Verify the site exists
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name, domain')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      console.error(`❌ Site with ID "${siteId}" not found`)
      console.error('Make sure the site ID is correct and the site exists.\n')
      process.exit(1)
    }

    console.log(`📍 Creating demo content for site: ${site.name} (${site.domain})`)
    console.log('─'.repeat(50))

    // Create demo pages
    const results = []
    
    for (const page of demoPages) {
      console.log(`\n📄 Creating ${page.title}...`)
      
      // Generate enhanced template with mock data
      const templateContent = getEnhancedLayoutTemplate(
        page.layout,
        page.title,
        page.description,
        page.preset
      )
      
      // Serialize the content for storage
      const serializedContent = serializePageContent(templateContent)
      
      // Prepare content data
      const contentData = {
        site_id: siteId,
        title: page.title,
        slug: page.slug,
        content_type: mapLayoutToContentType(page.layout),
        content: serializedContent,
        is_published: true, // Publish by default for demo
        is_featured: page.layout === 'landing', // Feature the landing page
        meta_data: {
          layout: page.layout,
          description: page.description,
          seededDemo: true,
          preset: Object.keys(MOCK_DATA_PRESETS).find(
            key => MOCK_DATA_PRESETS[key as keyof typeof MOCK_DATA_PRESETS] === page.preset
          )
        }
      }
      
      // Check if page already exists
      const { data: existing } = await supabase
        .from('content')
        .select('id')
        .eq('site_id', siteId)
        .eq('slug', page.slug)
        .single()
      
      if (existing) {
        console.log(`   ⚠️  Page already exists, updating...`)
        
        const { error: updateError } = await supabase
          .from('content')
          .update(contentData)
          .eq('id', existing.id)
        
        if (updateError) {
          console.error(`   ❌ Failed to update: ${updateError.message}`)
          results.push({ page: page.title, status: 'failed', error: updateError.message })
        } else {
          console.log(`   ✅ Updated successfully`)
          results.push({ page: page.title, status: 'updated' })
        }
      } else {
        // Create new page
        const { error: createError } = await supabase
          .from('content')
          .insert(contentData)
        
        if (createError) {
          console.error(`   ❌ Failed to create: ${createError.message}`)
          results.push({ page: page.title, status: 'failed', error: createError.message })
        } else {
          console.log(`   ✅ Created successfully`)
          results.push({ page: page.title, status: 'created' })
        }
      }
    }
    
    // Summary
    console.log('\n' + '═'.repeat(50))
    console.log('📊 SEED SUMMARY')
    console.log('─'.repeat(50))
    
    const created = results.filter(r => r.status === 'created').length
    const updated = results.filter(r => r.status === 'updated').length
    const failed = results.filter(r => r.status === 'failed').length
    
    console.log(`✅ Created: ${created} pages`)
    console.log(`🔄 Updated: ${updated} pages`)
    if (failed > 0) {
      console.log(`❌ Failed: ${failed} pages`)
      results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`   - ${r.page}: ${r.error}`)
      })
    }
    
    console.log('\n🎉 Demo content seed completed!')
    console.log('\n📍 Next steps:')
    console.log('1. Go to the Content Library to see the demo pages')
    console.log('2. Click on any page to view or edit it')
    console.log('3. The Type column now shows the specific layout type')
    console.log('4. Each page contains rich, professional mock content\n')
    
  } catch (error) {
    console.error('❌ Seed failed with error:', error)
    process.exit(1)
  }
}

// Run the seed script
seedDemoContent()