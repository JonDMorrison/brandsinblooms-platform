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

console.log('🔍 Debug Info:')
console.log('Supabase URL:', supabaseUrl)
console.log('Using Anon Key:', supabaseAnonKey ? 'Yes' : 'No')
console.log('')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const siteId = process.argv[2] || '14a3a999-b698-437f-90a8-f89842f10d08'

console.log(`Trying to fetch site: ${siteId}`)

// Try different queries
console.log('\n1. Query with eq:')
const { data: site1, error: error1 } = await supabase
  .from('sites')
  .select('*')
  .eq('id', siteId)
  .single()

console.log('Result:', site1 ? 'Found' : 'Not found')
if (error1) console.log('Error:', error1.message)

console.log('\n2. Query all sites:')
const { data: sites, error: error2 } = await supabase
  .from('sites')
  .select('id, name')

console.log('Sites found:', sites?.length || 0)
sites?.forEach(s => console.log(`  - ${s.id}: ${s.name}`))
if (error2) console.log('Error:', error2.message)