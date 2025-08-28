#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSites() {
  console.log('🔍 Checking for existing sites...\n')
  
  // Get all sites
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
  
  if (sitesError) {
    console.error('❌ Error fetching sites:', sitesError.message)
    return
  }
  
  if (!sites || sites.length === 0) {
    console.log('❌ No sites found in database')
    console.log('\nYou need to create a site first before seeding content.')
    console.log('Go to your dashboard and create a new site, then use its ID.')
    return
  }
  
  console.log(`✅ Found ${sites.length} site(s):\n`)
  sites.forEach((site, index) => {
    console.log(`${index + 1}. ${site.name || 'Unnamed Site'}`)
    console.log(`   ID: ${site.id}`)
    console.log(`   Domain: No domain field`)
    console.log(`   Created: ${new Date(site.created_at).toLocaleDateString()}`)
    console.log('')
  })
  
  // Check for existing content
  const siteId = sites[0].id
  console.log(`\n📄 Checking content for first site (${sites[0].name})...\n`)
  
  const { data: content, error: contentError } = await supabase
    .from('content')
    .select('id, title, content_type, meta_data, created_at')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (contentError) {
    console.error('❌ Error fetching content:', contentError.message)
    return
  }
  
  if (!content || content.length === 0) {
    console.log('📭 No content found for this site')
    console.log(`\n💡 To seed demo content, run:`)
    console.log(`   pnpm seed:demo-content ${siteId}\n`)
  } else {
    console.log(`📚 Found ${content.length} content items:`)
    content.forEach(item => {
      const layout = item.meta_data?.layout || 'unknown'
      console.log(`   - ${item.title} (${layout} layout)`)
    })
    
    console.log(`\n💡 To add more demo content, run:`)
    console.log(`   pnpm seed:demo-content ${siteId}\n`)
  }
}

checkSites()